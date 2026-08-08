import React from 'react';
import { Layout, Menu, Drawer } from 'antd';
import styles from './Sidebar.module.css';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types/navigation.types';
import { NavigationService } from '@/services/navigation';

const { Sider } = Layout;

interface SidebarProps {
  navItems: NavItem[];
  collapsed: boolean;
  mobileDrawerOpen: boolean;
  onMobileDrawerClose: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  collapsed,
  mobileDrawerOpen,
  onMobileDrawerClose,
  isMobile,
}) => {
  const pathname = usePathname();
  const menuItems = NavigationService.transformNavigationToMenuItems(navItems);

  // Simple active route matching
  const selectedKeys = [pathname]; // A more robust matching might be needed for nested dynamic routes

  const menuContent = (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        {/* Placeholder for actual logo */}
        <h1 className={styles.logoText}>{collapsed && !isMobile ? 'LS' : 'LearnSphere'}</h1>
      </div>
      <Menu
        theme="dark" // Assuming dark theme for sidebar, could be dynamic
        mode="inline"
        selectedKeys={selectedKeys}
        items={menuItems}
        className={styles.menu}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={onMobileDrawerClose}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={256}
        className={styles.drawer}
      >
        {menuContent}
      </Drawer>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      className={styles.sider}
      breakpoint="lg"
    >
      {menuContent}
    </Sider>
  );
};
