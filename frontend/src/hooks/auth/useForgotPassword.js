import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
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
    return useMutation(async (payload) => {
        await authApi.forgotPassword(payload);
    });
}
