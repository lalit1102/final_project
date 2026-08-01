import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

/**
 * Defines a unique permission key used to restrict access to navigation items.
 */
export type PermissionKey = string;

/**
 * Represents a single navigation item within the enterprise navigation system.
 * Extended from standard Ant Design menu props for additional custom logic.
 */
export interface NavItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  path?: string;
  children?: NavItem[];
  permissions?: PermissionKey[];
  hidden?: boolean;
  disabled?: boolean;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * Represents a single breadcrumb item within a trail.
 */
export interface BreadcrumbItem {
  key: string;
  label: ReactNode;
  path?: string;
  icon?: ReactNode;
}

/**
 * Configuration options for the Navigation Menu component.
 */
export interface NavigationMenuConfig {
  items: NavItem[];
  mode?: MenuProps['mode'];
  theme?: MenuProps['theme'];
  collapsed?: boolean;
}
