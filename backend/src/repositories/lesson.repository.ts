import Lesson from "@/models/lesson.model";
import { ILesson } from "@/types/lesson.types";
import { UpdateQuery } from "mongoose";

export class LessonRepository {
  async create(data: Partial<ILesson>): Promise<ILesson> {
    return Lesson.create(data);
  }

  async findById(id: string): Promise<ILesson | null> {
    return Lesson.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<ILesson>): Promise<ILesson | null> {
    return Lesson.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<ILesson | null> {
    return Lesson.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Lesson.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Lesson.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<ILesson[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Lesson.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const lessonRepository = new LessonRepository();
