import Enrollment from "@/models/enrollment.model";
import { IEnrollment } from "@/types/enrollment.types";
import { UpdateQuery } from "mongoose";

export class EnrollmentRepository {
  async create(data: Partial<IEnrollment>): Promise<IEnrollment> {
    return Enrollment.create(data);
  }

  async findById(id: string): Promise<IEnrollment | null> {
    return Enrollment.findById(id);
  }

  async update(id: string, updateData: UpdateQuery<IEnrollment>): Promise<IEnrollment | null> {
    return Enrollment.findByIdAndUpdate(id, updateData, { new: true });
  }

  async softDelete(id: string): Promise<IEnrollment | null> {
    return Enrollment.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    const result = await Enrollment.exists(filter);
    return !!result;
  }

  async totalCount(filter: Record<string, unknown>): Promise<number> {
    return Enrollment.countDocuments(filter);
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<IEnrollment[]> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return Enrollment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findByStudentAndClass(studentId: string, classId: string): Promise<IEnrollment | null> {
    return Enrollment.findOne({ studentId, classId, isActive: true }).lean();
  }

  async findByStudent(studentId: string): Promise<IEnrollment[]> {
    return Enrollment.find({ studentId, isActive: true }).sort({ createdAt: -1 }).lean();
  }

  async findClassIdsByTeacher(teacherId: string): Promise<string[]> {
    const { classRepository } = await import("@/repositories/class.repository");
    return classRepository.findActiveClassIdsByTeacher(teacherId);
  }
}

export const enrollmentRepository = new EnrollmentRepository();
