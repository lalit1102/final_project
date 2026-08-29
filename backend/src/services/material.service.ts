import { materialRepository } from "@/repositories/material.repository";
import { lessonRepository } from "@/repositories/lesson.repository";
import { moduleRepository } from "@/repositories/module.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { UserRole } from "@/types/user.types";
import { IMaterial, MaterialType } from "@/types/material.types";
import { ILesson } from "@/types/lesson.types";
import {
  CreateMaterialInput,
  UpdateMaterialInput,
  PatchMaterialInput,
  MaterialListQuery,
} from "@/validations/material.validation";

export interface MaterialResponse {
  id: string;
  title: string;
  description: string | null;
  lessonId: string;
  materialType: MaterialType;
  fileUrl: string | null;
  fileSize: number | null;
  thumbnailUrl: string | null;
  externalUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toMaterialResponse(material: IMaterial): MaterialResponse {
  return {
    id: material._id.toString(),
    title: material.title,
    description: material.description ?? null,
    lessonId: material.lessonId.toString(),
    materialType: material.materialType,
    fileUrl: material.fileUrl ?? null,
    fileSize: material.fileSize ?? null,
    thumbnailUrl: material.thumbnailUrl ?? null,
    externalUrl: material.externalUrl ?? null,
    order: material.order,
    isActive: material.isActive,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

const DEFAULT_SORT_FIELD = "order";
const DEFAULT_SORT_ORDER = 1;

export class MaterialService {
  private async verifyTeacher(currentUserId: string): Promise<{ id: string; role: string }> {
    const user = await userRepository.findByIdSafe(currentUserId);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED, ["Requesting user not found"]);
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN, ["Only teachers and admins can manage materials"]);
    }

    return { id: user._id.toString(), role: user.role };
  }

  private async verifyLesson(lessonId: string): Promise<ILesson> {
    const lesson = await lessonRepository.findById(lessonId);

    if (!lesson || !lesson.isActive) {
      throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
    }

    return lesson;
  }

