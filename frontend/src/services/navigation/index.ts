import { NavItem, Role, Permission } from '@/types/navigation.types';
import { getNavigationByRoleConfig } from '@/config/navigation';
import { getIcon } from '@/components/navigation/iconMap';

export interface NavigationServiceMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavigationServiceMenuItem[];
}

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
          return true;
        }
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
      .filter((item) => {
        if (item.children && item.children.length === 0) {
          return false;
        }
        return true;
      });
  },

  /**
   * Transforms raw navigation items into plain menu items with paths.
   * The component layer is responsible for rendering React nodes (e.g. Links).
   */
  transformNavigationToMenuItems(navItems: NavItem[]): NavigationServiceMenuItem[] {
    return navItems.map((item) => {
      const menuItem: NavigationServiceMenuItem = {
        key: item.key,
        label: item.label,
        icon: getIcon(item.icon),
        path: item.path,
        children: item.children
          ? this.transformNavigationToMenuItems(item.children)
          : undefined,
      };

      return menuItem;
    });
  },
};
