import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
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
    return useMutation(async (payload) => {
        await authApi.resetPassword(payload);
    });
}
