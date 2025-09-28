import { create } from 'zustand';
import { getStudentTrend, postClassCompare, Dim, Period } from '@kids/utils/api/metrics';

interface TrendDataPoint {
  t: Date;
  [key: string]: number | Date;
}

interface ComparisonRow {
  studentId: string;
  name: string;
  [key: string]: number | string;
}

interface MetricsState {
  trendLoading: boolean;
  compareLoading: boolean;
  error?: string;
  trendSeries: TrendDataPoint[];
  compareRows: ComparisonRow[];
  fetchTrend(studentId: string, dims: Dim[], period: Period, range?: { from?: string; to?: string }): Promise<void>;
  fetchCompare(classId: string, dims: Dim[], period: Period, bucketISO: string): Promise<void>;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  trendLoading: false,
  compareLoading: false,
  error: undefined,
  trendSeries: [],
  compareRows: [],

  fetchTrend: async (studentId, dims, period, range) => {
    set({ trendLoading: true, error: undefined });
    try {
      const result = await getStudentTrend(studentId, dims, period, range?.from, range?.to);
      set({ trendSeries: result, trendLoading: false });
    } catch (e: any) {
      set({ error: e.message, trendLoading: false });
    }
  },

  fetchCompare: async (classId, dims, period, bucketISO) => {
    set({ compareLoading: true, error: undefined });
    try {
      const result = await postClassCompare(classId, dims, period, bucketISO);
      set({ compareRows: result, compareLoading: false });
    } catch (e: any) {
      set({ error: e.message, compareLoading: false });
    }
  },
}));
