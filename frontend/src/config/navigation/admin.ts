import { NavItem } from '@/types/navigation.types';

export const adminNavigation: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'users',
    label: 'User Management',
    icon: 'user',
    children: [
      {
        key: 'users-list',
        label: 'All Users',
        path: '/dashboard/users',
      },
      {
        key: 'users-roles',
        label: 'Roles & Permissions',
        path: '/dashboard/users/roles',
        permissions: ['manage:roles'],
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
    icon: 'setting',
  },
];
