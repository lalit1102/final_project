import Submission from "@/models/submission.model";
import { ISubmission } from "@/types/submission.types";
import { UpdateQuery } from "mongoose";

export class SubmissionRepository {
  async create(data: Partial<ISubmission>): Promise<ISubmission> {
    return Submission.create(data);
  }

  async findById(id: string): Promise<ISubmission | null> {
    return Submission.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<ISubmission>): Promise<ISubmission | null> {
    return Submission.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<ISubmission | null> {
    return Submission.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Submission.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Submission.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<ISubmission[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Submission.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findByAssignment(assignmentId: string): Promise<ISubmission[]> {
    return Submission.find({ assignmentId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findByStudent(studentId: string): Promise<ISubmission[]> {
    return Submission.find({ studentId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<ISubmission | null> {
    return Submission.findOne({ assignmentId, studentId, isActive: true }).lean();
  }
}

export const submissionRepository = new SubmissionRepository();
