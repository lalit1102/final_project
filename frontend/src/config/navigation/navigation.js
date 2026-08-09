import { UserRole } from '@/constants/roles';
export const navigationConfig = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    },
    {
        key: 'profile',
        label: 'Profile',
        path: '/dashboard/profile',
        icon: 'user',
        roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT],
    },
];
