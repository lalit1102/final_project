import { Document, Types } from "mongoose";

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  LATE = "LATE",
  MISSING = "MISSING",
}

export interface ISubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  content: string | null;
  attachments: string[];
  submittedAt: Date | null;
  status: SubmissionStatus;
  isLate: boolean;
  gradedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
