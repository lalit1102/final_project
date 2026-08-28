import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const classIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(30).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  courseId: objectIdSchema,
  teacherId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).strict();

export const updateClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(30).toUpperCase(),
  description: z.string().trim().max(1000).nullable().optional(),
  courseId: objectIdSchema,
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
}).strict();

export const patchClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  code: z.string().trim().min(1, "Code is required").max(30).toUpperCase().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  courseId: objectIdSchema.optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
}).strict();

export const classListSchema = paginationSchema.extend({
  search: searchSchema,
  courseId: objectIdSchema.optional(),
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

export type ClassIdParam = z.infer<typeof classIdParamSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type PatchClassInput = z.infer<typeof patchClassSchema>;
export type ClassListQuery = z.infer<typeof classListSchema>;
