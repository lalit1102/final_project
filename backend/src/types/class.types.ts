import { Document, Types } from "mongoose";

export interface IClass extends Document {
  name: string;
  code: string;
  description?: string | null;
  courseId: Types.ObjectId;
  teacherId: Types.ObjectId;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
