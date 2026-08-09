"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AxiosError } from "axios";

import { useAppDispatch, useAppSelector } from "@/hooks/storeHooks";
import * as authApi from "@/services/api/auth";
import {
  setAuthenticated,
  setUnauthenticated,
} from "@/store/slices/authSlice";

import type { AuthContextValue } from "../types";
import type { User } from "@/types/user";

/**
 * Internal ready-state used during initialization.
 *
 * - "initializing" — first mount, profile request in flight
 * - "ready" — profile resolved (success or failure)
 */
type AuthReadyState = "initializing" | "ready";

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
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  const { status, user } = useAppSelector((state) => state.auth);

  const [ready, setReady] = useState<AuthReadyState>(
    status === "unknown" ? "initializing" : "ready",
  );

  const isLoading = ready === "initializing";
  const isAuthenticated = status === "authenticated";

  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<void> => {
    const result = await authApi.login(credentials);

    if (result && result.user) {
      const user: User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar ?? null,
      };
      dispatch(setAuthenticated({ user }));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      /* Expected: server may return error if already unauthenticated */
    } finally {
      dispatch(setUnauthenticated());
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const profile = await authApi.getProfile();

      if (profile) {
        dispatch(setAuthenticated({ user: profile }));
        setReady("ready");
      }
    } catch (error) {
      const axiosError = error as AxiosError;

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the authentication context.
 *
 * Must be called within an AuthProvider.
 *
 * @throws Error if used outside of AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Wrap your application with <AuthProvider>.",
    );
  }

  return context;
}
