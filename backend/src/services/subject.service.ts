import { subjectRepository } from "@/repositories/subject.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { ISubject } from "@/types/subject.types";
import {
  CreateSubjectInput,
  UpdateSubjectInput,
  PatchSubjectInput,
  SubjectListQuery,
} from "@/validations/subject.validation";

export interface SubjectResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  teacherId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSubjectResponse(subject: ISubject): SubjectResponse {
  return {
    id: subject._id.toString(),
    name: subject.name,
    code: subject.code,
    description: subject.description ?? null,
    teacherId: subject.teacherId.toString(),
    isActive: subject.isActive,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER = -1;

export class SubjectService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage subjects"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  async listSubjects(query: SubjectListQuery, currentUserId: string): Promise<{ subjects: SubjectResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const { page, limit, search, isActive } = query;

    const filter: Record<string, unknown> = { isActive: true };

    if (role === UserRole.TEACHER) {
      filter.teacherId = requestorId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const [subjects, total] = await Promise.all([
      subjectRepository.findAllPaginated(filter, page, limit, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER as 1 | -1),
      subjectRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      subjects: subjects.map(toSubjectResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getSubjectById(id: string, currentUserId: string): Promise<SubjectResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const subject = await subjectRepository.findById(id);

    if (!subject || !subject.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }

    if (role === UserRole.TEACHER && subject.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }

    return toSubjectResponse(subject);
  }

  async createSubject(data: CreateSubjectInput, currentUserId: string): Promise<SubjectResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    let teacherId: string;

    if (role === UserRole.ADMIN) {
      if (data.teacherId) {
        const targetTeacher = await userRepository.findByIdSafe(data.teacherId);
        if (!targetTeacher) {
          throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Teacher not found"]);
        }
        if (targetTeacher.role !== UserRole.TEACHER) {
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Can only assign subjects to teachers"]);
        }
        teacherId = data.teacherId;
      } else {
        teacherId = requestorId;
      }
    } else {
      teacherId = requestorId;
    }

    const subjectData: Partial<ISubject> = {
      name: data.name,
      code: data.code,
      teacherId: teacherId as unknown as ISubject["teacherId"],
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await subjectRepository.create(subjectData);
      logger.info(`Subject created: ${data.name} (by: ${currentUserId})`);
      return toSubjectResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateSubject(id: string, data: UpdateSubjectInput, currentUserId: string): Promise<SubjectResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.getSubjectByIdForUpdate(id, requestorId, role);

    const updateData: Partial<ISubject> = {
      name: data.name,
      code: data.code,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await subjectRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
      }
      logger.info(`Subject updated: ${updated.name} (by: ${currentUserId})`);
      return toSubjectResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchSubject(id: string, data: PatchSubjectInput, currentUserId: string): Promise<SubjectResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const subject = await this.getSubjectByIdForUpdate(id, requestorId, role);

    const updates: Partial<ISubject> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.code !== undefined) {
      updates.code = data.code;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return toSubjectResponse(subject);
    }

    try {
      const updated = await subjectRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
      }
      logger.info(`Subject patched: ${updated.name} (by: ${currentUserId})`);
      return toSubjectResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteSubject(id: string, currentUserId: string): Promise<SubjectResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const subject = await this.getSubjectByIdForUpdate(id, requestorId, role);

    if (!subject.isActive) {
      return toSubjectResponse(subject);
    }

    const deactivated = await subjectRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found after deactivation"]);
    }

    logger.info(`Subject deactivated: ${subject.name} (by: ${currentUserId})`);
    return toSubjectResponse(deactivated);
  }

  private async getSubjectByIdForUpdate(
    id: string,
    requestorId: string,
    role: string,
  ): Promise<ISubject> {
    const subject = await subjectRepository.findById(id);

    if (!subject || !subject.isActive) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }

    if (role === UserRole.TEACHER && subject.teacherId.toString() !== requestorId) {
      throw new AppError(ERROR_MESSAGES.SUBJECT_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Subject not found"]);
    }

    return subject;
  }
}

export const subjectService = new SubjectService();
