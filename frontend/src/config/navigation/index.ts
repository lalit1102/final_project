import { adminNavigation } from './admin';
import { teacherNavigation } from './teacher';
import { studentNavigation } from './student';
import { parentNavigation } from './parent';
import { Role, NavItem } from '@/types/navigation.types';

export const getNavigationByRoleConfig = (role?: Role | null): NavItem[] => {
  switch (role) {
    case 'ROLE_ADMIN':
      return adminNavigation;
    case 'ROLE_TEACHER':
      return teacherNavigation;
    case 'ROLE_STUDENT':
      return studentNavigation;
    case 'ROLE_PARENT':
      return parentNavigation;
    default:
      return [];
  }
};

export { adminNavigation, teacherNavigation, studentNavigation, parentNavigation };
