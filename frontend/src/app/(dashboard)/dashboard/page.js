'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Typography } from 'antd';
import { useAuth } from '@/features/auth/contexts/AuthContext';
const DashboardPage = () => {
    const { user } = useAuth();
    return (_jsxs(Card, { children: [_jsx(Typography.Title, { level: 2, children: "Dashboard" }), _jsxs(Typography.Text, { children: ["Welcome, ", user?.name ?? 'User'] }), _jsx("br", {}), _jsxs(Typography.Text, { type: "secondary", children: ["Role: ", user?.role ?? 'N/A'] })] }));
};
export default DashboardPage;
