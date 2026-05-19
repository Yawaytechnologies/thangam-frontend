import api from '../lib/axios';

export interface GlobalSearchResult {
  branches: SearchHit[];
  admins: SearchHit[];
  members: SearchHit[];
  properties: SearchHit[];
  bookings: SearchHit[];
  billings: SearchHit[];
}

export interface SearchHit {
  id: string;
  label: string;
  sublabel?: string;
  type: 'branch' | 'admin' | 'member' | 'property' | 'booking' | 'billing';
}

export const searchApi = {
  globalSearch: (query: string): Promise<GlobalSearchResult> =>
    api.get('/search/global', { params: { query } }).then((r) => r.data.data),
};
