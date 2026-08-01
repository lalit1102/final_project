'use client';

import { useEffect } from 'react';

/**
 * Hook to dynamically update the document title based on the page context.
 */
export function usePageTitle(title?: string, defaultTitle: string = 'Enterprise App') {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;
    }
  }, [title, defaultTitle]);
}
