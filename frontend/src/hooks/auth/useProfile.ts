import { useCallback, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks";
import * as authApi from "@/services/api/auth";
import { setAuthenticated, setUnauthenticated } from "@/store/slices/authSlice";

import type { AxiosError } from "axios";
import type { User } from "@/types/user";

/**
 * Profile hook.
 *
 * Fetches the current user's profile from the backend.
 * Requires valid authentication (accessToken cookie).
 *
 * The Axios interceptor automatically handles 401 → refresh → retry.
 * This hook only manages local React state.
 *
 * On success, updates the Redux auth state to "authenticated"
 * with the fetched user profile.
 *
 * @returns Profile data, loading state, error, and refetch function.
 */
export function useProfile() {
  const dispatch = useAppDispatch();
  const { status, user: storedUser } = useAppSelector(
    (state) => state.auth,
  );

  const [data, setData] = useState<User | null>(storedUser);
  const [error, setError] = useState<AxiosError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async (): Promise<User | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await authApi.getProfile();
      setData(user);
      dispatch(setAuthenticated({ user }));
      return user;
    } catch (err) {
      const axiosError = err as AxiosError;

      if (axiosError.response?.status === 401) {
        dispatch(setUnauthenticated());
      }

      setError(axiosError);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (status === "unknown") {
      void fetchProfile();
    }
  }, [status, fetchProfile]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchProfile,
  };
}
