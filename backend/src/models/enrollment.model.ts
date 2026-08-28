import { Schema, model, models } from "mongoose";
import { IEnrollment, EnrollmentStatus } from "@/types/enrollment.types";

const enrollmentSchema = new Schema<IEnrollment>(
  {
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

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(EnrollmentStatus),
      default: EnrollmentStatus.ACTIVE,
    },

    enrolledAt: {
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
  },
);

enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1, isActive: 1 });
enrollmentSchema.index({ classId: 1, isActive: 1 });
enrollmentSchema.index({ courseId: 1, isActive: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ studentId: 1, classId: 1, isActive: 1 });

const Enrollment = models.Enrollment || model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
