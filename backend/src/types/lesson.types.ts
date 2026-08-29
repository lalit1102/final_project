import { Document, Types } from "mongoose";

export enum LessonContentType {
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  PDF = "PDF",
  LINK = "LINK",
}

export interface ILesson extends Document {
  title: string;
  description?: string | null;
  moduleId: Types.ObjectId;
  contentType: LessonContentType;
  content: string;
  durationMinutes: number;
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
