import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
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
    return useMutation(async (payload) => {
        await authApi.changePassword(payload);
    });
}
