import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('qpso_theme');
  if (saved !== null) {
    return saved === 'dark';
  }
  // Default to light warm off-white, or check system preference
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialDark = getInitialTheme();
  
  if (typeof document !== 'undefined') {
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isDark: initialDark,
    toggleTheme: () =>
      set((state) => {
        const next = !state.isDark;
        if (typeof document !== 'undefined') {
          if (next) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('qpso_theme', next ? 'dark' : 'light');
        }
        return { isDark: next };
      }),
    setDark: (val: boolean) =>
      set(() => {
        if (typeof document !== 'undefined') {
          if (val) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('qpso_theme', val ? 'dark' : 'light');
        }
        return { isDark: val };
      }),
  };
});
