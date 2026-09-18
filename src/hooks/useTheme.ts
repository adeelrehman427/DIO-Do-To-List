import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY_THEME } from '../constants';
import { ThemeMode } from '../types';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light' || saved === 'custom-blue') {
        return saved;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const isDark = theme === 'dark' || theme === 'custom-blue';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark' || theme === 'custom-blue') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Cycle through Light -> Dark -> Custom Blue -> Light
  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'custom-blue';
      return 'light';
    });
  }, []);

  const toggleTheme = useCallback(() => {
    cycleTheme();
  }, [cycleTheme]);

  return {
    theme,
    setTheme,
    isDark,
    toggleTheme,
    cycleTheme,
  };
}
