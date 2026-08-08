import { NavItem } from '@/types/navigation.types';

export const studentNavigation: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    key: 'courses',
    label: 'My Courses',
    path: '/dashboard/courses',
    icon: 'book',
  },
  {
    key: 'grades',
    label: 'My Grades',
    path: '/dashboard/grades',
    icon: 'star',
  },
];
