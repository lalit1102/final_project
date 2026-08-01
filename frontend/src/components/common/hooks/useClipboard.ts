'use client';

import { useState, useCallback } from 'react';
import { copyToClipboard } from '../helpers/copyToClipboard';

/**
 * Hook to manage clipboard operations with success/error state management.
 */
export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await copyToClipboard(text);
      setIsCopied(true);
      setError(null);
    } catch (err) {
      setIsCopied(false);
      setError(err instanceof Error ? err : new Error('Failed to copy'));
    }
  }, []);

  const reset = useCallback(() => {
    setIsCopied(false);
    setError(null);
  }, []);

  return { isCopied, error, copy, reset };
}
