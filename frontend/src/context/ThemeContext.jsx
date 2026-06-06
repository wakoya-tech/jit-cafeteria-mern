import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const LOCAL_STORAGE_KEY = 'jit_theme';

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = preferred;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, theme);
    } catch (err) {
      // ignore localStorage write failures
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
