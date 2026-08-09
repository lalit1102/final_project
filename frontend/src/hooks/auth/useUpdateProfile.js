import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
/**
 * Update profile hook.
 *
 * Calls the auth service `updateProfile()` function.
 * Requires valid authentication.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useUpdateProfile() {
    return useMutation(async (payload) => {
        return await authApi.updateProfile(payload);
    });
}
