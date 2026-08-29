import { Schema, model, models } from "mongoose";
import { IModule } from "@/types/module.types";

const moduleSchema = new Schema<IModule>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must be 200 characters or less"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must be 1000 characters or less"],
      default: null,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      index: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      min: [0, "Order must be at least 0"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

moduleSchema.index({ courseId: 1, order: 1 }, { unique: true });

const Module = models.Module || model<IModule>("Module", moduleSchema);

export default Module;
