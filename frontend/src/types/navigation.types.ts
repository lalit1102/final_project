export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type Permission = string; // Define more granular permissions later, e.g. 'read:users' | 'write:users'

export interface NavItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  roles?: Role[]; // If not provided, it's accessible to all roles in the loaded config
  permissions?: Permission[]; // Specific granular permissions required
  children?: NavItem[];
}

export type NavigationItem = NavItem; // Alias for backward compatibility if needed
