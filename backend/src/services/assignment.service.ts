import { assignmentRepository } from "@/repositories/assignment.repository";
import { classRepository } from "@/repositories/class.repository";
import { userRepository } from "@/repositories/user.repository";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IAssignment, AssignmentStatus } from "@/types/assignment.types";
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  PatchAssignmentInput,
  AssignmentListQuery,
} from "@/validations/assignment.validation";

export interface AssignmentResponse {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  courseId: string;
  dueDate: Date;
  maxPoints: number;
  status: string;
  allowLateSubmissions: boolean;
  latePenaltyPercent: number;
  submissionType: string;
  attachments: string[];
  createdBy: string;
  publishedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toAssignmentResponse(assignment: IAssignment): AssignmentResponse {
  return {
    id: assignment._id.toString(),
    title: assignment.title,
    description: assignment.description ?? null,
    classId: assignment.classId.toString(),
    courseId: assignment.courseId.toString(),
    dueDate: assignment.dueDate,
    maxPoints: assignment.maxPoints,
    status: assignment.status,
    allowLateSubmissions: assignment.allowLateSubmissions,
    latePenaltyPercent: assignment.latePenaltyPercent,
    submissionType: assignment.submissionType,
    attachments: assignment.attachments,
    createdBy: assignment.createdBy.toString(),
    publishedAt: assignment.publishedAt ?? null,
    isActive: assignment.isActive,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class AssignmentService {
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

  private async verifyClass(id: string) {
    const cls = await classRepository.findById(id);

    if (!cls || !cls.isActive) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

    return cls;
  }

  private async verifyTeacherOwnsClass(classId: string, requestorId: string, role: string) {
    const cls = await this.verifyClass(classId);

    if (role === UserRole.TEACHER) {
      if (cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
      }
    }

    return cls;
  }

  private async isStudentEnrolledInClass(studentId: string, classId: string, courseId: string): Promise<boolean> {
    const enrollment = await enrollmentRepository.findByStudentAndClass(studentId, classId);
    if (!enrollment) return false;

    if (enrollment.courseId.toString() !== courseId) return false;

    return true;
  }

  private async isChildEnrolledInClass(parentId: string, classId: string, courseId: string): Promise<boolean> {
    const children = await userRepository.findStudentsByParentId(parentId);
    for (const child of children) {
      const enrollment = await enrollmentRepository.findByStudentAndClass(child._id.toString(), classId);
      if (enrollment && enrollment.courseId.toString() === courseId) {
        return true;
      }
    }
    return false;
  }

  async listAssignments(query: AssignmentListQuery, currentUserId: string): Promise<{ assignments: AssignmentResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const { page, limit, search, classId, courseId, status, submissionType, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      const teacherClassIds = await classRepository.findActiveClassIdsByTeacher(requestorId);
      filter.classId = { $in: teacherClassIds };
    }

    if (role === UserRole.STUDENT) {
      const studentId = requestorId;
      const enrollments = await enrollmentRepository.findAllPaginated(
        { studentId, isActive: true },
        1,
        1000,
        "createdAt",
        -1,
      );
      const enrolledClassIds = [...new Set(enrollments.map((e) => e.classId.toString()))];
      if (enrolledClassIds.length === 0) {
        return { assignments: [], pagination: { page, limit, total: 0, totalPages: 1 } };
      }
      filter.classId = { $in: enrolledClassIds };
      filter.status = AssignmentStatus.PUBLISHED;
    }

    if (role === UserRole.PARENT) {
      const children = await userRepository.findStudentsByParentId(requestorId);
      if (children.length === 0) {
        return { assignments: [], pagination: { page, limit, total: 0, totalPages: 1 } };
      }
      const studentIds = children.map((c) => c._id);
      const enrollments = await enrollmentRepository.findAllPaginated(
        { studentId: { $in: studentIds }, isActive: true },
        1,
        1000,
        "createdAt",
        -1,
      );
      const enrolledClassIds = [...new Set(enrollments.map((e) => e.classId.toString()))];
      if (enrolledClassIds.length === 0) {
        return { assignments: [], pagination: { page, limit, total: 0, totalPages: 1 } };
      }
      filter.classId = { $in: enrolledClassIds };
      filter.status = AssignmentStatus.PUBLISHED;
    }

    if (role === UserRole.ADMIN) {
      if (classId) {
        filter.classId = classId;
      }
      if (courseId) {
        filter.courseId = courseId;
      }
    } else if (role === UserRole.TEACHER) {
      if (classId) {
        await this.verifyTeacherOwnsClass(classId, requestorId, role);
        filter.classId = classId;
      }
      if (courseId) {
        filter.courseId = courseId;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (submissionType) {
      filter.submissionType = submissionType;
    }

    if (role === UserRole.ADMIN) {
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
    } else {
      filter.isActive = true;
    }

    if (search) {
      filter["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [assignments, total] = await Promise.all([
      assignmentRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      assignmentRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      assignments: assignments.map(toAssignmentResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getAssignmentById(id: string, currentUserId: string): Promise<AssignmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const assignment = await assignmentRepository.findById(id);

    if (!assignment || !assignment.isActive) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    if (role === UserRole.TEACHER) {
      const cls = await classRepository.findById(assignment.classId.toString());
      if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
    }

    if (role === UserRole.STUDENT) {
      const cls = await classRepository.findById(assignment.classId.toString());
      if (!cls || !cls.isActive) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
      const enrolled = await this.isStudentEnrolledInClass(requestorId, assignment.classId.toString(), assignment.courseId.toString());
      if (!enrolled) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
      if (assignment.status !== AssignmentStatus.PUBLISHED) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
    }

    if (role === UserRole.PARENT) {
      const cls = await classRepository.findById(assignment.classId.toString());
      if (!cls || !cls.isActive) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
      const childEnrolled = await this.isChildEnrolledInClass(requestorId, assignment.classId.toString(), assignment.courseId.toString());
      if (!childEnrolled) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
      if (assignment.status !== AssignmentStatus.PUBLISHED) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
    }

    return toAssignmentResponse(assignment);
  }

  async createAssignment(data: CreateAssignmentInput, currentUserId: string): Promise<AssignmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can create assignments"]);
    }

    const cls = await this.verifyTeacherOwnsClass(data.classId, requestorId, role);
    const courseId = cls.courseId.toString();

    const dueDate = new Date(data.dueDate);
    if (dueDate <= new Date()) {
      throw new AppError(ERROR_MESSAGES.INVALID_DUE_DATE, STATUS_CODES.BAD_REQUEST, ["Due date must be in the future"]);
    }

    const assignmentData = {
      title: data.title,
      description: data.description ?? null,
      classId: data.classId as unknown as IAssignment["classId"],
      courseId: courseId as unknown as IAssignment["courseId"],
      dueDate: dueDate,
      maxPoints: data.maxPoints,
      status: data.status ?? AssignmentStatus.DRAFT,
      allowLateSubmissions: data.allowLateSubmissions ?? false,
      latePenaltyPercent: data.latePenaltyPercent ?? 0,
      submissionType: data.submissionType ?? "TEXT",
      attachments: data.attachments ?? [],
      createdBy: requestorId as unknown as IAssignment["createdBy"],
      publishedAt: data.status === AssignmentStatus.PUBLISHED ? new Date() : null,
      isActive: true,
    };

    try {
      const created = await assignmentRepository.create(assignmentData as Partial<IAssignment>);
      logger.info(`Assignment created: ${data.title} (by: ${currentUserId})`);
      return toAssignmentResponse(created);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_EXISTS, STATUS_CODES.CONFLICT, ["An assignment with this title already exists for this class"]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateAssignment(id: string, data: UpdateAssignmentInput, currentUserId: string): Promise<AssignmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update assignments"]);
    }

    const assignment = await this.getAssignmentForUpdate(id, requestorId, role);

    await this.verifyTeacherOwnsClass(data.classId, requestorId, role);
    const cls = await classRepository.findById(data.classId);
    if (!cls) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }
    const courseId = cls.courseId.toString();

    const dueDate = new Date(data.dueDate);
    if (dueDate <= new Date()) {
      throw new AppError(ERROR_MESSAGES.INVALID_DUE_DATE, STATUS_CODES.BAD_REQUEST, ["Due date must be in the future"]);
    }

    const updateData: Partial<IAssignment> = {
      title: data.title,
      description: data.description ?? null,
      classId: data.classId as unknown as IAssignment["classId"],
      courseId: courseId as unknown as IAssignment["courseId"],
      dueDate: dueDate,
      maxPoints: data.maxPoints,
      status: data.status,
      allowLateSubmissions: data.allowLateSubmissions,
      latePenaltyPercent: data.latePenaltyPercent,
      submissionType: data.submissionType,
      attachments: data.attachments,
      publishedAt: data.status === AssignmentStatus.PUBLISHED && assignment.publishedAt === null
        ? new Date()
        : assignment.publishedAt,
    };

    try {
      const updated = await assignmentRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found after update"]);
      }
      logger.info(`Assignment updated: ${updated.title} (by: ${currentUserId})`);
      return toAssignmentResponse(updated);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_EXISTS, STATUS_CODES.CONFLICT, ["An assignment with this title already exists for this class"]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchAssignment(id: string, data: PatchAssignmentInput, currentUserId: string): Promise<AssignmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update assignments"]);
    }

    const assignment = await this.getAssignmentForUpdate(id, requestorId, role);

    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updates.title = data.title;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (data.classId !== undefined && role !== UserRole.TEACHER) {
      const cls = await this.verifyClass(data.classId);
      if (cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
      }
      updates.classId = data.classId;
      updates.courseId = cls.courseId.toString();
    }

    if (data.dueDate !== undefined) {
      const dueDate = new Date(data.dueDate);
      if (dueDate <= new Date()) {
        throw new AppError(ERROR_MESSAGES.INVALID_DUE_DATE, STATUS_CODES.BAD_REQUEST, ["Due date must be in the future"]);
      }
      updates.dueDate = dueDate;
    }

    if (data.maxPoints !== undefined) {
      updates.maxPoints = data.maxPoints;
    }

    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === AssignmentStatus.PUBLISHED && !assignment.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    if (data.allowLateSubmissions !== undefined) {
      updates.allowLateSubmissions = data.allowLateSubmissions;
    }

    if (data.latePenaltyPercent !== undefined) {
      updates.latePenaltyPercent = data.latePenaltyPercent;
    }

    if (data.submissionType !== undefined) {
      updates.submissionType = data.submissionType;
    }

    if (data.attachments !== undefined) {
      updates.attachments = data.attachments;
    }

    if (Object.keys(updates).length === 0) {
      return toAssignmentResponse(assignment);
    }

    try {
      const updated = await assignmentRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found after patch"]);
      }
      logger.info(`Assignment patched: ${updated.title} (by: ${currentUserId})`);
      return toAssignmentResponse(updated);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_EXISTS, STATUS_CODES.CONFLICT, ["An assignment with this title already exists for this class"]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteAssignment(id: string, currentUserId: string): Promise<AssignmentResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can delete assignments"]);
    }

    const assignment = await this.getAssignmentForDelete(id, requestorId, role);

    if (!assignment.isActive) {
      return toAssignmentResponse(assignment);
    }

    const deactivated = await assignmentRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found after deactivation"]);
    }

    logger.info(`Assignment deactivated: ${assignment.title} (by: ${currentUserId})`);
    return toAssignmentResponse(deactivated);
  }

  private async getAssignmentForUpdate(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<IAssignment> {
    const assignment = await assignmentRepository.findById(id);

    if (!assignment || !assignment.isActive) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    if (role === UserRole.TEACHER) {
      const cls = await classRepository.findById(assignment.classId.toString());
      if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
    }

     return assignment;
   }

   private async getAssignmentForDelete(
     id: string,
     requestorId: string,
     role: string,
   ): Promise<IAssignment> {
     const assignment = await assignmentRepository.findById(id);

     if (!assignment) {
       throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
     }

     if (role === UserRole.TEACHER) {
       const cls = await classRepository.findById(assignment.classId.toString());
       if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
         throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
       }
     }

     return assignment;
   }
}

export const assignmentService = new AssignmentService();
