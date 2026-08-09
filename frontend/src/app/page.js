import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
export default function HomePage() {
    return (_jsxs("main", { children: [_jsx("h1", { children: "LearnSphere" }), _jsx("p", { children: "Enterprise School Learning Management System" }), _jsx(Link, { href: "/login", children: "Login" })] }));
}
