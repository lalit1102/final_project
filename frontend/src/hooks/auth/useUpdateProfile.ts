import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";

import type { AxiosError } from "axios";
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@/services/api/auth/types";

/**
 * Update profile hook.
 *
 * Calls the auth service `updateProfile()` function.
 * Requires valid authentication.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useUpdateProfile() {
  return useMutation<UpdateProfileResponse, AxiosError>(
    async (payload: UpdateProfileRequest) => {
      return await authApi.updateProfile(payload);
    },
  );
}
