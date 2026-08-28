import Assignment from "@/models/assignment.model";
import { IAssignment } from "@/types/assignment.types";
import { UpdateQuery } from "mongoose";

export class AssignmentRepository {
  async create(data: Partial<IAssignment>): Promise<IAssignment> {
    return Assignment.create(data);
  }

  async findById(id: string): Promise<IAssignment | null> {
    return Assignment.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IAssignment>): Promise<IAssignment | null> {
    return Assignment.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IAssignment | null> {
    return Assignment.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Assignment.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Assignment.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IAssignment[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Assignment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findByClass(classId: string, isActive: boolean = true): Promise<IAssignment[]> {
    return Assignment.find({ classId, isActive }).sort({ dueDate: 1 }).lean();
  }

  async findByTeacher(teacherId: string, isActive: boolean = true): Promise<IAssignment[]> {
    return Assignment.find({ createdBy: teacherId, isActive }).sort({ createdAt: -1 }).lean();
  }
}

export const assignmentRepository = new AssignmentRepository();
