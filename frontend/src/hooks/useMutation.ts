import { useState, useCallback } from "react";

import type { AxiosError } from "axios";

/**
 * A minimal, generic mutation hook.
 *
 * Wraps a service function that performs an HTTP mutation and exposes
 * React state for loading, success, data, and error.
 *
 * This hook does NOT handle:
 * - authentication
 * - navigation
 * - notifications
 * - form validation
 *
 * It only manages the async lifecycle state of the service call.
 */
export interface MutationState<TData, TError> {
  execute: (...args: never[]) => Promise<TData | undefined>;
  data: TData | null;
  error: TError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useMutation<TData, TError = AxiosError>(
  serviceFn: (...args: never[]) => Promise<TData>,
): MutationState<TData, TError> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);

  const execute = useCallback(
    async (...args: never[]): Promise<TData | undefined> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setData(null);

      try {
        const result = await serviceFn(...args);
        setData(result);
        setSuccess(true);
        return result;
      } catch (err) {
        setError(err as TError);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [serviceFn],
  );

  return {
    execute,
    data,
    error,
    isLoading,
    isSuccess,
    isError: error !== null,
  };
}
