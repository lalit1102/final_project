import { moduleRepository } from "@/repositories/module.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IModule } from "@/types/module.types";
import { ICourse } from "@/types/course.types";
import {
  CreateModuleInput,
  UpdateModuleInput,
  PatchModuleInput,
  ModuleListQuery,
} from "@/validations/module.validation";

export interface ModuleResponse {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toModuleResponse(moduleDoc: IModule): ModuleResponse {
  return {
    id: moduleDoc._id.toString(),
    title: moduleDoc.title,
    description: moduleDoc.description ?? null,
    courseId: moduleDoc.courseId.toString(),
    order: moduleDoc.order,
    isActive: moduleDoc.isActive,
    createdAt: moduleDoc.createdAt,
    updatedAt: moduleDoc.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "order";
const DEFAULT_SORT_ORDER = 1;

export class ModuleService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage modules"]);
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

  async listModules(
    query: ModuleListQuery,
    courseId: string,
    currentUserId: string,
  ): Promise<{ modules: ModuleResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsCourse(courseId, requestorId, role);

    const { page, limit, search, isActive } = query;

    const filter: Record<string, unknown> = { courseId, isActive: true };

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [modules, total] = await Promise.all([
      moduleRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      moduleRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      modules: modules.map(toModuleResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getModuleById(id: string, courseId: string, currentUserId: string): Promise<ModuleResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsCourse(courseId, requestorId, role);

    const moduleDoc = await moduleRepository.findById(id);

    if (!moduleDoc || !moduleDoc.isActive || moduleDoc.courseId.toString() !== courseId) {
      throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
    }

    return toModuleResponse(moduleDoc);
  }

  async createModule(
    courseId: string,
    data: CreateModuleInput,
    currentUserId: string,
  ): Promise<ModuleResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsCourse(courseId, requestorId, role);

    const moduleData: Partial<IModule> = {
      title: data.title,
      courseId: courseId as unknown as IModule["courseId"],
      order: data.order,
      createdBy: requestorId as unknown as IModule["createdBy"],
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await moduleRepository.create(moduleData);
      logger.info(`Module created: ${data.title} (by: ${currentUserId})`);
      return toModuleResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateModule(
    id: string,
    courseId: string,
    data: UpdateModuleInput,
    currentUserId: string,
  ): Promise<ModuleResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.getModuleForUpdate(id, courseId, requestorId, role);

    await this.verifyTeacherOwnsCourse(courseId, requestorId, role);

    const updateData: Partial<IModule> = {
      title: data.title,
      order: data.order,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await moduleRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
      }
      logger.info(`Module updated: ${updated.title} (by: ${currentUserId})`);
      return toModuleResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchModule(
    id: string,
    courseId: string,
    data: PatchModuleInput,
    currentUserId: string,
  ): Promise<ModuleResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const moduleDoc = await this.getModuleForUpdate(id, courseId, requestorId, role);

    const updates: Partial<IModule> = {};

    if (data.title !== undefined) {
      updates.title = data.title;
    }

    if (data.order !== undefined) {
      updates.order = data.order;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return toModuleResponse(moduleDoc);
    }

    try {
      const updated = await moduleRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
      }
      logger.info(`Module patched: ${updated.title} (by: ${currentUserId})`);
      return toModuleResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteModule(id: string, courseId: string, currentUserId: string): Promise<ModuleResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const moduleDoc = await this.getModuleForUpdate(id, courseId, requestorId, role);

    if (!moduleDoc.isActive) {
      return toModuleResponse(moduleDoc);
    }

    const deactivated = await moduleRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found after deactivation"]);
    }

    logger.info(`Module deactivated: ${moduleDoc.title} (by: ${currentUserId})`);
    return toModuleResponse(deactivated);
  }

  private async getModuleForUpdate(
    id: string,
    courseId: string,
    requestorId: string,
    role: string,
  ): Promise<IModule> {
    const moduleDoc = await moduleRepository.findById(id);

    if (!moduleDoc || !moduleDoc.isActive || moduleDoc.courseId.toString() !== courseId) {
      throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
    }

    await this.verifyTeacherOwnsCourse(courseId, requestorId, role);

    return moduleDoc;
  }
}

export const moduleService = new ModuleService();
