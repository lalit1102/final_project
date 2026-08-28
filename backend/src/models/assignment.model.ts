import { Schema, model, models } from "mongoose";
import { IAssignment, AssignmentStatus, SubmissionType } from "@/types/assignment.types";

const assignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: null,
      maxlength: 5000,
      trim: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    maxPoints: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(AssignmentStatus),
      default: AssignmentStatus.DRAFT,
      index: true,
    },

    allowLateSubmissions: {
      type: Boolean,
      default: false,
    },

    latePenaltyPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    submissionType: {
      type: String,
      enum: Object.values(SubmissionType),
      default: SubmissionType.TEXT,
    },

    attachments: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

assignmentSchema.index({ classId: 1, courseId: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ classId: 1, dueDate: -1 });
assignmentSchema.index({ status: 1 });

const Assignment = models.Assignment || model<IAssignment>("Assignment", assignmentSchema);

export default Assignment;
