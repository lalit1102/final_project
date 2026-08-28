import { Schema, model, models } from "mongoose";
import { IClass } from "@/types/class.types";

const classSchema = new Schema<IClass>(
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
      maxlength: 30,
      index: true,
    },

    description: {
      type: String,
      default: null,
      maxlength: 1000,
      trim: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
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

classSchema.index({ code: 1 }, { unique: true });
classSchema.index({ courseId: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ name: 1, teacherId: 1 }, { unique: true });

const Class = models.Class || model<IClass>("Class", classSchema);

export default Class;
