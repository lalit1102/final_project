import { lessonRepository } from "@/repositories/lesson.repository";
import { moduleRepository } from "@/repositories/module.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { ILesson, LessonContentType } from "@/types/lesson.types";
import { IModule } from "@/types/module.types";
import {
  CreateLessonInput,
  UpdateLessonInput,
  PatchLessonInput,
  LessonListQuery,
} from "@/validations/lesson.validation";

export interface LessonResponse {
  id: string;
  title: string;
  description: string | null;
  moduleId: string;
  contentType: LessonContentType;
  content: string;
  durationMinutes: number;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toLessonResponse(lesson: ILesson): LessonResponse {
  return {
    id: lesson._id.toString(),
    title: lesson.title,
    description: lesson.description ?? null,
    moduleId: lesson.moduleId.toString(),
    contentType: lesson.contentType,
    content: lesson.content,
    durationMinutes: lesson.durationMinutes,
    order: lesson.order,
    isActive: lesson.isActive,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "order";
const DEFAULT_SORT_ORDER = 1;

export class LessonService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage lessons"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  private async verifyModule(moduleId: string): Promise<IModule> {
    const moduleDoc = await moduleRepository.findById(moduleId);

    if (!moduleDoc || !moduleDoc.isActive) {
      throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
    }

    return moduleDoc;
  }

  private async verifyTeacherOwnsModule(moduleId: string, requestorId: string, role: string): Promise<IModule> {
    const moduleDoc = await this.verifyModule(moduleId);

    if (role === UserRole.TEACHER) {
      const course = await courseRepository.findById(moduleDoc.courseId.toString());
      if (!course || !course.isActive || course.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
      }
    }

    return moduleDoc;
  }

  async listLessons(
    query: LessonListQuery,
    moduleId: string,
    currentUserId: string,
  ): Promise<{ lessons: LessonResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsModule(moduleId, requestorId, role);

    const { page, limit, search, contentType, isActive } = query;

    const filter: Record<string, unknown> = { moduleId, isActive: true };

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (contentType) {
      filter.contentType = contentType;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const [lessons, total] = await Promise.all([
      lessonRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      lessonRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      lessons: lessons.map(toLessonResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getLessonById(id: string, moduleId: string, currentUserId: string): Promise<LessonResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const lesson = await lessonRepository.findById(id);

    if (!lesson || !lesson.isActive || lesson.moduleId.toString() !== moduleId) {
      throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
    }

    await this.verifyTeacherOwnsModule(moduleId, requestorId, role);

    return toLessonResponse(lesson);
  }

  async createLesson(
    moduleId: string,
    data: CreateLessonInput,
    currentUserId: string,
  ): Promise<LessonResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsModule(moduleId, requestorId, role);

    const lessonData: Partial<ILesson> = {
      title: data.title,
      moduleId: moduleId as unknown as ILesson["moduleId"],
      contentType: data.contentType,
      content: data.content,
      order: data.order,
      createdBy: requestorId as unknown as ILesson["createdBy"],
      durationMinutes: data.durationMinutes,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await lessonRepository.create(lessonData);
      logger.info(`Lesson created: ${data.title} (by: ${currentUserId})`);
      return toLessonResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateLesson(
    id: string,
    moduleId: string,
    data: UpdateLessonInput,
    currentUserId: string,
  ): Promise<LessonResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsModule(moduleId, requestorId, role);

    await this.getLessonForUpdate(id, moduleId, requestorId, role);

    const updateData: Partial<ILesson> = {
      title: data.title,
      contentType: data.contentType,
      content: data.content,
      order: data.order,
      durationMinutes: data.durationMinutes,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await lessonRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
      }
      logger.info(`Lesson updated: ${updated.title} (by: ${currentUserId})`);
      return toLessonResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchLesson(
    id: string,
    moduleId: string,
    data: PatchLessonInput,
    currentUserId: string,
  ): Promise<LessonResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const lesson = await this.getLessonForUpdate(id, moduleId, requestorId, role);

    const updates: Partial<ILesson> = {};

    if (data.title !== undefined) {
      updates.title = data.title;
    }

    if (data.contentType !== undefined) {
      updates.contentType = data.contentType;
    }

    if (data.content !== undefined) {
      updates.content = data.content;
    }

    if (data.order !== undefined) {
      updates.order = data.order;
    }

    if (data.durationMinutes !== undefined) {
      updates.durationMinutes = data.durationMinutes;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return toLessonResponse(lesson);
    }

    try {
      const updated = await lessonRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
      }
      logger.info(`Lesson patched: ${updated.title} (by: ${currentUserId})`);
      return toLessonResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteLesson(id: string, moduleId: string, currentUserId: string): Promise<LessonResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const lesson = await this.getLessonForUpdate(id, moduleId, requestorId, role);

    if (!lesson.isActive) {
      return toLessonResponse(lesson);
    }

    const deactivated = await lessonRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found after deactivation"]);
    }

    logger.info(`Lesson deactivated: ${lesson.title} (by: ${currentUserId})`);
    return toLessonResponse(deactivated);
  }

  private async getLessonForUpdate(
    id: string,
    moduleId: string,
    requestorId: string,
    role: string,
  ): Promise<ILesson> {
    const lesson = await lessonRepository.findById(id);

    if (!lesson || !lesson.isActive || lesson.moduleId.toString() !== moduleId) {
      throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
    }

    await this.verifyTeacherOwnsModule(moduleId, requestorId, role);

    return lesson;
  }
}

export const lessonService = new LessonService();
