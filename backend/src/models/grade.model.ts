import { Schema, model, models } from "mongoose";
import { IGrade } from "@/types/grade.types";

const gradeSchema = new Schema<IGrade>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
      index: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    points: {
      type: Number,
      required: true,
      min: 0,
    },

    maxPoints: {
      type: Number,
      required: true,
      min: 0,
    },

    percentage: {
      type: Number,
      required: true,
    },

    feedback: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    gradedAt: {
      type: Date,
      default: () => new Date(),
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

gradeSchema.index(
  { studentId: 1, assignmentId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
gradeSchema.index({ studentId: 1, isActive: 1 });
gradeSchema.index({ assignmentId: 1, isActive: 1 });
gradeSchema.index({ classId: 1, isActive: 1 });
gradeSchema.index({ submissionId: 1, isActive: 1 });
gradeSchema.index({ gradedBy: 1 });

const Grade = models.Grade || model<IGrade>("Grade", gradeSchema);

export default Grade;
