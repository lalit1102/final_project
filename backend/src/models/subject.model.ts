import { Schema, model, models } from "mongoose";
import { ISubject } from "@/types/subject.types";

const subjectSchema = new Schema<ISubject>(
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

subjectSchema.index({ name: 1, teacherId: 1 }, { unique: true });

const Subject = models.Subject || model<ISubject>("Subject", subjectSchema);

export default Subject;
