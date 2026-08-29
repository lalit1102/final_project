import { Document, Types } from "mongoose";

export interface IModule extends Document {
  title: string;
  description?: string | null;
  courseId: Types.ObjectId;
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
