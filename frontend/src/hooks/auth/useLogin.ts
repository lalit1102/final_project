import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type { LoginRequest, LoginResponse } from "@/services/api/auth/types";

/**
 * Login hook.
 *
 * Calls the auth service `login()` function. On success, the
 * backend sets HTTP-only cookies automatically — this hook does
 * NOT handle cookies or tokens.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useLogin() {
  return useMutation<LoginResponse, AxiosError>(
    async (payload: LoginRequest) => {
      return await authApi.login(payload);
    },
  );
}
