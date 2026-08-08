import React, { useEffect, useState, ReactNode } from 'react';
import { Layout } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb } from './Breadcrumb';
import { Footer } from './Footer';
import { NavigationService } from '@/services/navigation';
import { toggleSidebar, toggleMobileDrawer, setMobileDrawerOpen } from '@/store/slices/layout.slice';
import styles from './DashboardLayout.module.css';

// Assume RootState is exported from your store. Adjust import as necessary.
// import { RootState } from '@/store'; 
// For now we'll define a basic expected state shape to satisfy TypeScript without strict RootState
interface ExpectedRootState {
  layout: {
    collapsed: boolean;
    mobileDrawerOpen: boolean;
  };
  auth?: {
    user: { name: string; role: string; permissions?: string[] } | null;
  };
}

const { Content } = Layout;

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  
  const { collapsed, mobileDrawerOpen } = useSelector((state: ExpectedRootState) => state.layout);
  // Fetch user from auth state
  const user = useSelector((state: ExpectedRootState) => state.auth?.user);

  const [isMobile, setIsMobile] = useState(false);

  // Responsive strategy: Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch and filter navigation based on user role and permissions
  // Casting role to any to bypass strict type checking against NavItem Role types temporarily
  const rawNavItems = NavigationService.getNavigationByRole((user?.role as any) || null);
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
    // Implement logout logic here (e.g. dispatch logout action)
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
          user={user as any}
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
