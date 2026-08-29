import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";
import { LessonContentType } from "@/types/lesson.types";

export const lessonIdParamSchema = z.object({
  id: objectIdSchema,
});

export const lessonModuleIdParamSchema = z.object({
  moduleId: objectIdSchema,
});

export const createLessonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    contentType: z.nativeEnum(LessonContentType),
    content: z.string().min(1, "Content is required").max(50000),
    durationMinutes: z.number().min(0, "Duration must be at least 0").optional(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict();

export const updateLessonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    contentType: z.nativeEnum(LessonContentType),
    content: z.string().min(1, "Content is required").max(50000),
    durationMinutes: z.number().min(0, "Duration must be at least 0"),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict();

export const patchLessonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    content: z.string().min(1, "Content is required").max(50000).optional(),
    durationMinutes: z.number().min(0, "Duration must be at least 0").optional(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0").optional(),
  })
  .strict();

export const lessonListSchema = paginationSchema.extend({
  search: searchSchema,
  contentType: z.nativeEnum(LessonContentType).optional(),
  isActive: z
    .preprocess(
      (val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        if (val === undefined || val === null) return undefined;
        return val;
      },
      z.boolean().optional(),
    )
    .optional(),
});

export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;
export type LessonModuleIdParam = z.infer<typeof lessonModuleIdParamSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type PatchLessonInput = z.infer<typeof patchLessonSchema>;
export type LessonListQuery = z.infer<typeof lessonListSchema>;
