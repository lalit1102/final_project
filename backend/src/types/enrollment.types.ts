import { Document, Types } from "mongoose";

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  DROPPED = "DROPPED",
  COMPLETED = "COMPLETED",
}

export interface IEnrollment extends Document {
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
