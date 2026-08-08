import { adminNavigation } from './admin';
import { teacherNavigation } from './teacher';
import { studentNavigation } from './student';
import { parentNavigation } from './parent';
import { Role, NavItem } from '@/types/navigation.types';

export const getNavigationByRoleConfig = (role?: Role | null): NavItem[] => {
  switch (role) {
    case 'ADMIN':
      return adminNavigation;
    case 'TEACHER':
      return teacherNavigation;
    case 'STUDENT':
      return studentNavigation;
    case 'PARENT':
      return parentNavigation;
    default:
      return [];
  }
};

export { adminNavigation, teacherNavigation, studentNavigation, parentNavigation };
