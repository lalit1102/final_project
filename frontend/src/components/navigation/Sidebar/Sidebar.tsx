'use client';

import React from 'react';
import { Menu } from 'antd';
import { iconMap } from '@/components/navigation/iconMap';
import { filterNavItems } from '@/config/navigation/roleAccess';
import { navigationConfig } from '@/config/navigation/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  role: string | undefined;
  collapsed: boolean;
  activeKey?: string;
  onItemClick?: (path: string) => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  collapsed,
  activeKey,
  onItemClick,
  isMobile = false,
}) => {
  const visibleItems = React.useMemo(() => {
    return filterNavItems(navigationConfig, role);
  }, [role]);

  const handleItemClick = (path: string) => {
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
    return (
      <div className={styles.sidebar}>
        <Menu
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : undefined}
          items={items}
          theme="light"
        />
      </div>
    );
  }

  return (
    <div className={styles.sidebar} aria-label="Main navigation">
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={activeKey ? [activeKey] : undefined}
        items={items}
        theme="light"
        style={{ width: '100%', borderRight: 0 }}
      />
    </div>
  );
};

export default Sidebar;
