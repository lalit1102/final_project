import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const gradeIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createGradeSchema = z
  .object({
    studentId: objectIdSchema,
    assignmentId: objectIdSchema,
    submissionId: objectIdSchema.optional().nullable(),
    points: z.number().min(0, "Points must be at least 0"),
    feedback: z.string().max(2000, "Feedback must not exceed 2000 characters").nullable().optional(),
  })
  .strict();

export const updateGradeSchema = z
  .object({
    studentId: objectIdSchema,
    assignmentId: objectIdSchema,
    submissionId: objectIdSchema.optional().nullable(),
    points: z.number().min(0, "Points must be at least 0"),
    feedback: z.string().max(2000, "Feedback must not exceed 2000 characters").nullable().optional(),
  })
  .strict();

export const patchGradeSchema = z
  .object({
    points: z.number().min(0, "Points must be at least 0").optional(),
    feedback: z.string().max(2000, "Feedback must not exceed 2000 characters").nullable().optional(),
  })
  .strict();

export const gradeListSchema = paginationSchema
  .extend({
    search: searchSchema,
    studentId: objectIdSchema.optional(),
    assignmentId: objectIdSchema.optional(),
    classId: objectIdSchema.optional(),
    submissionId: objectIdSchema.optional(),
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
  })
  .strict();

export type GradeIdParam = z.infer<typeof gradeIdParamSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type PatchGradeInput = z.infer<typeof patchGradeSchema>;
export type GradeListQuery = z.infer<typeof gradeListSchema>;
