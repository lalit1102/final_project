import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const subjectIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  teacherId: objectIdSchema.optional(),
}).strict();

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const patchSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const subjectListSchema = paginationSchema.extend({
  search: searchSchema,
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

export type SubjectIdParam = z.infer<typeof subjectIdParamSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type PatchSubjectInput = z.infer<typeof patchSubjectSchema>;
export type SubjectListQuery = z.infer<typeof subjectListSchema>;
