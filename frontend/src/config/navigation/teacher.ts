import { NavItem } from '@/types/navigation.types';

export const teacherNavigation: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'classes',
    label: 'My Classes',
    path: '/dashboard/classes',
    icon: 'team',
  },
  {
    key: 'assignments',
    label: 'Assignments',
    path: '/dashboard/assignments',
    icon: 'book',
  },
];
