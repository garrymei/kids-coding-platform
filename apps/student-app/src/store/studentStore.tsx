import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

// --- STATE AND TYPES ---
export interface CourseSummary {
  id: string;
  title: string;
  progress: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  tags: string[];
}

interface StudentState {
  displayName: string;
  streakDays: number;
  xp: number;
  avatarUrl?: string;
  focusCourseId: string | null;
  courses: CourseSummary[];
}

const initialState: StudentState = {
  displayName: '小明',
  streakDays: 5,
  xp: 1280,
  avatarUrl: undefined,
  focusCourseId: 'intro-python',
  courses: [
    {
      id: 'intro-python',
      title: 'Python 新手村',
      lessonsTotal: 24,
      lessonsCompleted: 8,
      progress: 33,
      tags: ['Blockly', '冒险'],
    },
    {
      id: 'logic-lab',
      title: '逻辑闯关训练营',
      lessonsTotal: 18,
      lessonsCompleted: 12,
      progress: 67,
      tags: ['算法思维'],
    },
    {
      id: 'game-maker',
      title: '像素小游戏工坊',
      lessonsTotal: 15,
      lessonsCompleted: 4,
      progress: 27,
      tags: ['创意编程'],
    },
  ],
};

// --- REDUCER ---
type StudentAction =
  | { type: 'complete-lesson'; courseId: string }
  | { type: 'set-focus-course'; courseId: string };

function studentReducer(state: StudentState, action: StudentAction): StudentState {
  switch (action.type) {
    case 'complete-lesson': {
      return {
        ...state,
        xp: state.xp + 30,
        streakDays: state.streakDays + 1,
        courses: state.courses.map((course) => {
          if (course.id !== action.courseId) return course;
          const completed = Math.min(course.lessonsTotal, course.lessonsCompleted + 1);
          const progress = Math.round((completed / course.lessonsTotal) * 100);
          return { ...course, lessonsCompleted: completed, progress };
        }),
      };
    }
    case 'set-focus-course': {
      return { ...state, focusCourseId: action.courseId };
    }
    default:
      return state;
  }
}

// --- CONTEXTS (SPLIT PATTERN) ---
interface StudentActions {
  completeLesson(courseId: string): void;
  setFocusCourse(courseId: string): void;
}

const StudentStateContext = createContext<StudentState | undefined>(undefined);
const StudentActionsContext = createContext<StudentActions | undefined>(undefined);

// --- PROVIDER ---
export function StudentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  const actions = useMemo<StudentActions>(
    () => ({
      completeLesson(courseId) {
        dispatch({ type: 'complete-lesson', courseId });
      },
      setFocusCourse(courseId) {
        dispatch({ type: 'set-focus-course', courseId });
      },
    }),
    [], // Actions are stable and don't depend on state
  );

  return (
    <StudentStateContext.Provider value={state}>
      <StudentActionsContext.Provider value={actions}>{children}</StudentActionsContext.Provider>
    </StudentStateContext.Provider>
  );
}

// --- HOOKS ---
export function useStudentState() {
  const context = useContext(StudentStateContext);
  if (!context) {
    throw new Error('useStudentState must be used within StudentProvider');
  }
  return context;
}

export function useStudentActions() {
  const context = useContext(StudentActionsContext);
  if (!context) {
    throw new Error('useStudentActions must be used within StudentProvider');
  }
  return context;
}
