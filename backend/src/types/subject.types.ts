import { Document, Types } from "mongoose";

export interface ISubject extends Document {
  name: string;
  code: string;
  description?: string | null;
  teacherId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
