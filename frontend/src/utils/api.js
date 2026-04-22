import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nse_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nse_token');
      localStorage.removeItem('nse_user');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── API Methods ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const ideasAPI = {
  list: (params) => api.get('/ideas', { params }),
  get: (id) => api.get(`/ideas/${id}`),
  generate: (data) => api.post('/ideas/generate', data),
  save: (id) => api.post(`/ideas/${id}/save`),
  similar: (id) => api.get(`/ideas/${id}/similar`),
};

export const signalsAPI = {
  list: (params) => api.get('/signals', { params }),
  get: (id) => api.get(`/signals/${id}`),
  heatmap: () => api.get('/signals/heatmap'),
  trending: () => api.get('/signals/meta/trending'),
};

export const trendsAPI = {
  get: () => api.get('/trends'),
};

export const clustersAPI = {
  list: () => api.get('/clusters'),
  get: (id) => api.get(`/clusters/${id}`),
};

export const watchlistAPI = {
  list: () => api.get('/watchlist'),
  create: (data) => api.post('/watchlist', data),
  addIdea: (id, ideaId) => api.post(`/watchlist/${id}/add-idea`, { ideaId }),
  delete: (id) => api.delete(`/watchlist/${id}`),
};

export const validationAPI = {
  get: (id) => api.get(`/validation/${id}`),
  custom: (data) => api.post('/validation/custom', data),
};

export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
};

export const usersAPI = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  usage: () => api.get('/users/usage'),
};

export default api;
