"use client";

import React from 'react';
import { Layout, Menu, Drawer } from 'antd';
import Link from 'next/link';
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
  const rawMenuItems = NavigationService.transformNavigationToMenuItems(navItems);

  const antMenuItems = rawMenuItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.path && !item.children ? (
      <Link href={item.path}>{item.label}</Link>
    ) : (
      item.label
    ),
    children: item.children?.map((child) => ({
      key: child.key,
      icon: child.icon,
      label: child.path && !child.children ? (
        <Link href={child.path}>{child.label}</Link>
      ) : (
        child.label
      ),
    })),
  }));

  const selectedKeys = [pathname];

  const menuContent = (
    <div className={styles.sidebarContainer}>
      <div className={styles.logoContainer}>
        {/* Placeholder for actual logo */}
        <h1 className={styles.logoText}>{collapsed && !isMobile ? 'LS' : 'LearnSphere'}</h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        items={antMenuItems}
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
