import Subject from "@/models/subject.model";
import { ISubject } from "@/types/subject.types";
import { UpdateQuery } from "mongoose";

export class SubjectRepository {
  async create(data: Partial<ISubject>): Promise<ISubject> {
    return Subject.create(data);
  }

  async findById(id: string): Promise<ISubject | null> {
    return Subject.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<ISubject>): Promise<ISubject | null> {
    return Subject.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<ISubject | null> {
    return Subject.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Subject.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Subject.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<ISubject[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Subject.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const subjectRepository = new SubjectRepository();
