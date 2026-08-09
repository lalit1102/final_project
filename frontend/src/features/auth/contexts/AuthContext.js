"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/storeHooks";
import * as authApi from "@/services/api/auth";
import { setAuthenticated, setUnauthenticated, } from "@/store/slices/authSlice";
/**
 * React Context for authentication state.
 *
 * This context provides the application-level authentication state.
 * It wraps the Redux auth slice and adds:
 * - Session restoration on mount via GET /api/auth/profile
 * - login() that updates state on success
 * - logout() that clears state
 * - refreshUser() for manual revalidation
 *
 * The context must NOT be consumed by the Axios layer. It depends
 * on the hooks/service layer, creating a clean unidirectional flow:
 *
 *   Component
 *      ↓
 *   AuthContext
 *      ↓
 *   API Hooks
 *      ↓
 *   API Service
 *      ↓
 *   Axios Client
 *      ↓
 *   Backend
 *
 * No circular dependency exists.
 */
const AuthContext = createContext(undefined);
/**
 * AuthProvider component.
 *
 * Wraps the application and provides authentication state.
 * Must be placed inside StoreProvider (Redux) to access dispatch.
 *
 * On mount, calls GET /api/auth/profile to restore the session.
 * If the user has a valid session (cookies), the profile is
 * fetched and the user state is set. If not, the state is
 * marked as unauthenticated.
 */
export function AuthProvider({ children }) {
    const dispatch = useAppDispatch();
    const { status, user } = useAppSelector((state) => state.auth);
    const [ready, setReady] = useState(status === "unknown" ? "initializing" : "ready");
    const isLoading = ready === "initializing";
    const isAuthenticated = status === "authenticated";
    const login = async (credentials) => {
        const result = await authApi.login(credentials);
        if (result && result.user) {
            const user = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                avatar: result.user.avatar ?? null,
            };
            dispatch(setAuthenticated({ user }));
        }
    };
    const logout = async () => {
        try {
            await authApi.logout();
        }
        catch {
            /* Expected: server may return error if already unauthenticated */
        }
        finally {
            dispatch(setUnauthenticated());
        }
    };
    const refreshUser = async () => {
        try {
            const profile = await authApi.getProfile();
            if (profile) {
                dispatch(setAuthenticated({ user: profile }));
                setReady("ready");
            }
        }
        catch (error) {
            const axiosError = error;
            if (axiosError.response?.status === 401) {
                dispatch(setUnauthenticated());
            }
            setReady("ready");
        }
    };
    useEffect(() => {
        if (status === "unknown") {
            void refreshUser();
        }
    }, [status]);
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
    }), [user, isAuthenticated, isLoading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
/**
 * Hook to access the authentication context.
 *
 * Must be called within an AuthProvider.
 *
 * @throws Error if used outside of AuthProvider.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider. " +
            "Wrap your application with <AuthProvider>.");
    }
    return context;
}
