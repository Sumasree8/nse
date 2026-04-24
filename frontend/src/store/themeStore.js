import { create } from 'zustand';

// Initialise from localStorage, fallback to system preference
function getInitialTheme() {
  const stored = localStorage.getItem('nse_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  localStorage.setItem('nse_theme', theme);
}

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  init() {
    applyTheme(get().theme);
  },

  toggle() {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },

  setTheme(t) {
    applyTheme(t);
    set({ theme: t });
  },

  isDark: () => get().theme === 'dark',
}));

// Apply on load immediately (before React renders) to avoid flash
applyTheme(getInitialTheme());

export default useThemeStore;
