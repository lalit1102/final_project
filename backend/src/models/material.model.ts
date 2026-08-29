import { Schema, model, models } from "mongoose";
import { IMaterial, MaterialType } from "@/types/material.types";

const materialSchema = new Schema<IMaterial>(
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
      maxlength: [2000, "Description must be 2000 characters or less"],
      default: null,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Lesson ID is required"],
      index: true,
    },
    materialType: {
      type: String,
      enum: Object.values(MaterialType),
      required: [true, "Material type is required"],
    },
    fileUrl: {
      type: String,
      trim: true,
      default: null,
    },
    fileSize: {
      type: Number,
      min: [0, "File size must be at least 0"],
      default: null,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
    },
    externalUrl: {
      type: String,
      trim: true,
      default: null,
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

materialSchema.index({ lessonId: 1, order: 1 }, { unique: true });

const Material = models.Material || model<IMaterial>("Material", materialSchema);

export default Material;
