import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
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
    return useMutation(async (payload) => {
        return await authApi.login(payload);
    });
}
