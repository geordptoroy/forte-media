import axios from 'axios';
import {
  MOCK_ADS, MOCK_DASHBOARD_STATS, MOCK_CHART_DATA, MOCK_TOP_ADVERTISERS,
  MOCK_RECENT_ADS, getMockAdHistory, MOCK_FAVORITES, MOCK_MONITORING, MOCK_AUTH_RESPONSE,
} from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('forte_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

// AUTH
export const authApi = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) { await delay(); return { ...MOCK_AUTH_RESPONSE, user: { ...MOCK_AUTH_RESPONSE.user, email } }; }
    const { data } = await http.post('/auth/login', { email, password });
    return data;
  },
  register: async (name: string, email: string, password: string) => {
    if (USE_MOCK) { await delay(); return { ...MOCK_AUTH_RESPONSE, user: { ...MOCK_AUTH_RESPONSE.user, name, email } }; }
    const { data } = await http.post('/auth/register', { name, email, password });
    return data;
  },
  me: async () => {
    if (USE_MOCK) { await delay(); return MOCK_AUTH_RESPONSE.user; }
    const { data } = await http.get('/auth/me');
    return data;
  },
};

// DASHBOARD
export const dashboardApi = {
  stats: async () => {
    if (USE_MOCK) { await delay(); return MOCK_DASHBOARD_STATS; }
    const { data } = await http.get('/dashboard/stats');
    return data;
  },
  chart: async () => {
    if (USE_MOCK) { await delay(); return MOCK_CHART_DATA; }
    const { data } = await http.get('/dashboard/chart');
    return data;
  },
  topAdvertisers: async () => {
    if (USE_MOCK) { await delay(); return MOCK_TOP_ADVERTISERS; }
    const { data } = await http.get('/dashboard/top-advertisers');
    return data;
  },
  recent: async () => {
    if (USE_MOCK) { await delay(); return MOCK_RECENT_ADS; }
    const { data } = await http.get('/dashboard/recent');
    return data;
  },
};

// ADS
export const adsApi = {
  scaled: async (params: Record<string, unknown> = {}) => {
    if (USE_MOCK) {
      await delay();
      const { page = 1, limit = 12, search = '', score_min = 0 } = params;
      let ads = MOCK_ADS.filter(a => a.is_scaled);
      if (search) ads = ads.filter(a => a.page_name.toLowerCase().includes((search as string).toLowerCase()));
      if (score_min) ads = ads.filter(a => a.score >= Number(score_min));
      const total = ads.length;
      const start = (Number(page) - 1) * Number(limit);
      return { data: ads.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit), total_pages: Math.ceil(total / Number(limit)) };
    }
    const { data } = await http.post('/ads/scaled', params);
    return data;
  },
  getById: async (id: string) => {
    if (USE_MOCK) { await delay(); return MOCK_ADS.find(a => a.id === id) || MOCK_ADS[0]; }
    const { data } = await http.get(`/ads/${id}`);
    return data;
  },
  history: async (id: string) => {
    if (USE_MOCK) { await delay(); return getMockAdHistory(id); }
    const { data } = await http.get(`/ads/${id}/history`);
    return data;
  },
};

// SEARCH
export const searchApi = {
  search: async (filters: Record<string, unknown> = {}) => {
    if (USE_MOCK) {
      await delay();
      const { page = 1, limit = 12, keywords = '', score_min = 0, media_type = '' } = filters;
      let ads = [...MOCK_ADS];
      if (keywords) ads = ads.filter(a => a.page_name.toLowerCase().includes((keywords as string).toLowerCase()));
      if (score_min) ads = ads.filter(a => a.score >= Number(score_min));
      if (media_type) ads = ads.filter(a => a.media_type === media_type);
      const total = ads.length;
      const start = (Number(page) - 1) * Number(limit);
      return { data: ads.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit), total_pages: Math.ceil(total / Number(limit)) };
    }
    const { data } = await http.post('/search', filters);
    return data;
  },
  saveSearch: async (name: string, filters: Record<string, unknown>) => {
    if (USE_MOCK) { await delay(); return { id: Date.now(), name, filters }; }
    const { data } = await http.post('/search/save', { name, filters });
    return data;
  },
};

// FAVORITES
export const favoritesApi = {
  list: async () => {
    if (USE_MOCK) { await delay(); return MOCK_FAVORITES; }
    const { data } = await http.get('/favorites');
    return data;
  },
  add: async (adId: string, folderName = 'Geral', notes?: string) => {
    if (USE_MOCK) { await delay(); return { success: true }; }
    const { data } = await http.post('/favorites', { ad_id: adId, folder_name: folderName, notes });
    return data;
  },
  remove: async (adId: string) => {
    if (USE_MOCK) { await delay(); return { success: true }; }
    const { data } = await http.delete(`/favorites/${adId}`);
    return data;
  },
};

// MONITORING
export const monitoringApi = {
  list: async () => {
    if (USE_MOCK) { await delay(); return MOCK_MONITORING; }
    const { data } = await http.get('/monitoring');
    return data;
  },
  add: async (adId: string, alertConfig?: Record<string, unknown>) => {
    if (USE_MOCK) { await delay(); return { success: true }; }
    const { data } = await http.post('/monitoring', { ad_id: adId, alert_config: alertConfig });
    return data;
  },
  remove: async (adId: string) => {
    if (USE_MOCK) { await delay(); return { success: true }; }
    const { data } = await http.delete(`/monitoring/${adId}`);
    return data;
  },
  history: async (adId: string) => {
    if (USE_MOCK) { await delay(); return getMockAdHistory(adId); }
    const { data } = await http.get(`/monitoring/${adId}/history`);
    return data;
  },
};

// REPORTS
export const reportsApi = {
  export: async (period: string, format: string, metrics: string[]) => {
    if (USE_MOCK) { await delay(800); return { success: true, url: `#mock-report-${Date.now()}.${format}` }; }
    const { data } = await http.post('/reports/export', { period, format, metrics });
    return data;
  },
};

// SYNC
export const syncApi = {
  trigger: async () => {
    if (USE_MOCK) { await delay(); return { success: true, message: 'Sincronização simulada' }; }
    const { data } = await http.post('/sync/trigger');
    return data;
  },
  status: async () => {
    if (USE_MOCK) { await delay(); return { status: 'idle', last_sync: new Date(Date.now() - 3600000).toISOString() }; }
    const { data } = await http.get('/sync/status');
    return data;
  },
};
