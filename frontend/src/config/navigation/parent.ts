import { NavItem } from '@/types/navigation.types';

export const parentNavigation: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'children',
    label: 'My Children',
    path: '/dashboard/children',
    icon: 'team',
  },
  {
    key: 'fees',
    label: 'Fee Payment',
    path: '/dashboard/fees',
    icon: 'credit-card',
  },
];
