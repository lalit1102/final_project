'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Menu } from 'antd';
import { iconMap } from '@/components/navigation/iconMap';
import { filterNavItems } from '@/config/navigation/roleAccess';
import { navigationConfig } from '@/config/navigation/navigation';
import styles from './Sidebar.module.css';
const Sidebar = ({ role, collapsed, activeKey, onItemClick, isMobile = false, }) => {
    const visibleItems = React.useMemo(() => {
        return filterNavItems(navigationConfig, role);
    }, [role]);
    const handleItemClick = (path) => {
        onItemClick?.(path);
    };
    const items = visibleItems.map((item) => ({
        key: item.path,
        icon: iconMap[item.icon],
        label: item.label,
        onClick: () => handleItemClick(item.path),
        children: item.children?.map((child) => ({
            key: child.path,
            icon: iconMap[child.icon],
            label: child.label,
            onClick: () => handleItemClick(child.path),
        })),
    }));
    if (isMobile) {
        return (_jsx("div", { className: styles.sidebar, children: _jsx(Menu, { mode: "inline", selectedKeys: activeKey ? [activeKey] : undefined, items: items, theme: "light" }) }));
    }
    return (_jsx("div", { className: styles.sidebar, "aria-label": "Main navigation", children: _jsx(Menu, { mode: "inline", inlineCollapsed: collapsed, selectedKeys: activeKey ? [activeKey] : undefined, items: items, theme: "light", style: { width: '100%', borderRight: 0 } }) }));
};
export default Sidebar;
