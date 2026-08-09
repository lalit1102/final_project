'use client';

import React from 'react';
import { Space, Grid, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import BreadcrumbNav from './Breadcrumb';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

const DashboardHeader: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  isMobile,
}) => {
  const { md } = Grid.useBreakpoint();

  return (
    <header
      className={styles.header}
      role="banner"
    >
      <div className={styles.headerLeft}>
        {!isMobile && (
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        )}
      </div>

      <div className={styles.headerCenter}>
        {md && <BreadcrumbNav />}
      </div>

      <div className={styles.headerRight}>
        <Space direction="horizontal" size="middle">
          <ThemeToggle />
          <UserMenu />
        </Space>
      </div>
    </header>
  );
};

export default DashboardHeader;
