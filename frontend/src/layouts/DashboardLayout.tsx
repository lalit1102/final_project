'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Grid } from 'antd';
import { useAppDispatch, useAppSelector } from '@/hooks/storeHooks';
import { toggleSidebar, setSidebarCollapsed } from '@/store/slices';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { Sidebar } from '@/components/navigation/Sidebar';
import { DashboardHeader } from '@/components/navigation/Header';
import { DashboardFooter } from '@/components/navigation/Footer';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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
    } else {
      dispatch(toggleSidebar());
    }
  };

  const handleMobileClose = () => {
    setMobileDrawerOpen(false);
  };

  const handleNavClick = (path: string) => {
    if (path !== pathname) {
      router.push(path);
    }
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const SidebarContent = (
    <Sidebar
      role={user?.role}
      collapsed={sidebarCollapsed}
      activeKey={pathname}
      onItemClick={handleNavClick}
      isMobile={false}
    />
  );

  return (
    <div className={styles.dashboardLayout} role="application">
      {!isMobile && (
        <aside
          className={styles.sidebar}
          style={{ width: sidebarCollapsed ? 80 : 240 }}
        >
          {SidebarContent}
        </aside>
      )}

      <div className={styles.mainArea}>
        <DashboardHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          isMobile={isMobile}
        />

        <main className={styles.content}>
          {children}
        </main>

        <DashboardFooter />
      </div>

      {isMobile && (
        <Drawer
          title="Navigation"
          placement="left"
          closable={true}
          onClose={handleMobileClose}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ padding: '12px 16px' }}
          width={240}
          maskClosable={true}
          destroyOnClose={true}
        >
          <Sidebar
            role={user?.role}
            collapsed={false}
            activeKey={pathname}
            onItemClick={handleNavClick}
            isMobile={true}
          />
        </Drawer>
      )}
    </div>
  );
};

export default DashboardLayout;
