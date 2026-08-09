import { jsx as _jsx } from "react/jsx-runtime";
import { AppProviders } from "@/components/providers/AppProviders";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import "./globals.css";
export const metadata = {
    title: "LearnSphere",
    description: "Enterprise School Learning Management System",
};
export default function RootLayout({ children }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { children: _jsx(ErrorBoundary, { children: _jsx(AppProviders, { children: children }) }) }) }));
}
