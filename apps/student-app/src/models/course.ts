export type CourseMapNode = {
  id: string;
  title: string;
  objective?: string;
  level: number;
  language: string;
  game: string;
  position: {
    x: number;
    y: number;
  };
  passed: boolean;
  unlocked: boolean;
  status: 'passed' | 'unlocked' | 'locked';
};

export type CourseMapEdge = {
  from: string;
  to: string;
};

export type CourseMapStats = {
  total: number;
  completed: number;
  unlocked: number;
};

export type CourseMapResponse = {
  language: string;
  game: string;
  nodes: CourseMapNode[];
  edges: CourseMapEdge[];
  stats: CourseMapStats;
};
