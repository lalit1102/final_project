import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { classRepository } from "@/repositories/class.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IEnrollment, EnrollmentStatus } from "@/types/enrollment.types";
import { IClass } from "@/types/class.types";
import { IUser } from "@/types/user.types";
import {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  PatchEnrollmentInput,
  EnrollmentListQuery,
} from "@/validations/enrollment.validation";

export interface EnrollmentResponse {
  id: string;
  studentId: string;
  classId: string;
  courseId: string;
  status: string;
  enrolledAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toEnrollmentResponse(enrollment: IEnrollment): EnrollmentResponse {
  return {
    id: enrollment._id.toString(),
    studentId: enrollment.studentId.toString(),
    classId: enrollment.classId.toString(),
    courseId: enrollment.courseId.toString(),
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    isActive: enrollment.isActive,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class EnrollmentService {
  private async verifyAuthorized(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (!user.isActive) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Account is inactive"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  private async verifyClass(id: string): Promise<IClass> {
    const cls = await classRepository.findById(id);

    if (!cls || !cls.isActive) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    return cls;
  }

  private async verifyStudent(studentId: string): Promise<IUser> {
    const student = await userRepository.findByIdSafe(studentId);

    if (!student) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Student not found"]);
    }

    if (student.role !== UserRole.STUDENT) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Referenced user is not a STUDENT"]);
    }

    return student;
  }

  private async verifyTeacherOwnsClass(classId: string, requestorId: string, role: string): Promise<IClass> {
    const cls = await this.verifyClass(classId);

    if (role === UserRole.TEACHER) {
      const course = await (async () => {
        return await import("@/repositories/course.repository").then((mod) => mod.courseRepository.findById(cls.courseId.toString()));
      })();

      if (!course || !course.isActive) {
        throw new AppError(ERROR_MESSAGES.COURSE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Course not found"]);
      }

      if (course.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
      }
    }

    return cls;
  }

  private async verifyParentOwnsStudent(studentId: string, requestorId: string): Promise<IUser> {
    const student = await this.verifyStudent(studentId);

    const parentIds = student.parentIds ?? [];
    const isParent = parentIds.some((pid) => pid.toString() === requestorId);

    if (!isParent) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_ENROLLED, STATUS_CODES.NOT_FOUND, ["Student not found"]);
    }

    return student;
  }

  async listEnrollments(query: EnrollmentListQuery, currentUserId: string): Promise<{ enrollments: EnrollmentResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const { page, limit, studentId, classId, status, isActive, search } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.STUDENT) {
      filter.studentId = requestorId;
    } else if (role === UserRole.PARENT) {
      const parent = await userRepository.findByIdSafe(requestorId);
      if (!parent) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
      }
      const children = await userRepository.findStudentsByParentId(requestorId);
      if (children.length === 0) {
        return {
          enrollments: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      filter.studentId = { $in: children.map((c) => c._id) };
    }

    if (role === UserRole.ADMIN || role === UserRole.TEACHER) {
      if (studentId) {
        if (role === UserRole.TEACHER) {
          await this.verifyStudent(studentId);
        }
        filter.studentId = studentId;
      }
      if (role === UserRole.TEACHER) {
        const teacherClasses = await enrollmentRepository.findClassIdsByTeacher(requestorId);
        filter.classId = { $in: teacherClasses };
      }
    }

    if (role === UserRole.STUDENT) {
      if (classId) {
        filter.classId = classId;
      }
    } else if (role === UserRole.ADMIN || role === UserRole.TEACHER) {
      if (classId) {
        if (role === UserRole.TEACHER) {
          await this.verifyTeacherOwnsClass(classId, requestorId, role);
        }
        filter.classId = classId;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter["$or"] = [
        { studentId: { $regex: search, $options: "i" } },
        { classId: { $regex: search, $options: "i" } },
      ];
    }

    const [enrollments, total] = await Promise.all([
      enrollmentRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      enrollmentRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      enrollments: enrollments.map(toEnrollmentResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getEnrollmentById(id: string, currentUserId: string): Promise<EnrollmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const enrollment = await enrollmentRepository.findById(id);

    if (!enrollment || !enrollment.isActive) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
    }

    if (role === UserRole.STUDENT) {
      if (enrollment.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
    }

    if (role === UserRole.TEACHER) {
      const cls = await classRepository.findById(enrollment.classId.toString());
      if (!cls || !cls.isActive) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
      if (cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
    }

    if (role === UserRole.PARENT) {
      const student = await userRepository.findByIdSafe(enrollment.studentId.toString());
      if (!student) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
      const parentIds = student.parentIds ?? [];
      const isParent = parentIds.some((pid) => pid.toString() === requestorId);
      if (!isParent) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
    }

    return toEnrollmentResponse(enrollment);
  }

  async createEnrollment(data: CreateEnrollmentInput, currentUserId: string): Promise<EnrollmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can create enrollments"]);
    }

    await this.verifyStudent(data.studentId);
    const cls = await this.verifyTeacherOwnsClass(data.classId, requestorId, role);
    const courseId = cls.courseId.toString();

    const existing = await enrollmentRepository.findByStudentAndClass(data.studentId, data.classId);
    if (existing) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_EXISTS, STATUS_CODES.CONFLICT, ["Student is already enrolled in this class"]);
    }

    const enrollmentData: Partial<IEnrollment> = {
      studentId: data.studentId as unknown as IEnrollment["studentId"],
      classId: data.classId as unknown as IEnrollment["classId"],
      courseId: courseId as unknown as IEnrollment["courseId"],
      status: data.status ?? EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    };

    try {
      const created = await enrollmentRepository.create(enrollmentData);
      logger.info(`Enrollment created: student=${data.studentId}, class=${data.classId} (by: ${currentUserId})`);
      return toEnrollmentResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateEnrollment(id: string, data: UpdateEnrollmentInput, currentUserId: string): Promise<EnrollmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update enrollments"]);
    }

    await this.getEnrollmentForUpdate(id, requestorId, role);
    await this.verifyStudent(data.studentId);
    const cls = await this.verifyTeacherOwnsClass(data.classId, requestorId, role);
    const courseId = cls.courseId.toString();

    const duplicateCheck = await enrollmentRepository.findByStudentAndClass(data.studentId, data.classId);
    if (duplicateCheck && duplicateCheck._id.toString() !== id) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_EXISTS, STATUS_CODES.CONFLICT, ["Student is already enrolled in this class"]);
    }

