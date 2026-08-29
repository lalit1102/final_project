import { Schema, model, models } from "mongoose";
import { ISubmission, SubmissionStatus } from "@/types/submission.types";

const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    content: {
      type: String,
      default: null,
      maxlength: 50000,
    },

    attachments: {
      type: [String],
      default: [],
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.DRAFT,
      index: true,
    },

    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },

    gradedAt: {
      type: Date,
      default: null,
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

submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
submissionSchema.index({ studentId: 1, isActive: 1 });
submissionSchema.index({ assignmentId: 1, isActive: 1 });
submissionSchema.index({ classId: 1, isActive: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ assignmentId: 1, studentId: 1, isActive: 1 });

const Submission = models.Submission || model<ISubmission>("Submission", submissionSchema);

export default Submission;
