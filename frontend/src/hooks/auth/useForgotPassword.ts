import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type { ForgotPasswordRequest } from "@/services/api/auth/types";

/**
 * Forgot password hook.
 *
 * Calls the auth service `forgotPassword()` function.
 *
 * This is a public endpoint that always returns success to
 * prevent user enumeration.
 *
 * @returns Mutation state: execute, error, isLoading, isSuccess.
 */
export function useForgotPassword() {
  return useMutation<void, AxiosError>(
    async (payload: ForgotPasswordRequest) => {
      await authApi.forgotPassword(payload);
    },
  );
}
