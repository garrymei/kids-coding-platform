import { create } from 'zustand';
import ky from 'ky';

// Types based on M7 and mock data
interface StudentSearchResult {
  id: string;
  name: string;
  avatar?: string;
}

interface LinkRequest {
  id: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface RequestState {
  searchResults: StudentSearchResult[];
  requests: LinkRequest[];
  loading: boolean;
  error: string | null;
}

interface RequestActions {
  discoverStudents: (query: string) => Promise<void>;
  createLinkRequest: (studentId: string, note?: string) => Promise<void>;
  fetchRequests: (status: 'pending' | 'approved' | 'rejected') => Promise<void>;
}

const api = ky.create({ prefixUrl: '/api' }); // Assuming API is proxied

export const useRequestStore = create<RequestState & RequestActions>((set) => ({
  searchResults: [],
  requests: [],
  loading: false,
  error: null,

  discoverStudents: async (query) => {
    set({ loading: true, error: null });
    try {
      const results = await api.get('parents/discover-students', { searchParams: { q: query } }).json<StudentSearchResult[]>();
      set({ searchResults: results, loading: false });
    } catch (error) {
      set({ error: 'Failed to search for students', loading: false });
    }
  },

  createLinkRequest: async (studentId, note) => {
    set({ loading: true, error: null });
    try {
      await api.post('parents/link-requests', { json: { studentId, note } });
      // After creating, maybe refresh the pending list?
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to create link request', loading: false });
    }
  },

  fetchRequests: async (status) => {
    set({ loading: true, error: null });
    try {
      const results = await api.get('parents/link-requests', { searchParams: { status } }).json<LinkRequest[]>();
      set({ requests: results, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch requests', loading: false });
    }
  },
}));
