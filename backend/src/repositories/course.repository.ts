import Course from "@/models/course.model";
import { ICourse } from "@/types/course.types";
import { UpdateQuery } from "mongoose";

export class CourseRepository {
  async create(data: Partial<ICourse>): Promise<ICourse> {
    return Course.create(data);
  }

  async findById(id: string): Promise<ICourse | null> {
    return Course.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<ICourse>): Promise<ICourse | null> {
    return Course.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<ICourse | null> {
    return Course.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Course.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Course.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<ICourse[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Course.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const courseRepository = new CourseRepository();
