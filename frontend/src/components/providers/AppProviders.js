'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AntdProvider } from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { useAppDispatch } from "@/hooks/storeHooks";
import { setThemeMode } from "@/store/slices";
const validThemeModes = new Set(["light", "dark", "system"]);
function isThemeMode(value) {
    return validThemeModes.has(value);
}
function InitTheme() {
    const dispatch = useAppDispatch();
    useEffect(() => {
        try {
            const stored = localStorage.getItem("themeMode");
            if (stored !== null && isThemeMode(stored)) {
                dispatch(setThemeMode(stored));
            }
        }
        catch {
            /* localStorage may be unavailable in restricted environments — fallback to default */
        }
    }, [dispatch]);
    return null;
}
export function AppProviders({ children }) {
    return (_jsx(StoreProvider, { children: _jsx(AuthProvider, { children: _jsxs(AntdProvider, { children: [_jsx(InitTheme, {}), children] }) }) }));
}
