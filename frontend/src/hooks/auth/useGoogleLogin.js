import { useMutation } from "@/hooks/useMutation";
import * as authApi from "@/services/api/auth";
import { useAppDispatch } from "@/hooks";
import { setAuthenticated } from "@/store/slices/authSlice";
/**
 * Google login hook.
 *
 * Receives a Google ID token from the caller (e.g. from the
 * Google Identity Services SDK), then calls the auth service
 * `googleLogin()` function. On success, the backend sets
 * HTTP-only cookies automatically.
 *
 * After successful login, updates the Redux auth state to
 * "authenticated" with the returned user data.
 *
 * @returns Mutation state: execute, data, error, isLoading, isSuccess.
 */
export function useGoogleLogin() {
    const dispatch = useAppDispatch();
    return useMutation(async (payload) => {
        const result = await authApi.googleLogin({
            idToken: payload.idToken,
        });
        if (result && result.user) {
            dispatch(setAuthenticated({
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                    avatar: result.user.avatar,
                },
            }));
        }
        return result;
    });
}
