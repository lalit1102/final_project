"use client";

import React, { useEffect, useState, ReactNode } from 'react';
import { Layout } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Sidebar } from './Sidebar/Sidebar';
import { Header } from './Header/Header';
import { Breadcrumb } from './Breadcrumb/Breadcrumb';
import { Footer } from './Footer/Footer';
import { NavigationService } from '@/services/navigation';
import { toggleSidebar, toggleMobileDrawer, setMobileDrawerOpen } from '@/store/slices/layout.slice';
import type { User } from '@/types/auth';
import styles from './DashboardLayout.module.css';

interface ExpectedRootState {
  layout: {
    collapsed: boolean;
    mobileDrawerOpen: boolean;
  };
  auth?: {
    user: User | null;
  };
}

const { Content } = Layout;

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  
  const { collapsed, mobileDrawerOpen } = useSelector((state: ExpectedRootState) => state.layout);
  const user = useSelector((state: ExpectedRootState) => state.auth?.user);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rawNavItems = NavigationService.getNavigationByRole((user?.role || null) as import('@/types/navigation.types').Role | null);
  const allowedNavItems = NavigationService.filterNavigationByPermission(
    rawNavItems,
    user?.permissions || []
  );

  const handleToggleCollapse = () => {
    if (isMobile) {
      dispatch(toggleMobileDrawer());
    } else {
      dispatch(toggleSidebar());
    }
  };

  const handleMobileDrawerClose = () => {
    dispatch(setMobileDrawerOpen(false));
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <Layout className={styles.layout}>
      <Sidebar
        navItems={allowedNavItems}
        collapsed={collapsed}
        mobileDrawerOpen={mobileDrawerOpen}
        onMobileDrawerClose={handleMobileDrawerClose}
        isMobile={isMobile}
      />
      <Layout className={styles.siteLayout}>
        <Header
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          isMobile={isMobile}
          onLogout={handleLogout}
          user={user}
        />
        <Breadcrumb />
        <Content className={styles.content}>
          <div className={styles.contentInner}>
            {children}
          </div>
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
