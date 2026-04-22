import { create } from 'zustand';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('nse_user') || 'null'),
  token: localStorage.getItem('nse_token') || null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('nse_token', data.token);
      localStorage.setItem('nse_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      toast.success(`Welcome back, ${data.user.name}!`);
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.error || 'Login failed');
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register({ name, email, password });
      localStorage.setItem('nse_token', data.token);
      localStorage.setItem('nse_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      toast.success('Account created! Welcome to NSE.');
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.error || 'Registration failed');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('nse_token');
    localStorage.removeItem('nse_user');
    set({ user: null, token: null });
    window.location.href = '/';
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    localStorage.setItem('nse_user', JSON.stringify(user));
    set({ user });
  },

  isAuthenticated: () => !!get().token,
  isPro: () => ['pro', 'founder', 'enterprise', 'admin'].includes(get().user?.tier),
  isFounder: () => ['founder', 'enterprise', 'admin'].includes(get().user?.tier),
}));

export default useAuthStore;
