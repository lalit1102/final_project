import { gradeRepository } from "@/repositories/grade.repository";
import { assignmentRepository } from "@/repositories/assignment.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import { classRepository } from "@/repositories/class.repository";
import { userRepository } from "@/repositories/user.repository";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IUser } from "@/types/user.types";
import { IAssignment, AssignmentStatus } from "@/types/assignment.types";
import { IGrade } from "@/types/grade.types";
import { ISubmission } from "@/types/submission.types";
import {
  CreateGradeInput,
  UpdateGradeInput,
  PatchGradeInput,
  GradeListQuery,
} from "@/validations/grade.validation";

export interface GradeResponse {
  id: string;
  studentId: string;
  assignmentId: string;
  submissionId: string | null;
  classId: string;
  points: number;
  maxPoints: number;
  percentage: number;
  feedback: string | null;
  gradedBy: string;
  gradedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toGradeResponse(grade: IGrade): GradeResponse {
  return {
    id: grade._id.toString(),
    studentId: grade.studentId.toString(),
    assignmentId: grade.assignmentId.toString(),
    submissionId: grade.submissionId ? grade.submissionId.toString() : null,
    classId: grade.classId.toString(),
    points: grade.points,
    maxPoints: grade.maxPoints,
    percentage: grade.percentage,
    feedback: grade.feedback ?? null,
    gradedBy: grade.gradedBy.toString(),
    gradedAt: grade.gradedAt,
    isActive: grade.isActive,
    createdAt: grade.createdAt,
    updatedAt: grade.updatedAt,
  };
}

function calculatePercentage(points: number, maxPoints: number): number {
  if (maxPoints === 0) return 0;
  return Math.round((points / maxPoints) * 10000) / 100;
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class GradeService {
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

  private async verifyAssignment(id: string): Promise<IAssignment> {
    const assignment = await assignmentRepository.findById(id);

    if (!assignment || !assignment.isActive) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    return assignment;
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

  private async verifyTeacherOwnsAssignment(assignmentId: string, requestorId: string, role: string): Promise<IAssignment> {
    const assignment = await this.verifyAssignment(assignmentId);

    if (role === UserRole.TEACHER) {
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
      }
    }

    return assignment;
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

  private async getGradeForUpdate(id: string): Promise<IGrade> {
    const grade = await gradeRepository.findById(id);

    if (!grade || !grade.isActive) {
      throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
    }

    return grade;
  }

  private async getGradeForDelete(id: string): Promise<IGrade> {
    const grade = await gradeRepository.findById(id);

    if (!grade) {
      throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
    }

    return grade;
  }

  private async verifySubmission(
    submissionId: string,
    assignmentId: string,
    studentId: string,
  ): Promise<ISubmission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission || !submission.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }
    if (submission.assignmentId.toString() !== assignmentId) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }
    if (submission.studentId.toString() !== studentId) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }
    return submission;
  }

  private async setSubmissionGradedAt(submissionId: string): Promise<void> {
    try {
      await submissionRepository.update(submissionId, { $set: { gradedAt: new Date() } });
    } catch (error) {
      logger.warn(`Failed to update Submission.gradedAt for submission ${submissionId}`, error);
    }
  }

  private async clearSubmissionGradedAt(submissionId: string): Promise<void> {
    try {
      const submission = await submissionRepository.findById(submissionId);
      if (submission) {
        await submissionRepository.update(submissionId, { $set: { gradedAt: null } });
      }
    } catch (error) {
      logger.warn(`Failed to clear Submission.gradedAt for submission ${submissionId}`, error);
    }
  }

  async listGrades(
    query: GradeListQuery,
    currentUserId: string,
  ): Promise<{ grades: GradeResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const { page, limit, search, studentId, assignmentId, classId, submissionId, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      const teacherClassIds = await classRepository.findActiveClassIdsByTeacher(requestorId);
      filter.classId = { $in: teacherClassIds };
    }

    if (role === UserRole.STUDENT) {
      filter.studentId = requestorId;
    }

    if (role === UserRole.PARENT) {
      const children = await userRepository.findStudentsByParentId(requestorId);
      if (children.length === 0) {
        return {
          grades: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      filter.studentId = { $in: children.map((c) => c._id) };
    }

    if (role === UserRole.ADMIN) {
      if (studentId) {
        filter.studentId = studentId;
      }
      if (assignmentId) {
        filter.assignmentId = assignmentId;
      }
      if (classId) {
        filter.classId = classId;
      }
      if (submissionId) {
        filter.submissionId = submissionId;
      }
    } else if (role === UserRole.TEACHER) {
      if (studentId) {
        filter.studentId = studentId;
      }
      if (assignmentId) {
        await this.verifyTeacherOwnsAssignment(assignmentId, requestorId, role);
        filter.assignmentId = assignmentId;
      }
      if (classId) {
        const cls = await classRepository.findById(classId);
        if (!cls || !cls.isActive || cls.teacherId.toString() !== requestorId) {
          throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
        }
        filter.classId = classId;
      }
      if (submissionId) {
        const submission = await submissionRepository.findById(submissionId);
        if (!submission || !submission.isActive) {
          throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
        }
        await this.verifyTeacherOwnsAssignment(submission.assignmentId.toString(), requestorId, role);
        filter.submissionId = submissionId;
      }
    } else if (role === UserRole.STUDENT) {
      if (assignmentId) {
        const assignment = await this.verifyAssignment(assignmentId);
        if (assignment.status !== AssignmentStatus.PUBLISHED) {
          throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
        }
        if (
          !(await this.isStudentEnrolledInClass(requestorId, assignment.classId.toString(), assignment.courseId.toString()))
        ) {
          throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
        }
        filter.assignmentId = assignmentId;
      }
    } else if (role === UserRole.PARENT) {
      if (assignmentId) {
        const assignment = await this.verifyAssignment(assignmentId);
        const childEnrolled = await this.isChildEnrolledInClass(
          requestorId,
          assignment.classId.toString(),
          assignment.courseId.toString(),
        );
        if (!childEnrolled || assignment.status !== AssignmentStatus.PUBLISHED) {
          throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
        }
        filter.assignmentId = assignmentId;
      }
    }

    if (role === UserRole.ADMIN) {
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
    } else {
      filter.isActive = true;
    }

    if (search) {
      filter["$or"] = [{ feedback: { $regex: search, $options: "i" } }, { points: { $regex: search, $options: "i" } }];
    }

    const [grades, total] = await Promise.all([
      gradeRepository.findAllPaginated(filter, page, limit, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER as 1 | -1),
      gradeRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      grades: grades.map(toGradeResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getGradeById(id: string, currentUserId: string): Promise<GradeResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const grade = await gradeRepository.findById(id);

    if (!grade || !grade.isActive) {
      throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
    }

    if (role === UserRole.STUDENT) {
      if (grade.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    if (role === UserRole.TEACHER) {
      const assignment = await assignmentRepository.findById(grade.assignmentId.toString());
      if (!assignment || !assignment.isActive) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    if (role === UserRole.PARENT) {
      const student = await userRepository.findByIdSafe(grade.studentId.toString());
      if (!student) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
      const parentIds = student.parentIds ?? [];
      const isParent = parentIds.some((pid) => pid.toString() === requestorId);
      if (!isParent) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    return toGradeResponse(grade);
  }

  async createGrade(data: CreateGradeInput, currentUserId: string): Promise<GradeResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can create grades"]);
    }

    await this.verifyStudent(data.studentId);

    const assignment = await this.verifyAssignment(data.assignmentId);

    await this.verifyTeacherOwnsAssignment(data.assignmentId, requestorId, role);

    if (role === UserRole.TEACHER) {
      const enrolled = await this.isStudentEnrolledInClass(
        data.studentId,
        assignment.classId.toString(),
        assignment.courseId.toString(),
      );
      if (!enrolled) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    if (data.submissionId) {
      await this.verifySubmission(data.submissionId, assignment._id.toString(), data.studentId);
    }

    if (data.points > assignment.maxPoints) {
      throw new AppError(ERROR_MESSAGES.INVALID_SCORE, STATUS_CODES.BAD_REQUEST, [
        `Points (${data.points}) must not exceed assignment maximum (${assignment.maxPoints})`,
      ]);
    }

    if (data.points < 0) {
      throw new AppError(ERROR_MESSAGES.INVALID_SCORE, STATUS_CODES.BAD_REQUEST, ["Points must be at least 0"]);
    }

    const existing = await gradeRepository.findByStudentAndAssignment(data.studentId, data.assignmentId);
    if (existing) {
      throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, [
        "A grade for this student and assignment already exists.",
      ]);
    }

    const maxPoints = assignment.maxPoints;
    const percentage = calculatePercentage(data.points, maxPoints);

    const gradeData = {
      studentId: data.studentId as unknown as IGrade["studentId"],
      assignmentId: data.assignmentId as unknown as IGrade["assignmentId"],
      submissionId: data.submissionId ? (data.submissionId as unknown as IGrade["submissionId"]) : null,
      classId: assignment.classId as unknown as IGrade["classId"],
      points: data.points,
      maxPoints,
      percentage,
      feedback: data.feedback ?? null,
      gradedBy: requestorId as unknown as IGrade["gradedBy"],
      gradedAt: new Date(),
      isActive: true,
    };

    try {
      const created = await gradeRepository.create(gradeData as Partial<IGrade>);
      logger.info(
        `Grade created: student=${data.studentId}, assignment=${data.assignmentId} (by: ${currentUserId})`,
      );

      if (data.submissionId) {
        void this.setSubmissionGradedAt(data.submissionId);
      }

      return toGradeResponse(created);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, [
          "A grade for this student and assignment already exists.",
        ]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateGrade(id: string, data: UpdateGradeInput, currentUserId: string): Promise<GradeResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update grades"]);
    }

    await this.getGradeForUpdate(id);

    await this.verifyStudent(data.studentId);

    await this.verifyTeacherOwnsAssignment(data.assignmentId, requestorId, role);

    const assignment = await this.verifyAssignment(data.assignmentId);

    if (role === UserRole.TEACHER) {
      const enrolled = await this.isStudentEnrolledInClass(
        data.studentId,
        assignment.classId.toString(),
        assignment.courseId.toString(),
      );
      if (!enrolled) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    if (data.points > assignment.maxPoints) {
      throw new AppError(ERROR_MESSAGES.INVALID_SCORE, STATUS_CODES.BAD_REQUEST, [
        `Points (${data.points}) must not exceed assignment maximum (${assignment.maxPoints})`,
      ]);
    }

    if (data.points < 0) {
      throw new AppError(ERROR_MESSAGES.INVALID_SCORE, STATUS_CODES.BAD_REQUEST, ["Points must be at least 0"]);
    }

    if (data.submissionId) {
      await this.verifySubmission(data.submissionId, data.assignmentId, data.studentId);
    }

    const existing = await gradeRepository.findByStudentAndAssignment(data.studentId, data.assignmentId);
    if (existing && existing._id.toString() !== id) {
      throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, [
        "A grade for this student and assignment already exists.",
      ]);
    }

    const maxPoints = assignment.maxPoints;
    const percentage = calculatePercentage(data.points, maxPoints);

    const updateData: Partial<IGrade> = {
      studentId: data.studentId as unknown as IGrade["studentId"],
      assignmentId: data.assignmentId as unknown as IGrade["assignmentId"],
      submissionId: data.submissionId ? (data.submissionId as unknown as IGrade["submissionId"]) : null,
      points: data.points,
      maxPoints,
      percentage,
      feedback: data.feedback ?? null,
      gradedBy: requestorId as unknown as IGrade["gradedBy"],
      gradedAt: new Date(),
    };

    try {
      const updated = await gradeRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found after update"]);
      }
      logger.info(`Grade updated: ${id} (by: ${currentUserId})`);

      if (data.submissionId) {
        void this.setSubmissionGradedAt(data.submissionId);
      }

      return toGradeResponse(updated);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, [
          "A grade for this student and assignment already exists.",
        ]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchGrade(id: string, data: PatchGradeInput, currentUserId: string): Promise<GradeResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can update grades"]);
    }

    const grade = await this.getGradeForUpdate(id);

    const assignment = await assignmentRepository.findById(grade.assignmentId.toString());
    if (!assignment || !assignment.isActive) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    if (role === UserRole.TEACHER) {
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    const updates: Partial<IGrade> = {};

    if (data.points !== undefined) {
      if (data.points > assignment.maxPoints) {
        throw new AppError(ERROR_MESSAGES.INVALID_SCORE, STATUS_CODES.BAD_REQUEST, [
          `Points (${data.points}) must not exceed assignment maximum (${assignment.maxPoints})`,
        ]);
      }
      updates.points = data.points;
      updates.maxPoints = assignment.maxPoints;
      updates.percentage = calculatePercentage(data.points, assignment.maxPoints);
    }

    if (data.feedback !== undefined) {
      updates.feedback = data.feedback ?? null;
    }

    updates.gradedBy = requestorId as unknown as IGrade["gradedBy"];
    updates.gradedAt = new Date();

    if (Object.keys(updates).length === 0) {
      return toGradeResponse(grade);
    }

    try {
      const updated = await gradeRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found after patch"]);
      }
      logger.info(`Grade patched: ${id} (by: ${currentUserId})`);

      if (grade.submissionId) {
        void this.setSubmissionGradedAt(grade.submissionId.toString());
      }

      return toGradeResponse(updated);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, [
          "A grade for this student and assignment already exists.",
        ]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteGrade(id: string, currentUserId: string): Promise<GradeResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and teachers can delete grades"]);
    }

    const grade = await this.getGradeForDelete(id);

    const assignment = await assignmentRepository.findById(grade.assignmentId.toString());
    if (!assignment || !assignment.isActive) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    if (role === UserRole.TEACHER) {
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found"]);
      }
    }

    if (!grade.isActive) {
      return toGradeResponse(grade);
    }

    const deactivated = await gradeRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.GRADE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Grade not found after deactivation"]);
    }

    if (grade.submissionId && grade.submissionId.toString()) {
      void this.clearSubmissionGradedAt(grade.submissionId.toString());
    }

    logger.info(`Grade deactivated: ${id} (by: ${currentUserId})`);
    return toGradeResponse(deactivated);
  }
}

export const gradeService = new GradeService();
