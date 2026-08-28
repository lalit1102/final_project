import { courseRepository } from "@/repositories/course.repository";
import { subjectRepository } from "@/repositories/subject.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { ICourse } from "@/types/course.types";
import { ISubject } from "@/types/subject.types";
import {
  CreateCourseInput,
  UpdateCourseInput,
  PatchCourseInput,
  CourseListQuery,
} from "@/validations/course.validation";

export interface CourseResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  subjectId: string;
  teacherId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toCourseResponse(course: ICourse): CourseResponse {
  return {
    id: course._id.toString(),
    name: course.name,
    code: course.code,
    description: course.description ?? null,
    subjectId: course.subjectId.toString(),
    teacherId: course.teacherId.toString(),
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class CourseService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage courses"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  private async verifySubject(subjectId: string): Promise<ISubject> {
    const subject = await subjectRepository.findById(subjectId);

    if (!subject || !subject.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }

    return subject;
  }

  private async verifyTeacherOwnsSubject(subjectId: string, requestorId: string, role: string): Promise<void> {
    const subject = await this.verifySubject(subjectId);

    if (role === UserRole.TEACHER && subject.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }
  }

  async listCourses(query: CourseListQuery, currentUserId: string): Promise<{ courses: CourseResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const { page, limit, search, subjectId, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      filter.teacherId = requestorId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (subjectId) {
      await this.verifySubject(subjectId);
      filter.subjectId = subjectId;
    }

    if (search) {
      filter["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const [courses, total] = await Promise.all([
      courseRepository.findAllPaginated(filter, page, limit, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER as 1 | -1),
      courseRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      courses: courses.map(toCourseResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getCourseById(id: string, currentUserId: string): Promise<CourseResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const course = await courseRepository.findById(id);

    if (!course || !course.isActive) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }

    if (role === UserRole.TEACHER && course.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }

    return toCourseResponse(course);
  }

  async createCourse(data: CreateCourseInput, currentUserId: string): Promise<CourseResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsSubject(data.subjectId, requestorId, role);

    let teacherId: string;

    if (role === UserRole.ADMIN) {
      if (data.teacherId) {
        const targetTeacher = await userRepository.findByIdSafe(data.teacherId);
        if (!targetTeacher) {
          throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Teacher not found"]);
        }
        if (targetTeacher.role !== UserRole.TEACHER) {
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Can only assign courses to teachers"]);
        }
        teacherId = data.teacherId;
      } else {
        teacherId = requestorId;
      }
    } else {
      teacherId = requestorId;
    }

    const courseData: Partial<ICourse> = {
      name: data.name,
      code: data.code,
      subjectId: data.subjectId as unknown as ICourse["subjectId"],
      teacherId: teacherId as unknown as ICourse["teacherId"],
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await courseRepository.create(courseData);
      logger.info(`Course created: ${data.name} (by: ${currentUserId})`);
      return toCourseResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateCourse(id: string, data: UpdateCourseInput, currentUserId: string): Promise<CourseResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.getCourseForUpdate(id, requestorId, role);

    await this.verifyTeacherOwnsSubject(data.subjectId, requestorId, role);

    const updateData: Partial<ICourse> = {
      name: data.name,
      code: data.code,
      subjectId: data.subjectId as unknown as ICourse["subjectId"],
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await courseRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
      }
      logger.info(`Course updated: ${updated.name} (by: ${currentUserId})`);
      return toCourseResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchCourse(id: string, data: PatchCourseInput, currentUserId: string): Promise<CourseResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const course = await this.getCourseForUpdate(id, requestorId, role);

    if (data.subjectId !== undefined) {
      await this.verifyTeacherOwnsSubject(data.subjectId, requestorId, role);
    }

    const updates: Partial<ICourse> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.code !== undefined) {
      updates.code = data.code;
    }

    if (data.subjectId !== undefined) {
      updates.subjectId = data.subjectId as unknown as ICourse["subjectId"];
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return toCourseResponse(course);
    }

    try {
      const updated = await courseRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
      }
      logger.info(`Course patched: ${updated.name} (by: ${currentUserId})`);
      return toCourseResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteCourse(id: string, currentUserId: string): Promise<CourseResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const course = await this.getCourseForUpdate(id, requestorId, role);

    if (!course.isActive) {
      return toCourseResponse(course);
    }

    const deactivated = await courseRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found after deactivation"]);
    }

    logger.info(`Course deactivated: ${course.name} (by: ${currentUserId})`);
    return toCourseResponse(deactivated);
  }

  private async getCourseForUpdate(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<ICourse> {
    const course = await courseRepository.findById(id);

    if (!course || !course.isActive) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }

    if (role === UserRole.TEACHER && course.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
    }

    return course;
  }
}

export const courseService = new CourseService();
