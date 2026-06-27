import { create } from 'zustand';

// Mission Control is dark-first. Honour an explicit stored choice, else dark.
function getInitialTheme() {
  const stored = localStorage.getItem('nse_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
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
  root.style.backgroundColor = theme === 'light' ? '#EFEDE7' : '#0C0E13';
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
