import Grade from "@/models/grade.model";
import { IGrade } from "@/types/grade.types";
import { UpdateQuery } from "mongoose";

export class GradeRepository {
  async create(data: Partial<IGrade>): Promise<IGrade> {
    return Grade.create(data);
  }

  async findById(id: string): Promise<IGrade | null> {
    return Grade.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IGrade>): Promise<IGrade | null> {
    return Grade.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IGrade | null> {
    return Grade.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Grade.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Grade.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IGrade[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Grade.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findByStudent(studentId: string): Promise<IGrade[]> {
    return Grade.find({ studentId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findByAssignment(assignmentId: string): Promise<IGrade[]> {
    return Grade.find({ assignmentId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findBySubmission(submissionId: string): Promise<IGrade | null> {
    return Grade.findOne({ submissionId, isActive: true }).lean();
  }

  async findByStudentAndAssignment(studentId: string, assignmentId: string): Promise<IGrade | null> {
    return Grade.findOne({ studentId, assignmentId, isActive: true }).lean();
  }

  async findByClass(classId: string): Promise<IGrade[]> {
    return Grade.find({ classId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findByGradedBy(gradedById: string): Promise<IGrade[]> {
    return Grade.find({ gradedBy: gradedById, isActive: true }).sort({ createdAt: -1 }).lean();
  }
}

export const gradeRepository = new GradeRepository();
