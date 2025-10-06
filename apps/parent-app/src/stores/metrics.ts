import { create } from 'zustand';
import { getStudentTrend } from '@kids/utils';
import type { Dim, Period } from '@kids/utils';

interface TrendDataPoint {
  t: Date;
  [key: string]: number | Date;
}

interface TrendState {
  loading: boolean;
  error?: string;
  series: TrendDataPoint[];
  fetchTrend(
    studentId: string,
    dims: Dim[],
    period: Period,
    range?: { from?: string; to?: string }
  ): Promise<void>;
}

export const useMetricsStore = create<TrendState>((set) => ({
  loading: false,
  error: undefined,
  series: [],
  async fetchTrend(studentId, dims, period, range) {
    set({ loading: true, error: undefined });
    try {
      const result = await getStudentTrend(studentId, dims, period, range?.from, range?.to);
      set({ series: result as TrendDataPoint[], loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message, loading: false });
    }
  },
}));