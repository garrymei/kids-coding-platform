import { create } from 'zustand';
import ky from 'ky';

// Types based on M7 and mock data
interface Class {
  id: string;
  name: string;
  code: string;
}

interface Approval {
  memberId: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface ClassState {
  classes: Class[];
  approvals: Approval[];
  loading: boolean;
  error: string | null;
}

interface ClassActions {
  createClass: (name: string) => Promise<void>;
  fetchApprovals: (classId: string, status: string) => Promise<void>;
  approveApproval: (classId: string, memberId: string) => Promise<void>;
  rejectApproval: (classId: string, memberId: string) => Promise<void>;
}

const api = ky.create({ prefixUrl: '/api' }); // Assuming API is proxied

export const useClassStore = create<ClassState & ClassActions>((set, get) => ({
  classes: [],
  approvals: [],
  loading: false,
  error: null,

  createClass: async (name) => {
    set({ loading: true, error: null });
    try {
      await api.post('teachers/classes', { json: { name } });
      // In a real app, you'd probably fetch the class list again
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to create class', loading: false });
    }
  },

  fetchApprovals: async (classId, status) => {
    set({ loading: true, error: null });
    try {
      const results = await api.get(`teachers/classes/${classId}/approvals`, { searchParams: { status } }).json<Approval[]>();
      set({ approvals: results, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch approvals', loading: false });
    }
  },

  approveApproval: async (classId, memberId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`teachers/classes/${classId}/approvals/${memberId}/approve`);
      get().fetchApprovals(classId, 'pending'); // Refresh pending list
    } catch (error) {
      set({ error: 'Failed to approve request', loading: false });
    }
  },

  rejectApproval: async (classId, memberId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`teachers/classes/${classId}/approvals/${memberId}/reject`);
      get().fetchApprovals(classId, 'pending'); // Refresh pending list
    } catch (error) {
      set({ error: 'Failed to reject request', loading: false });
    }
  },
}));