  private async verifyTeacherOwnsLesson(lessonId: string, requestorId: string, role: string): Promise<ILesson> {
    const lesson = await this.verifyLesson(lessonId);

    if (role === UserRole.TEACHER) {
      const moduleDoc = await moduleRepository.findById(lesson.moduleId.toString());
      if (!moduleDoc || !moduleDoc.isActive) {
        throw new AppError(ERROR_MESSAGES.MODULE_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Module not found"]);
      }
      const course = await courseRepository.findById(moduleDoc.courseId.toString());
      if (!course || !course.isActive || course.teacherId.toString() !== requestorId) {
        throw new AppError(ERROR_MESSAGES.LESSON_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Lesson not found"]);
      }
    }

    return lesson;
  }

  async listMaterials(
    query: MaterialListQuery,
    lessonId: string,
    currentUserId: string,
  ): Promise<{ materials: MaterialResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsLesson(lessonId, requestorId, role);

    const { page, limit, search, materialType, isActive } = query;

    const filter: Record<string, unknown> = { lessonId, isActive: true };

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (materialType) {
      filter.materialType = materialType;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [materials, total] = await Promise.all([
      materialRepository.findAllPaginated(
        filter,
        page,
        limit,
        DEFAULT_SORT_FIELD,
        DEFAULT_SORT_ORDER as 1 | -1,
      ),
      materialRepository.totalCount(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      materials: materials.map(toMaterialResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getMaterialById(id: string, lessonId: string, currentUserId: string): Promise<MaterialResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const material = await materialRepository.findById(id);

    if (!material || !material.isActive || material.lessonId.toString() !== lessonId) {
      throw new AppError(ERROR_MESSAGES.MATERIAL_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Material not found"]);
    }

    await this.verifyTeacherOwnsLesson(lessonId, requestorId, role);

    return toMaterialResponse(material);
  }

  async createMaterial(
    lessonId: string,
    data: CreateMaterialInput,
    currentUserId: string,
  ): Promise<MaterialResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsLesson(lessonId, requestorId, role);

    const materialData: Partial<IMaterial> = {
      title: data.title,
      lessonId: lessonId as unknown as IMaterial["lessonId"],
      materialType: data.materialType,
      order: data.order,
      createdBy: requestorId as unknown as IMaterial["createdBy"],
      fileUrl: data.fileUrl ?? null,
      fileSize: data.fileSize ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      externalUrl: data.externalUrl ?? null,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const created = await materialRepository.create(materialData);
      logger.info(`Material created: ${data.title} (by: ${currentUserId})`);
      return toMaterialResponse(created);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async updateMaterial(
    id: string,
    lessonId: string,
    data: UpdateMaterialInput,
    currentUserId: string,
  ): Promise<MaterialResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    await this.verifyTeacherOwnsLesson(lessonId, requestorId, role);

    await this.getMaterialForUpdate(id, lessonId, requestorId, role);

    const updateData: Partial<IMaterial> = {
      title: data.title,
      materialType: data.materialType,
      order: data.order,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      thumbnailUrl: data.thumbnailUrl,
      externalUrl: data.externalUrl,
      ...(data.description !== undefined ? { description: data.description ?? null } : {}),
    };

    try {
      const updated = await materialRepository.update(id, { $set: updateData });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.MATERIAL_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Material not found"]);
      }
      logger.info(`Material updated: ${updated.title} (by: ${currentUserId})`);
      return toMaterialResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async patchMaterial(
    id: string,
    lessonId: string,
    data: PatchMaterialInput,
    currentUserId: string,
  ): Promise<MaterialResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const material = await this.getMaterialForUpdate(id, lessonId, requestorId, role);

    const updates: Partial<IMaterial> = {};

    if (data.title !== undefined) {
      updates.title = data.title;
    }

    if (data.materialType !== undefined) {
      updates.materialType = data.materialType;
    }

    if (data.order !== undefined) {
      updates.order = data.order;
    }

    if (data.fileUrl !== undefined) {
      updates.fileUrl = data.fileUrl ?? null;
    }

    if (data.fileSize !== undefined) {
      updates.fileSize = data.fileSize ?? null;
    }

    if (data.thumbnailUrl !== undefined) {
      updates.thumbnailUrl = data.thumbnailUrl ?? null;
    }

    if (data.externalUrl !== undefined) {
      updates.externalUrl = data.externalUrl ?? null;
    }

    if (data.description !== undefined) {
      updates.description = data.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return toMaterialResponse(material);
    }

    try {
      const updated = await materialRepository.update(id, { $set: updates });
      if (!updated) {
        throw new AppError(ERROR_MESSAGES.MATERIAL_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Material not found"]);
      }
      logger.info(`Material patched: ${updated.title} (by: ${currentUserId})`);
      return toMaterialResponse(updated);
    } catch (error) {
      const mongoError = handleMongoError(error);
      if (mongoError) {
        throw mongoError;
      }
      throw error;
    }
  }

  async deleteMaterial(id: string, lessonId: string, currentUserId: string): Promise<MaterialResponse> {
    const { role, id: requestorId } = await this.verifyTeacher(currentUserId);

    const material = await this.getMaterialForUpdate(id, lessonId, requestorId, role);

    if (!material.isActive) {
      return toMaterialResponse(material);
    }

    const deactivated = await materialRepository.softDelete(id);
    if (!deactivated) {
      throw new AppError(ERROR_MESSAGES.MATERIAL_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Material not found after deactivation"]);
    }

    logger.info(`Material deactivated: ${material.title} (by: ${currentUserId})`);
    return toMaterialResponse(deactivated);
  }

  private async getMaterialForUpdate(
    id: string,
    lessonId: string,
    requestorId: string,
    role: string,
  ): Promise<IMaterial> {
    const material = await materialRepository.findById(id);

    if (!material || !material.isActive || material.lessonId.toString() !== lessonId) {
      throw new AppError(ERROR_MESSAGES.MATERIAL_NOT_FOUND, STATUS_CODES.NOT_FOUND, ["Material not found"]);
    }

    await this.verifyTeacherOwnsLesson(lessonId, requestorId, role);

    return material;
  }
}

export const materialService = new MaterialService();
