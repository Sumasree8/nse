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

// ── Currency Formatter ───────────────────────────────────────────────────────
// Maps country code → { locale, currency, symbol }
const CURRENCY_MAP = {
  IN: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
  US: { locale: 'en-US', currency: 'USD', symbol: '$' },
  GB: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  EU: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  JP: { locale: 'ja-JP', currency: 'JPY', symbol: '¥' },
  CN: { locale: 'zh-CN', currency: 'CNY', symbol: '¥' },
  AU: { locale: 'en-AU', currency: 'AUD', symbol: 'A$' },
  CA: { locale: 'en-CA', currency: 'CAD', symbol: 'C$' },
  SG: { locale: 'en-SG', currency: 'SGD', symbol: 'S$' },
  AE: { locale: 'ar-AE', currency: 'AED', symbol: 'د.إ' },
  BR: { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' },
  DE: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  FR: { locale: 'fr-FR', currency: 'EUR', symbol: '€' },
};

// Exchange rates vs USD (approximate — replace with live API in production)
const USD_RATES = {
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  JPY: 149.5,
  CNY: 7.24,
  AUD: 1.53,
  CAD: 1.36,
  SGD: 1.34,
  AED: 3.67,
  BRL: 4.97,
  USD: 1,
};

// Detect user country from browser locale (best-effort, no API needed)
function detectCountry() {
  try {
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    // e.g. "en-IN" → "IN", "hi-IN" → "IN"
    const tag = new Intl.Locale(locale);
    return tag.region || 'US';
  } catch {
    return 'US';
  }
}

const USER_COUNTRY = detectCountry();
const CURR = CURRENCY_MAP[USER_COUNTRY] || CURRENCY_MAP['US'];

/**
 * Convert a USD market-size string like "$19.3B" or "$420M"
 * into the user's local currency.
 *
 * Usage:
 *   formatMarketSize("$19.3B")  →  "₹1,616.6B"   (India)
 *   formatMarketSize("$420M")   →  "₹35,070M"     (India)
 */
export function formatMarketSize(usdStr) {
  if (!usdStr || typeof usdStr !== 'string') return usdStr;

  // Already non-USD or no dollar sign → return as-is
  if (!usdStr.startsWith('$')) return usdStr;

  const match = usdStr.match(/^\$([\d,.]+)\s*([BMT]?)/i);
  if (!match) return usdStr;

  const num    = parseFloat(match[1].replace(/,/g, ''));
  const suffix = match[2]?.toUpperCase() || '';

  const rate        = USD_RATES[CURR.currency] || 1;
  const converted   = num * rate;

  // Format with locale
  const formatted = new Intl.NumberFormat(CURR.locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(converted);

  return `${CURR.symbol}${formatted}${suffix}`;
}

export { USER_COUNTRY, CURR };
