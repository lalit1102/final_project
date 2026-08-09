'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { ConfigProvider, theme } from "antd";
import { useSelector } from "react-redux";
import { getAntdThemeConfig } from "@/config/antd.theme";
const { darkAlgorithm, defaultAlgorithm } = theme;
function resolveAlgorithm(mode) {
    return mode === "dark" ? darkAlgorithm : defaultAlgorithm;
}
function resolveThemeMode(themeMode) {
    if (themeMode === "system") {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return "light";
    }
    return themeMode;
}
export function AntdProvider({ children }) {
    const themeMode = useSelector((state) => state.ui.themeMode);
    const resolvedMode = resolveThemeMode(themeMode);
    const algorithm = resolveAlgorithm(resolvedMode);
    return (_jsx(ConfigProvider, { theme: { ...getAntdThemeConfig(), algorithm }, children: children }));
}
