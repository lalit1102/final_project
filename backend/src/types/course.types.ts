import { Document, Types } from "mongoose";

export interface ICourse extends Document {
  name: string;
  code: string;
  description?: string | null;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
