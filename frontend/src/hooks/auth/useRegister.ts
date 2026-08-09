import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type { RegisterRequest, RegisterResponse } from "@/services/api/auth/types";

/**
 * Register hook.
 *
 * Calls the auth service `register()` function.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useRegister() {
  return useMutation<RegisterResponse, AxiosError>(
    async (payload: RegisterRequest) => {
      return await authApi.register(payload);
    },
  );
}
