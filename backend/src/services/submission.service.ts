import { submissionRepository } from "@/repositories/submission.repository";
import { assignmentRepository } from "@/repositories/assignment.repository";
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
import { IClass } from "@/types/class.types";
import { ISubmission, SubmissionStatus } from "@/types/submission.types";
import {
  CreateSubmissionInput,
  UpdateSubmissionInput,
  PatchSubmissionInput,
  SubmissionListQuery,
} from "@/validations/submission.validation";

export interface SubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  classId: string;
  content: string | null;
  attachments: string[];
  submittedAt: Date | null;
  status: string;
  isLate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSubmissionResponse(submission: ISubmission): SubmissionResponse {
  return {
    id: submission._id.toString(),
    assignmentId: submission.assignmentId.toString(),
    studentId: submission.studentId.toString(),
    classId: submission.classId.toString(),
    content: submission.content ?? null,
    attachments: submission.attachments,
    submittedAt: submission.submittedAt ?? null,
    status: submission.status,
    isLate: submission.isLate,
    isActive: submission.isActive,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class SubmissionService {
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

  private async verifyTeacherOwnsClass(classId: string, requestorId: string, role: string): Promise<IClass> {
    const cls = await classRepository.findById(classId);

    if (!cls || !cls.isActive) {
      throw new AppError(ERROR_MESSAGES.CLASS_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Class not found"]);
    }

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

  private async getSubmissionForUpdate(id: string): Promise<ISubmission> {
    const submission = await submissionRepository.findById(id);

    if (!submission || !submission.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }

    return submission;
  }

  private async getSubmissionForDelete(id: string): Promise<ISubmission> {
    const submission = await submissionRepository.findById(id);

    if (!submission) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }

    return submission;
  }

  async listSubmissions(query: SubmissionListQuery, currentUserId: string): Promise<{ submissions: SubmissionResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const { page, limit, search, assignmentId, studentId, classId, status, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      const teacherClassIds = await classRepository.findActiveClassIdsByTeacher(requestorId);
      const teacherAssignments = await assignmentRepository.findAllPaginated(
        { classId: { $in: teacherClassIds }, isActive: true },
        1,
        1000,
        "createdAt",
        -1,
      );
      const teacherAssignmentIds = teacherAssignments.map((a) => a._id.toString());
      filter.assignmentId = { $in: teacherAssignmentIds };
    }

    if (role === UserRole.STUDENT) {
      filter.studentId = requestorId;
    }

    if (role === UserRole.PARENT) {
      const children = await userRepository.findStudentsByParentId(requestorId);
      if (children.length === 0) {
        return {
          submissions: [],
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
    } else if (role === UserRole.TEACHER) {
      if (studentId) {
        filter.studentId = studentId;
      }
      if (assignmentId) {
        const assignment = await this.verifyTeacherOwnsAssignment(assignmentId, requestorId, role);
        void assignment;
        filter.assignmentId = assignmentId;
      }
      if (classId) {
        await this.verifyTeacherOwnsClass(classId, requestorId, role);
        filter.classId = classId;
      }
    } else if (role === UserRole.STUDENT) {
      if (assignmentId) {
        const assignment = await this.verifyAssignment(assignmentId);
        if (assignment.status !== AssignmentStatus.PUBLISHED) {
          throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
        }
        filter.assignmentId = assignmentId;
      }
    } else if (role === UserRole.PARENT) {
      if (assignmentId) {
        const assignment = await this.verifyAssignment(assignmentId);
        const childEnrolled = await this.isChildEnrolledInClass(requestorId, assignment.classId.toString(), assignment.courseId.toString());
        if (!childEnrolled || assignment.status !== AssignmentStatus.PUBLISHED) {
          throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
        }
        filter.assignmentId = assignmentId;
      }
    }

    if (status) {
      filter.status = status;
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
        { content: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    const [submissions, total] = await Promise.all([
      submissionRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      submissionRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      submissions: submissions.map(toSubmissionResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getSubmissionById(id: string, currentUserId: string): Promise<SubmissionResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    const submission = await submissionRepository.findById(id);

    if (!submission || !submission.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }

    if (role === UserRole.STUDENT) {
      if (submission.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
    }

    if (role === UserRole.TEACHER) {
      const assignment = await assignmentRepository.findById(submission.assignmentId.toString());
      if (!assignment || !assignment.isActive) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
    }

    if (role === UserRole.PARENT) {
      const student = await userRepository.findByIdSafe(submission.studentId.toString());
      if (!student) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
      const parentIds = student.parentIds ?? [];
      const isParent = parentIds.some((pid) => pid.toString() === requestorId);
      if (!isParent) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
    }

    return toSubmissionResponse(submission);
  }

  async createSubmission(data: CreateSubmissionInput, currentUserId: string): Promise<SubmissionResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.STUDENT) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only students can create submissions"]);
    }

    const assignment = await this.verifyAssignment(data.assignmentId);

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new AppError(ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Assignment not found"]);
    }

    const studentId = requestorId;
    const student = await this.verifyStudent(studentId);

    if (!(await this.isStudentEnrolledInClass(studentId, assignment.classId.toString(), assignment.courseId.toString()))) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
    }

    const existing = await submissionRepository.findByAssignmentAndStudent(data.assignmentId, studentId);
    if (existing) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_EXISTS, STATUS_CODES.CONFLICT, ["A submission for this assignment already exists."]);
    }

    const submissionData = {
      assignmentId: data.assignmentId as unknown as ISubmission["assignmentId"],
      studentId: student._id as unknown as ISubmission["studentId"],
      classId: assignment.classId as unknown as ISubmission["classId"],
      content: data.content ?? null,
      attachments: data.attachments ?? [],
      submittedAt: null as Date | null,
      status: SubmissionStatus.DRAFT,
      isLate: false,
      gradedAt: null as Date | null,
      isActive: true,
    };

    try {
      const created = await submissionRepository.create(submissionData as Partial<ISubmission>);
      logger.info(`Submission created: assignment=${data.assignmentId}, student=${studentId} (by: ${currentUserId})`);
      return toSubmissionResponse(created);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_EXISTS, STATUS_CODES.CONFLICT, ["A submission for this assignment already exists."]);
      }
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateSubmission(id: string, data: UpdateSubmissionInput, currentUserId: string): Promise<SubmissionResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.STUDENT) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and students can update submissions"]);
    }

    const submission = await this.getSubmissionForUpdate(id);

    if (role === UserRole.STUDENT) {
      if (submission.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }

      if (submission.status !== SubmissionStatus.DRAFT) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Cannot update a submission that is not in DRAFT status"]);
      }
    }

    const assignment = await this.verifyAssignment(data.assignmentId);

    void assignment;

    const updateData: Partial<ISubmission> = {
      content: data.content ?? null,
      attachments: data.attachments,
    };

    try {
      const updated = await submissionRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found after update"]);
      }
      logger.info(`Submission updated: ${id} (by: ${currentUserId})`);
      return toSubmissionResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchSubmission(id: string, data: PatchSubmissionInput, currentUserId: string): Promise<SubmissionResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role === UserRole.PARENT) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Parents cannot patch submissions"]);
    }

    const submission = await this.getSubmissionForUpdate(id);
    const assignment = await this.verifyAssignment(submission.assignmentId.toString());

    if (role === UserRole.STUDENT) {
      if (submission.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
    }

    if (role === UserRole.TEACHER) {
      if (assignment.createdBy.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
    }

    const updates: Record<string, unknown> = {};

    if (data.content !== undefined) {
      updates.content = data.content ?? null;
    }

    if (data.attachments !== undefined) {
      updates.attachments = data.attachments;
    }

    if (data.status !== undefined) {
      if (role === UserRole.STUDENT) {
        if (data.status !== SubmissionStatus.SUBMITTED) {
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Students can only transition to SUBMITTED"]);
        }
        if (submission.status !== SubmissionStatus.DRAFT) {
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Cannot submit a submission that is not in DRAFT status"]);
        }
        updates.submittedAt = new Date();
        updates.status = SubmissionStatus.SUBMITTED;
        updates.isLate = new Date() > assignment.dueDate;
      } else if (role === UserRole.TEACHER || role === UserRole.ADMIN) {
        if (data.status === SubmissionStatus.MISSING) {
          updates.status = SubmissionStatus.MISSING;
        } else if (data.status === SubmissionStatus.SUBMITTED && submission.status === SubmissionStatus.DRAFT) {
          updates.submittedAt = submission.submittedAt ?? new Date();
          updates.status = SubmissionStatus.SUBMITTED;
          updates.isLate = (updates.submittedAt as Date) > assignment.dueDate;
        } else if (data.status === SubmissionStatus.LATE) {
          updates.status = SubmissionStatus.LATE;
        } else {
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Invalid status transition"]);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return toSubmissionResponse(submission);
    }

    try {
      const updated = await submissionRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found after patch"]);
      }
      logger.info(`Submission patched: ${id} (by: ${currentUserId})`);
      return toSubmissionResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteSubmission(id: string, currentUserId: string): Promise<SubmissionResponse> {
    const { role, id: requestorId } = await this.verifyAuthorized(currentUserId);

    if (role !== UserRole.ADMIN && role !== UserRole.STUDENT) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only admins and students can delete submissions"]);
    }

    const submission = await this.getSubmissionForDelete(id);

    if (role === UserRole.STUDENT) {
      if (submission.studentId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found"]);
      }
      if (submission.status !== SubmissionStatus.DRAFT) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Cannot delete a submission that is not in DRAFT status"]);
      }
    }

    if (!submission.isActive) {
      return toSubmissionResponse(submission);
    }

    const deactivated = await submissionRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Submission not found after deactivation"]);
    }

    logger.info(`Submission deactivated: ${id} (by: ${currentUserId})`);
    return toSubmissionResponse(deactivated);
  }
}

export const submissionService = new SubmissionService();
