import { IUser } from "@/types/user.types";
import { PermissionCode } from "@/types/permission.types";
import { hasPermission } from "./permissions";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

export function requirePermission(user: IUser, permission: PermissionCode): void {
  if (!hasPermission(user.role, permission)) {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }
}

export function requireRole(user: IUser, role: string): void {
  if (user.role !== role) {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }
}

export function requireAdmin(user: IUser): void {
  if (user.role !== "ADMIN") {
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }
}
