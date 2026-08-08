import { NavItem, Role, Permission } from '@/types/navigation.types';
import { getNavigationByRoleConfig } from '@/config/navigation';
import { getIcon } from '@/components/navigation/iconMap';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import React from 'react';

type MenuItem = Required<MenuProps>['items'][number];

/**
 * Navigation Service Layer
 * Responsible for fetching, filtering, and transforming navigation configurations.
 */
export const NavigationService = {
  /**
   * Gets raw navigation configuration based on user role.
   */
  getNavigationByRole(role?: Role | null): NavItem[] {
    return getNavigationByRoleConfig(role);
  },

  /**
   * Filters navigation items based on the user's specific permissions.
   * Recursively filters children.
   */
  filterNavigationByPermission(navItems: NavItem[], userPermissions: Permission[]): NavItem[] {
    return navItems
      .filter((item) => {
        if (!item.permissions || item.permissions.length === 0) {
          return true; // No specific permissions required
        }
        // Check if user has all required permissions for this item
        return item.permissions.every((perm) => userPermissions.includes(perm));
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: this.filterNavigationByPermission(item.children, userPermissions),
          };
        }
        return item;
      })
      // Filter out items that have empty children after filtering
      .filter((item) => {
        if (item.children && item.children.length === 0) {
          return false;
        }
        return true;
      });
  },

  /**
   * Transforms raw navigation items into Ant Design MenuProps['items']
   */
  transformNavigationToMenuItems(navItems: NavItem[]): MenuItem[] {
    return navItems.map((item) => {
      const iconNode = getIcon(item.icon);

      let labelNode: React.ReactNode = item.label;
      if (item.path && !item.children) {
        labelNode = <Link href={item.path}>{item.label}</Link>;
      }

      return {
        key: item.key,
        icon: iconNode,
        label: labelNode,
        children: item.children ? this.transformNavigationToMenuItems(item.children) : undefined,
      } as MenuItem;
    });
  },
};
