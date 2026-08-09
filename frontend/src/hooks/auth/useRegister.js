import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
/**
 * Register hook.
 *
 * Calls the auth service `register()` function.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useRegister() {
    return useMutation(async (payload) => {
        return await authApi.register(payload);
    });
}
