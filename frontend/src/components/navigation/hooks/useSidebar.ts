'use client';

import { useState, useCallback, useEffect } from 'react';
import { SIDEBAR_COLLAPSED_KEY } from '../constants';

/**
 * Hook to manage sidebar collapsed state, with optional persistence to localStorage
 * and responsive behavior adjustments.
 */
export function useSidebar(persist = true) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) {
        setCollapsed(stored === 'true');
      }
    }
  }, [persist]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  }, [persist]);

  const setSidebarState = useCallback((state: boolean) => {
    setCollapsed(state);
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(state));
    }
  }, [persist]);

  return {
    collapsed,
    toggleSidebar,
    setSidebarState,
  };
}
