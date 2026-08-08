import { UserRole } from "@/types/user.types";
import { PermissionCode, ALL_PERMISSIONS } from "@/types/permission.types";

export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  [UserRole.ADMIN]: [
    PermissionCode.DASHBOARD_VIEW,
    PermissionCode.STUDENT_VIEW,
    PermissionCode.STUDENT_CREATE,
    PermissionCode.STUDENT_UPDATE,
    PermissionCode.STUDENT_DELETE,
    PermissionCode.TEACHER_VIEW,
    PermissionCode.TEACHER_CREATE,
    PermissionCode.TEACHER_UPDATE,
    PermissionCode.TEACHER_DELETE,
    PermissionCode.PARENT_VIEW,
    PermissionCode.PARENT_CREATE,
    PermissionCode.PARENT_UPDATE,
    PermissionCode.PARENT_DELETE,
    PermissionCode.CLASS_VIEW,
    PermissionCode.CLASS_CREATE,
    PermissionCode.CLASS_UPDATE,
    PermissionCode.CLASS_DELETE,
    PermissionCode.ATTENDANCE_VIEW,
    PermissionCode.ATTENDANCE_MANAGE,
    PermissionCode.GRADE_VIEW,
    PermissionCode.GRADE_MANAGE,
    PermissionCode.REPORT_VIEW,
    PermissionCode.REPORT_EXPORT,
    PermissionCode.SETTING_VIEW,
    PermissionCode.SETTING_MANAGE,
  ],
  [UserRole.TEACHER]: [
    PermissionCode.DASHBOARD_VIEW,
    PermissionCode.STUDENT_VIEW,
    PermissionCode.CLASS_VIEW,
    PermissionCode.CLASS_CREATE,
    PermissionCode.CLASS_UPDATE,
    PermissionCode.ATTENDANCE_VIEW,
    PermissionCode.ATTENDANCE_MANAGE,
    PermissionCode.GRADE_VIEW,
    PermissionCode.GRADE_MANAGE,
    PermissionCode.REPORT_VIEW,
  ],
  [UserRole.STUDENT]: [
    PermissionCode.DASHBOARD_VIEW,
    PermissionCode.CLASS_VIEW,
    PermissionCode.ATTENDANCE_VIEW,
    PermissionCode.GRADE_VIEW,
  ],
  [UserRole.PARENT]: [
    PermissionCode.DASHBOARD_VIEW,
    PermissionCode.STUDENT_VIEW,
    PermissionCode.ATTENDANCE_VIEW,
    PermissionCode.GRADE_VIEW,
  ],
};

export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: UserRole): PermissionCode[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function validatePermission(permission: unknown): permission is PermissionCode {
  if (typeof permission !== "string") {
    return false;
  }

  return ALL_PERMISSIONS.includes(permission as PermissionCode);
}
