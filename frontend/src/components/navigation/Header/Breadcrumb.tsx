'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb, Grid } from 'antd';
import type { BreadcrumbProps } from 'antd';
import { navigationConfig } from '@/config/navigation/navigation';
import type { NavItem } from '@/types/navigation';
import styles from './Breadcrumb.module.css';

const findNavItemByPath = (items: NavItem[], path: string): NavItem | null => {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findNavItemByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
};

const buildBreadcrumbItems = (items: NavItem[], path: string): NavItem[] => {
  const matched = findNavItemByPath(items, path);
  if (!matched) return [];

  const chain: NavItem[] = [];
  const search = (nodes: NavItem[], target: string): boolean => {
    for (const node of nodes) {
      if (node.path === target) {
        chain.unshift(node);
        return true;
      }
      if (node.children && search(node.children, target)) {
        chain.unshift(node);
        return true;
      }
    }
    return false;
  };

  search(items, path);
  return chain;
};

const BreadcrumbNav: React.FC = () => {
  const pathname = usePathname();
  const { md } = Grid.useBreakpoint();

  const crumbItems: BreadcrumbProps['items'] = React.useMemo(() => {
    if (!pathname || pathname === '/dashboard') {
      return [{ title: 'Dashboard' }];
    }

    const chain = buildBreadcrumbItems(navigationConfig, pathname);
    if (chain.length === 0) {
      return [{ title: 'Dashboard' }];
    }

    return chain.map((item) => ({
      title: item.label,
    }));
  }, [pathname]);

  if (!md) {
    return null;
  }

  return <Breadcrumb className={styles.breadcrumb} items={crumbItems} />;
};

export default BreadcrumbNav;
