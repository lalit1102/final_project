import { Schema, model, models } from "mongoose";
import { ILesson, LessonContentType } from "@/types/lesson.types";

const lessonSchema = new Schema<ILesson>(
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
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: [true, "Module ID is required"],
      index: true,
    },
    contentType: {
      type: String,
      enum: Object.values(LessonContentType),
      required: [true, "Content type is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [50000, "Content must be 50000 characters or less"],
    },
    durationMinutes: {
      type: Number,
      min: [0, "Duration must be at least 0"],
      default: 0,
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

lessonSchema.index({ moduleId: 1, order: 1 }, { unique: true });

const Lesson = models.Lesson || model<ILesson>("Lesson", lessonSchema);

export default Lesson;
