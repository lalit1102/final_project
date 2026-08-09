'use client';

import { ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { ThemeMode } from "@/store/slices";
import { getAntdThemeConfig } from "@/config/antd.theme";

interface AntdProviderProps {
  children: ReactNode;
}

const { darkAlgorithm, defaultAlgorithm } = theme;

function resolveAlgorithm(mode: Exclude<ThemeMode, "system">) {
  return mode === "dark" ? darkAlgorithm : defaultAlgorithm;
}

function resolveThemeMode(themeMode: ThemeMode): Exclude<ThemeMode, "system"> {
  if (themeMode === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return themeMode;
}

export function AntdProvider({ children }: AntdProviderProps) {
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);
  const resolvedMode = resolveThemeMode(themeMode);
  const algorithm = resolveAlgorithm(resolvedMode);

  return (
    <ConfigProvider theme={{ ...getAntdThemeConfig(), algorithm }}>
      {children}
    </ConfigProvider>
  );
}