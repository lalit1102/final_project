import type { UserRole } from '@/constants/roles';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

export interface NavigationConfig {
  items: NavItem[];
}
