import { Document, Types } from "mongoose";

export enum AssignmentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum SubmissionType {
  FILE = "FILE",
  TEXT = "TEXT",
  LINK = "LINK",
  NONE = "NONE",
}

export interface IAssignment extends Document {
  title: string;
  description?: string | null;
  classId: Types.ObjectId;
  courseId: Types.ObjectId;
  dueDate: Date;
  maxPoints: number;
  status: AssignmentStatus;
  allowLateSubmissions: boolean;
  latePenaltyPercent: number;
  submissionType: SubmissionType;
  attachments: string[];
  createdBy: Types.ObjectId;
  publishedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
