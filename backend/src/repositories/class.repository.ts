import Class from "@/models/class.model";
import { IClass } from "@/types/class.types";
import { UpdateQuery } from "mongoose";

export class ClassRepository {
  async create(data: Partial<IClass>): Promise<IClass> {
    return Class.create(data);
  }

  async findById(id: string): Promise<IClass | null> {
    return Class.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IClass>): Promise<IClass | null> {
    return Class.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IClass | null> {
    return Class.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Class.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Class.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IClass[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Class.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findActiveClassIdsByTeacher(teacherId: string): Promise<string[]> {
    const classes = await Class.find({ teacherId, isActive: true }).select("_id").lean();
    return classes.map((c) => c._id.toString());
  }
}

export const classRepository = new ClassRepository();
