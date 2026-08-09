import { useMutation, useAppDispatch } from "@/hooks";
import * as authApi from "@/services/api/auth";
import { setUnauthenticated } from "@/store/slices/authSlice";

import type { AxiosError } from "axios";

/**
 * Logout hook.
 *
 * Calls the auth service `logout()` function, then clears the
 * Redux auth state to "unauthenticated".
 *
 * The backend clears HTTP-only cookies on logout — this hook
 * does NOT access cookies directly.
 *
 * @returns Mutation state: execute, error, isLoading, isSuccess.
 */
export function useLogout() {
  const dispatch = useAppDispatch();

  return useMutation<void, AxiosError>(
    async () => {
      await authApi.logout();
      dispatch(setUnauthenticated());
    },
  );
}
