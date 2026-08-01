'use client';

import { useEffect, useRef } from 'react';
import { COPY_FEEDBACK_DURATION_MS } from '../constants';
import { useClipboard } from './useClipboard';

/**
 * Hook to manage temporary visual feedback after copying.
 * Automatically resets the copied state after a duration.
 */
export function useCopyFeedback(durationMs: number = COPY_FEEDBACK_DURATION_MS) {
  const { isCopied, error, copy, reset } = useClipboard();
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (isCopied) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        reset();
      }, durationMs);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isCopied, durationMs, reset]);

  return { isCopied, error, copy, reset };
}
