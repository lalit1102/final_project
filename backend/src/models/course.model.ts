import { Schema, model, models } from "mongoose";
import { ICourse } from "@/types/course.types";

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      index: true,
    },

    description: {
      type: String,
      default: null,
      maxlength: 1000,
      trim: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ subjectId: 1 });

const Course = models.Course || model<ICourse>("Course", courseSchema);

export default Course;
