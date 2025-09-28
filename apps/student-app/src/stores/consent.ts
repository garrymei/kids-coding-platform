import { create } from 'zustand';
import ky from 'ky';

// Types based on M7 and mock data
interface ConsentRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  note?: string;
  createdAt: string;
}

interface ConsentState {
  consents: ConsentRequest[];
  loading: boolean;
  error: string | null;
}

interface ConsentActions {
  fetchConsents: (status: 'pending' | 'approved' | 'rejected' | 'revoked') => Promise<void>;
  approveConsent: (requestId: string) => Promise<void>;
  rejectConsent: (requestId: string) => Promise<void>;
  revokeConsent: (requestId: string) => Promise<void>;
}

const api = ky.create({ prefixUrl: '/api' }); // Assuming API is proxied

export const useConsentStore = create<ConsentState & ConsentActions>((set, get) => ({
  consents: [],
  loading: false,
  error: null,

  fetchConsents: async (status) => {
    set({ loading: true, error: null });
    try {
      const results = await api.get('students/consents', { searchParams: { status } }).json<ConsentRequest[]>();
      set({ consents: results, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch consent requests', loading: false });
    }
  },

  approveConsent: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`students/consents/${requestId}/approve`);
      // Refresh the list after action
      const status = get().consents[0]?.status || 'pending'; // A bit of a hack to know which list to refresh
      get().fetchConsents(status);
    } catch (error) {
      set({ error: 'Failed to approve consent', loading: false });
    }
  },

  rejectConsent: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`students/consents/${requestId}/reject`);
      const status = get().consents[0]?.status || 'pending';
      get().fetchConsents(status);
    } catch (error) {
      set({ error: 'Failed to reject consent', loading: false });
    }
  },

  revokeConsent: async (requestId) => {
    set({ loading: true, error: null });
    try {
      await api.post(`students/consents/${requestId}/revoke`);
      const status = get().consents[0]?.status || 'approved';
      get().fetchConsents(status);
    } catch (error) {
      set({ error: 'Failed to revoke consent', loading: false });
    }
  },
}));
