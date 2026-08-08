export const PermissionCode = {
  DASHBOARD_VIEW: "dashboard.view",

  STUDENT_VIEW: "student.view",
  STUDENT_CREATE: "student.create",
  STUDENT_UPDATE: "student.update",
  STUDENT_DELETE: "student.delete",

  TEACHER_VIEW: "teacher.view",
  TEACHER_CREATE: "teacher.create",
  TEACHER_UPDATE: "teacher.update",
  TEACHER_DELETE: "teacher.delete",

  PARENT_VIEW: "parent.view",
  PARENT_CREATE: "parent.create",
  PARENT_UPDATE: "parent.update",
  PARENT_DELETE: "parent.delete",

  CLASS_VIEW: "class.view",
  CLASS_CREATE: "class.create",
  CLASS_UPDATE: "class.update",
  CLASS_DELETE: "class.delete",

  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",

  GRADE_VIEW: "grade.view",
  GRADE_MANAGE: "grade.manage",

  REPORT_VIEW: "report.view",
  REPORT_EXPORT: "report.export",

  SETTING_VIEW: "setting.view",
  SETTING_MANAGE: "setting.manage",
} as const;

export type PermissionCode = typeof PermissionCode[keyof typeof PermissionCode];

export const ALL_PERMISSIONS = Object.values(PermissionCode);
