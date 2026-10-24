import { userRepository } from "@/repositories/user.repository";
import { CreateTeacherInput } from "@/validations/teacher.validation";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { hashPassword } from "@/lib/password";
import { AuthProvider, UserRole } from "@/types/user.types";
import { getRolePermissions } from "@/lib/permissions";
import { logger } from "@/utils/logger";

export class TeacherService {
  async createTeacher(data: CreateTeacherInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.USER_EXISTS, STATUS_CODES.CONFLICT);
    }

    const hashedPassword = await hashPassword(data.password);
    const teacherPermissions = getRolePermissions(UserRole.TEACHER);

    const teacher = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
      role: UserRole.TEACHER,
      permissions: teacherPermissions,
      ...(data.avatar && { avatar: data.avatar }),
    });
    
    logger.info(`Teacher created successfully: ${teacher.email}`);

    return {
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      permissions: teacher.permissions,
      avatar: teacher.avatar,
    };
  }
}

export const teacherService = new TeacherService();
