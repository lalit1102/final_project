'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Dropdown, Space, Typography } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, } from '@ant-design/icons';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/hooks/storeHooks';
import { toggleSidebar } from '@/store/slices';
import styles from './UserMenu.module.css';
const UserMenu = () => {
    const { user, logout } = useAuth();
    const dispatch = useAppDispatch();
    const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
    const handleLogout = async () => {
        try {
            await logout();
        }
        catch {
            /* Logout failures are handled by AuthContext */
        }
    };
    const handleToggleSidebar = () => {
        dispatch(toggleSidebar());
    };
    const userObj = user;
    const items = [
        {
            key: 'profile',
            icon: _jsx(UserOutlined, {}),
            label: userObj?.name ?? 'My Account',
            disabled: true,
        },
        {
            type: 'divider',
        },
        {
            key: 'sidebar-toggle',
            icon: _jsx(SettingOutlined, {}),
            label: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
            onClick: handleToggleSidebar,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: _jsx(LogoutOutlined, {}),
            label: 'Logout',
            onClick: handleLogout,
        },
    ];
    const avatarSrc = userObj?.avatar ?? undefined;
    return (_jsx(Dropdown, { menu: { items }, placement: "bottomRight", arrow: true, trigger: ['click'], children: _jsxs(Space, { className: styles.userMenu, size: "middle", onClick: (e) => e.preventDefault(), children: [_jsx(Typography.Text, { className: styles.userName, type: "secondary", children: userObj?.name ?? 'User' }), _jsx(Avatar, { src: avatarSrc, icon: !avatarSrc && _jsx(UserOutlined, {}), alt: userObj?.name ?? 'User avatar', size: "default" })] }) }));
};
export default UserMenu;
