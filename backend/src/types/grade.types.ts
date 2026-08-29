import { Document, Types } from "mongoose";

export interface IGrade extends Document {
  studentId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  submissionId: Types.ObjectId | null;
  classId: Types.ObjectId;
  points: number;
  maxPoints: number;
  percentage: number;
  feedback: string | null;
  gradedBy: Types.ObjectId;
  gradedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
