"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, logout as logoutApi, profile as profileApi, register as registerApi } from "@/api";
import type { LoginPayload, ProfileResponse, RegisterPayload, User } from "@/types/auth";

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await loginApi(payload);
      const nextUser = response.data?.data?.user ?? null;

      setUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
      return response;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      return await registerApi(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      clearSession();
      setLoading(false);
      router.push("/auth/login");
    }
  }, [clearSession, router]);

  const profile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await profileApi();
      const nextUser = (response.data?.data as ProfileResponse | null) ?? null;
      setUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
      return response;
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      router.replace("/auth/login");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [clearSession, router]);

  const value = useMemo(() => ({
    login,
    register,
    logout,
    profile,
    loading,
    user,
    isAuthenticated,
  }), [loading, login, logout, profile, register, user, isAuthenticated]);

  return value;
};

export default useAuth;
