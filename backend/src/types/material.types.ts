import { Document, Types } from "mongoose";

export enum MaterialType {
  FILE = "FILE",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  LINK = "LINK",
  DOCUMENT = "DOCUMENT",
}

export interface IMaterial extends Document {
  title: string;
  description?: string | null;
  lessonId: Types.ObjectId;
  materialType: MaterialType;
  fileUrl?: string | null;
  fileSize?: number | null;
  thumbnailUrl?: string | null;
  externalUrl?: string | null;
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
