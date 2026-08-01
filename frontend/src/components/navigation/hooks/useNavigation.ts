'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { NavItem, PermissionKey } from '../types';
import { filterMenuByPermission, getActiveMenu, getOpenKeys } from '../helpers';

interface UseNavigationProps {
  items: NavItem[];
  userPermissions?: PermissionKey[];
}

/**
 * Core hook managing the navigation state, including permissions filtering,
 * active item detection, and tracking which menus should be open.
 */
export function useNavigation({ items, userPermissions = [] }: UseNavigationProps) {
  const pathname = usePathname() || '';

  // 1. Filter out items the user shouldn't see
  const filteredItems = useMemo(() => {
    return filterMenuByPermission(items, userPermissions);
  }, [items, userPermissions]);

  // 2. Identify the active menu node
  const activeMenu = useMemo(() => {
    return getActiveMenu(filteredItems, pathname);
  }, [filteredItems, pathname]);

  // 3. Determine which parents need to be expanded
  const openKeys = useMemo(() => {
    return getOpenKeys(filteredItems, pathname);
  }, [filteredItems, pathname]);

  return {
    filteredItems,
    activeMenu,
    openKeys,
    pathname,
  };
}
