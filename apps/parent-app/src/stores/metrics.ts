import { create } from 'zustand';
import { getStudentTrend } from '@kids/utils';
import type { Dim, Period } from '@kids/utils/api/metrics';

interface TrendDataPoint {
  t: Date;
  study_minutes?: number;
  levels_completed?: number;
  retry_count?: number;
  accuracy?: number;
}

interface TrendState {
  loading: boolean;
  error?: string;
  series: TrendDataPoint[];
  fetch(
    studentId: string,
    dims: Dim[],
    period: Period,
    range?: { from?: string; to?: string },
  ): Promise<void>;
}

export const useMetricsStore = create<TrendState>((set) => ({
  loading: false,
  error: undefined,
  series: [],
  fetch: async (studentId, dims, period, range) => {
    set({ loading: true, error: undefined });
    try {
      const result = await getStudentTrend(studentId, dims, period, range?.from, range?.to);
      set({ series: result, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
