import { classRepository } from "@/repositories/class.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IClass } from "@/types/class.types";
import { ICourse } from "@/types/course.types";
import {
  CreateClassInput,
  UpdateClassInput,
  PatchClassInput,
  ClassListQuery,
} from "@/validations/class.validation";

export interface ClassResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  courseId: string;
  teacherId: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toClassResponse(cls: IClass): ClassResponse {
  return {
    id: cls._id.toString(),
    name: cls.name,
    code: cls.code,
    description: cls.description ?? null,
    courseId: cls.courseId.toString(),
    teacherId: cls.teacherId.toString(),
    startDate: cls.startDate ?? null,
    endDate: cls.endDate ?? null,
    isActive: cls.isActive,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class ClassService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage classes"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  private async verifyCourse(courseId: string): Promise<ICourse> {
    const course = await courseRepository.findById(courseId);

    if (!course || !course.isActive) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }

    return course;
  }

  private async verifyTeacherOwnsCourse(courseId: string, requestorId: string, role: string): Promise<void> {
    const course = await this.verifyCourse(courseId);

    if (role === UserRole.TEACHER && course.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }
  }

  private async verifyTeacherAssignment(teacherId: string): Promise<void> {
    const targetTeacher = await userRepository.findByIdSafe(teacherId);

    if (!targetTeacher) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Teacher not found"]);
    }

    if (targetTeacher.role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Can only assign classes to teachers"]);
    }
  }

  private validateDateRange(startDate?: Date | null, endDate?: Date | null): void {
    if (startDate && endDate && startDate >= endDate) {
      throw new AppError(ERROR_MESSAGES.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST, ["Start date must be before end date"]);
    }
  }

  async listClasses(query: ClassListQuery, currentUserId: string): Promise<{ classes: ClassResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const { page, limit, search, courseId, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      filter.teacherId = requestorId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (courseId) {
      await this.verifyCourse(courseId);
      filter.courseId = courseId;
    }

    if (search) {
      filter["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const [classes, total] = await Promise.all([
      classRepository.findAllPaginated(filter, page, limit, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER as 1 | -1),
      classRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      classes: classes.map(toClassResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getClassById(id: string, currentUserId: string): Promise<ClassResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const cls = await classRepository.findById(id);

    if (!cls || !cls.isActive) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    if (role === UserRole.TEACHER && cls.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    return toClassResponse(cls);
  }

  async createClass(data: CreateClassInput, currentUserId: string): Promise<ClassResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsCourse(data.courseId, requestorId, role);

    let teacherId: string;

    if (role === UserRole.ADMIN) {
      if (data.teacherId) {
        await this.verifyTeacherAssignment(data.teacherId);
        teacherId = data.teacherId;
      } else {
        teacherId = requestorId;
      }
    } else {
      teacherId = requestorId;
    }

    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    this.validateDateRange(startDate, endDate);

    const classData: Partial<IClass> = {
      name: data.name,
      code: data.code,
      courseId: data.courseId as unknown as IClass["courseId"],
      teacherId: teacherId as unknown as IClass["teacherId"],
      ...(data.startDate !== undefined ? { startDate: startDate ?? null } : {}),
      ...(data.endDate !== undefined ? { endDate: endDate ?? null } : {}),
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await classRepository.create(classData);
      logger.info(`Class created: ${data.name} (by: ${currentUserId})`);
      return toClassResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateClass(id: string, data: UpdateClassInput, currentUserId: string): Promise<ClassResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.getClassForUpdate(id, requestorId, role);
    await this.verifyTeacherOwnsCourse(data.courseId, requestorId, role);

    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    this.validateDateRange(startDate, endDate);

    const updateData: Partial<IClass> = {
      name: data.name,
      code: data.code,
      courseId: data.courseId as unknown as IClass["courseId"],
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await classRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
      }
      logger.info(`Class updated: ${updated.name} (by: ${currentUserId})`);
      return toClassResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchClass(id: string, data: PatchClassInput, currentUserId: string): Promise<ClassResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const cls = await this.getClassForUpdate(id, requestorId, role);

    const updates: Partial<IClass> = {};
    let startDate = cls.startDate ?? null;
    let endDate = cls.endDate ?? null;

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.code !== undefined) {
      updates.code = data.code;
    }

    if (data.courseId !== undefined) {
      await this.verifyTeacherOwnsCourse(data.courseId, requestorId, role);
      updates.courseId = data.courseId as unknown as IClass["courseId"];
    }

    if (data.startDate !== undefined) {
      startDate = data.startDate ? new Date(data.startDate) : null;
    }

    if (data.endDate !== undefined) {
      endDate = data.endDate ? new Date(data.endDate) : null;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    this.validateDateRange(startDate, endDate);

    if (startDate !== null) {
      updates.startDate = startDate;
    }

    if (endDate !== null) {
      updates.endDate = endDate;
    }

    if (Object.keys(updates).length === 0) {
      return toClassResponse(cls);
    }

    try {
      const updated = await classRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
      }
      logger.info(`Class patched: ${updated.name} (by: ${currentUserId})`);
      return toClassResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteClass(id: string, currentUserId: string): Promise<ClassResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const cls = await this.getClassForUpdate(id, requestorId, role);

    if (!cls.isActive) {
      return toClassResponse(cls);
    }

    const deactivated = await classRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found after deactivation"]);
    }

    logger.info(`Class deactivated: ${cls.name} (by: ${currentUserId})`);
    return toClassResponse(deactivated);
  }

  private async getClassForUpdate(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<IClass> {
    const cls = await classRepository.findById(id);

    if (!cls || !cls.isActive) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    if (role === UserRole.TEACHER && cls.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    return cls;
  }
}

export const classService = new ClassService();
