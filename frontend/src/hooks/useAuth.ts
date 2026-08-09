import { useMutation, useAppDispatch, useAppSelector } from "@/hooks";
import * as authApi from "@/services/api/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";

import type { AxiosError } from "axios";

/**
 * Provides authentication state and actions.
 *
 * This hook reads safe auth state from Redux and exposes mutation
 * actions that call the auth API service. It does NOT:
 * - access cookies
 * - store tokens
 * - navigate
 * - redirect
 *
 * Authentication state (status, user) is stored safely in Redux
 * without any token data.
 *
 * The `useMutation` hook is typed via generics so each action has
 * precise request and response types.
 *
 * @returns Auth state from Redux and mutation actions.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { status, user } = useAppSelector(
    (state) => state.auth,
  );

  const logoutMutation = useMutation<void, AxiosError>(
    async () => {
      await authApi.logout();
      dispatch(setUnauthenticated());
    },
  );

  return {
    status,
    user,
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    isUnknown: status === "unknown",
    logout: logoutMutation.execute,
    logoutLoading: logoutMutation.isLoading,
    logoutError: logoutMutation.error,
  };
}
