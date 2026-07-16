'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

/**
 * Applies the persisted theme to <html> on first client render. Rendered once
 * inside AppShell so every app page picks up the user's dark-mode choice.
 */
export function ThemeInit() {
  const applyTheme = useThemeStore((s) => s.applyTheme);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return null;
}
