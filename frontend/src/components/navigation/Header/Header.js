'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Space, Grid, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import BreadcrumbNav from './Breadcrumb';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';
const DashboardHeader = ({ sidebarCollapsed, onToggleSidebar, isMobile, }) => {
    const { md } = Grid.useBreakpoint();
    return (_jsxs("header", { className: styles.header, role: "banner", children: [_jsx("div", { className: styles.headerLeft, children: !isMobile && (_jsx(Button, { type: "text", icon: sidebarCollapsed ? _jsx(MenuUnfoldOutlined, {}) : _jsx(MenuFoldOutlined, {}), onClick: onToggleSidebar, "aria-label": sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar' })) }), _jsx("div", { className: styles.headerCenter, children: md && _jsx(BreadcrumbNav, {}) }), _jsx("div", { className: styles.headerRight, children: _jsxs(Space, { direction: "horizontal", size: "middle", children: [_jsx(ThemeToggle, {}), _jsx(UserMenu, {})] }) })] }));
};
export default DashboardHeader;