    const updateData: Partial<IEnrollment> = {
      studentId: data.studentId as unknown as IEnrollment["studentId"],
      classId: data.classId as unknown as IEnrollment["classId"],
      courseId: courseId as unknown as IEnrollment["courseId"],
      status: data.status,
    };

    try {
      const updated = await enrollmentRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found after update"]);
      }
      logger.info(`Enrollment updated: ${id} (by: ${currentUserId})`);
      return toEnrollmentResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchEnrollment(id: string, data: PatchEnrollmentInput, currentUserId: string): Promise<EnrollmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update enrollments"]);
    }

    const enrollment = await this.getEnrollmentForUpdate(id, requestorId, role);

    const updates: Partial<IEnrollment> = {};

    if (data.status !== undefined) {
      updates.status = data.status;
    }

    if (Object.keys(updates).length === 0) {
      return toEnrollmentResponse(enrollment);
    }

    try {
      const updated = await enrollmentRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found after patch"]);
      }
      logger.info(`Enrollment patched: ${id} (by: ${currentUserId})`);
      return toEnrollmentResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

   async deleteEnrollment(id: string, currentUserId: string): Promise<EnrollmentResponse> {
     const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

     if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
       throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can delete enrollments"]);
     }

     const enrollment = await this.getEnrollmentForDelete(id, requestorId, role);

     if (!enrollment.isActive) {
       return toEnrollmentResponse(enrollment);
     }

    const deactivated = await enrollmentRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found after deactivation"]);
    }

    logger.info(`Enrollment deactivated: ${id} (by: ${currentUserId})`);
    return toEnrollmentResponse(deactivated);
  }

  private async getEnrollmentForUpdate(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<IEnrollment> {
    const enrollment = await enrollmentRepository.findById(id);

    if (!enrollment || !enrollment.isActive) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
    }

    if (role === UserRole.TEACHER) {
      const cls = await classRepository.findById(enrollment.classId.toString());
      if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
    }

    return enrollment;
  }

  private async getEnrollmentForDelete(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<IEnrollment> {
    const enrollment = await enrollmentRepository.findById(id);

    if (!enrollment) {
      throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
    }

    if (role === UserRole.TEACHER) {
      const cls = await classRepository.findById(enrollment.classId.toString());
      if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ENROLLMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Enrollment not found"]);
      }
    }

    return enrollment;
  }
}

export const enrollmentService = new EnrollmentService();
