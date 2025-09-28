import { create } from 'zustand';
import ky from 'ky';

interface StudentClass {
  id: string;
  name: string;
  description: string;
  teacherName: string;
}

interface StudentClassState {
  myClasses: StudentClass[];
  loading: boolean;
  error: string | null;
}

interface StudentClassActions {
  joinClass: (code: string) => Promise<boolean>;
  fetchMyClasses: () => Promise<void>;
}

const api = ky.create({ prefixUrl: '/api' });

export const useStudentClassStore = create<StudentClassState & StudentClassActions>((set) => ({
  myClasses: [],
  loading: false,
  error: null,

  joinClass: async (code) => {
    set({ loading: true, error: null });
    try {
      await api.post('classes/join', { json: { code } });
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to join class. The code may be invalid or expired.', loading: false });
      return false;
    }
  },

  fetchMyClasses: async () => {
    set({ loading: true, error: null });
    try {
      // This endpoint doesn't exist yet in our M7 mock API, so we'll mock the return
      // const classes = await api.get('students/my-classes').json<StudentClass[]>();
      const mockClasses: StudentClass[] = [
        { id: 'class_1', name: '七年级A班', description: '语文、数学、英语', teacherName: '王老师' },
        { id: 'class_2', name: 'Python兴趣小组', description: '学习Python编程', teacherName: '李老师' },
      ];
      set({ myClasses: mockClasses, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch classes', loading: false });
    }
  },
}));
