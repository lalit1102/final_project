'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import styles from './layout.module.css';
const DashboardRouteBoundary = ({ children }) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, router]);
    if (isLoading) {
        return (_jsx("div", { className: styles.loadingContainer, children: _jsx(Spin, { size: "large" }) }));
    }
    if (!isAuthenticated) {
        return null;
    }
    return _jsx(DashboardLayout, { children: children });
};
export default DashboardRouteBoundary;
