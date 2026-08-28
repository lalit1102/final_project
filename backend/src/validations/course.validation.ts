import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const courseIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  subjectId: objectIdSchema,
  teacherId: objectIdSchema.optional(),
}).strict();

export const updateCourseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().trim().max(1000).nullable().optional(),
  subjectId: objectIdSchema,
}).strict();

export const patchCourseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  subjectId: objectIdSchema.optional(),
}).strict();

export const courseListSchema = paginationSchema.extend({
  search: searchSchema,
  subjectId: objectIdSchema.optional(),
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

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type PatchCourseInput = z.infer<typeof patchCourseSchema>;
export type CourseListQuery = z.infer<typeof courseListSchema>;
