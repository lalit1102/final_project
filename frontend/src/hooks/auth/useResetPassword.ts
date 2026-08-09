import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type { ResetPasswordRequest } from "@/services/api/auth/types";

/**
 * Reset password hook.
 *
 * Calls the auth service `resetPassword()` function.
 *
 * This is a public endpoint that uses a reset token in the
 * request body (not cookie-based authentication).
 *
 * @returns Mutation state: execute, error, isLoading, isSuccess.
 */
export function useResetPassword() {
  return useMutation<void, AxiosError>(
    async (payload: ResetPasswordRequest) => {
      await authApi.resetPassword(payload);
    },
  );
}
