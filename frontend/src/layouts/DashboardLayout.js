'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Grid } from 'antd';
import { useAppDispatch, useAppSelector } from '@/hooks/storeHooks';
import { toggleSidebar, setSidebarCollapsed } from '@/store/slices';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DashboardHeader } from '@/components/navigation/Header';
import { DashboardFooter } from '@/components/navigation/Footer';
import styles from './DashboardLayout.module.css';
const DashboardLayout = ({ children }) => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const router = useRouter();
    const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
    const { lg } = Grid.useBreakpoint();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const isMobile = !lg;
    useEffect(() => {
        if (!isMobile) {
            dispatch(setSidebarCollapsed(false));
        }
    }, [isMobile, dispatch]);
    const handleToggleSidebar = () => {
        if (isMobile) {
            setMobileDrawerOpen(true);
        }
        else {
            dispatch(toggleSidebar());
        }
    };
    const handleMobileClose = () => {
        setMobileDrawerOpen(false);
    };
    const handleNavClick = (path) => {
        if (path !== pathname) {
            router.push(path);
        }
        if (isMobile) {
            setMobileDrawerOpen(false);
        }
    };
    const SidebarContent = (_jsx(Sidebar, { role: user?.role, collapsed: sidebarCollapsed, activeKey: pathname, onItemClick: handleNavClick, isMobile: false }));
    return (_jsxs("div", { className: styles.dashboardLayout, role: "application", children: [!isMobile && (_jsx("aside", { className: styles.sidebar, style: { width: sidebarCollapsed ? 80 : 240 }, children: SidebarContent })), _jsxs("div", { className: styles.mainArea, children: [_jsx(DashboardHeader, { sidebarCollapsed: sidebarCollapsed, onToggleSidebar: handleToggleSidebar, isMobile: isMobile }), _jsx("main", { className: styles.content, children: children }), _jsx(DashboardFooter, {})] }), isMobile && (_jsx(Drawer, { title: "Navigation", placement: "left", closable: true, onClose: handleMobileClose, open: mobileDrawerOpen, bodyStyle: { padding: 0 }, headerStyle: { padding: '12px 16px' }, width: 240, maskClosable: true, destroyOnClose: true, children: _jsx(Sidebar, { role: user?.role, collapsed: false, activeKey: pathname, onItemClick: handleNavClick, isMobile: true }) }))] }));
};
export default DashboardLayout;
