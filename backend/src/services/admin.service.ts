import { userRepository } from "@/repositories/user.repository";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { sanitizeUser, SanitizedUser } from "@/lib/userSanitization";
import { UserListQuery, UpdateUserInput } from "@/validations/admin.validation";
import { IUser, UserRole } from "@/types/user.types";

export interface PaginatedUsers {
  users: SanitizedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class AdminService {
  private async verifyAdmin(currentUserId: string): Promise<void> {
    const admin = await userRepository.findByIdSafe(currentUserId);
    if (!admin) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }
    if (admin.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Insufficient permissions"]);
    }
  }

  async listUsers(query: UserListQuery): Promise<PaginatedUsers> {
    const { page, limit, role, isActive, search } = query;

    const filter: Record<string, unknown> = {};

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sortBy = DEFAULT_SORT_FIELD;
    const sortOrder = DEFAULT_SORT_ORDER;

    const { users, total } = await userRepository.findAllPaginated(
      filter as Parameters<typeof userRepository.findAllPaginated>[0],
      page,
      limit,
      sortBy,
      sortOrder,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map(sanitizeUser).filter(Boolean) as SanitizedUser[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<SanitizedUser> {
    const user = await userRepository.findByIdSafe(id);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found"]);
    }

    return sanitizeUser(user)!;
  }

  async updateUser(id: string, data: UpdateUserInput, currentUserId: string): Promise<SanitizedUser> {
    await this.verifyAdmin(currentUserId);

    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found"]);
    }

    const updates: Partial<IUser> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.email !== undefined) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new AppError(ERROR_MESSAGES.USER_EXISTS, STATUS_CODES.CONFLICT, ["Email already in use"]);
      }
      updates.email = data.email;
    }

    if (data.role !== undefined) {
      updates.role = data.role;
    }

    if (data.isActive !== undefined) {
      updates.isActive = data.isActive;
    }

    if (data.studentId !== undefined) {
      if (user.role !== UserRole.STUDENT) {
        throw new AppError(ERROR_MESSAGES.STUDENT_ID_NOT_ALLOWED, STATUS_CODES.FORBIDDEN, [
          "studentId can only be set on users with role STUDENT",
        ]);
      }
      updates.studentId = data.studentId;
    }

    if (data.parentIds !== undefined && data.parentIds !== null) {
      if (user.role !== UserRole.STUDENT) {
        throw new AppError(ERROR_MESSAGES.PARENT_IDS_NOT_ALLOWED, STATUS_CODES.FORBIDDEN, [
          "parentIds can only be set on users with role STUDENT",
        ]);
      }
      if (data.parentIds.length > 0) {
        const parents = await userRepository.findByIds(data.parentIds);
        const foundIds = new Set(parents.map((p) => p._id.toString()));
        const missing = data.parentIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
          throw new AppError(ERROR_MESSAGES.PARENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, [
            `Parent user(s) not found: ${missing.join(", ")}`,
          ]);
        }
        const nonParents = parents.filter((p) => p.role !== UserRole.PARENT);
        if (nonParents.length > 0) {
          const invalidRoles = nonParents.map((p) => `${p.email} (${p.role})`);
          throw new AppError(ERROR_MESSAGES.INVALID_PARENT, STATUS_CODES.CONFLICT, [
            `All parentIds must reference users with role PARENT. Invalid: ${invalidRoles.join(", ")}`,
          ]);
        }
        updates.parentIds = parents.map((p) => p._id);
      } else {
        updates.parentIds = [];
      }
    } else if (data.parentIds === null) {
      if (user.role !== UserRole.STUDENT) {
        throw new AppError(ERROR_MESSAGES.PARENT_IDS_NOT_ALLOWED, STATUS_CODES.FORBIDDEN, [
          "parentIds can only be set on users with role STUDENT",
        ]);
      }
      updates.parentIds = [];
    }

    if (Object.keys(updates).length === 0) {
      return sanitizeUser(user)!;
    }

    const updatedUser = await userRepository.update(id, { $set: updates });
    if (!updatedUser) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found after update"]);
    }

    logger.info(`Admin user updated: ${user.email} (by: ${currentUserId})`);

    return sanitizeUser(updatedUser)!;
  }

  async updateUserStatus(id: string, isActive: boolean, currentUserId: string): Promise<SanitizedUser> {
    await this.verifyAdmin(currentUserId);

    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found"]);
    }

    if (user.isActive === isActive) {
      return sanitizeUser(user)!;
    }

    const updatedUser = await userRepository.update(id, { $set: { isActive } });
    if (!updatedUser) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found after status update"]);
    }

    logger.info(`Admin ${currentUserId} set isActive=${isActive} for user: ${user.email}`);

    return sanitizeUser(updatedUser)!;
  }

  async deleteUser(id: string, currentUserId: string): Promise<SanitizedUser> {
    await this.verifyAdmin(currentUserId);

    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found"]);
    }

    if (!user.isActive) {
      return sanitizeUser(user)!;
    }

    const deactivatedUser = await userRepository.softDelete(id);
    if (!deactivatedUser) {
      throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND, ["User not found after deactivation"]);
    }

    logger.info(`Admin ${currentUserId} deactivated user: ${user.email}`);

    return sanitizeUser(deactivatedUser)!;
  }
}

export const adminService = new AdminService();
