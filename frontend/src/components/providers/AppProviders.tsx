'use client';

import type { ReactNode } from "react";
import { useEffect } from "react";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { useAppDispatch } from "@/hooks/storeHooks";
import { setThemeMode } from "@/store/slices";
import type { ThemeMode } from "@/store/slices/uiSlice";

const validThemeModes = new Set<ThemeMode>(["light", "dark", "system"]);

function isThemeMode(value: string): value is ThemeMode {
  return validThemeModes.has(value as ThemeMode);
}

function InitTheme() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("themeMode");
      if (stored !== null && isThemeMode(stored)) {
        dispatch(setThemeMode(stored));
      }
    } catch {
      /* localStorage may be unavailable in restricted environments — fallback to default */
    }
  }, [dispatch]);

  return null;
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoreProvider>
      <AuthProvider>
        <AntdProvider>
          <InitTheme />
          {children}
        </AntdProvider>
      </AuthProvider>
    </StoreProvider>
  );
}
