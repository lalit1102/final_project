import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type { ChangePasswordRequest } from "@/services/api/auth/types";

/**
 * Change password hook.
 *
 * Calls the auth service `changePassword()` function.
 * Requires valid authentication.
 *
 * The backend clears cookies on success, so the user must log in again.
 *
 * @returns Mutation state: execute, error, isLoading, isSuccess.
 */
export function useChangePassword() {
  return useMutation<void, AxiosError>(
    async (payload: ChangePasswordRequest) => {
      await authApi.changePassword(payload);
    },
  );
}
