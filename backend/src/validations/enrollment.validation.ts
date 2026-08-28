import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";
import { EnrollmentStatus } from "@/types/enrollment.types";

export const enrollmentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const statusEnum = z.nativeEnum(EnrollmentStatus);

export const createEnrollmentSchema = z
  .object({
    studentId: objectIdSchema,
    classId: objectIdSchema,
    status: statusEnum.optional().default(EnrollmentStatus.ACTIVE),
  })
  .strict();

export const updateEnrollmentSchema = z
  .object({
    studentId: objectIdSchema,
    classId: objectIdSchema,
    status: statusEnum,
  })
  .strict();

export const patchEnrollmentSchema = z
  .object({
    status: statusEnum.optional(),
  })
  .strict();

export const enrollmentListSchema = paginationSchema.extend({
  studentId: objectIdSchema.optional(),
  classId: objectIdSchema.optional(),
  courseId: objectIdSchema.optional(),
  status: statusEnum.optional(),
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
  search: searchSchema,
});

export type EnrollmentIdParam = z.infer<typeof enrollmentIdParamSchema>;
export type CreateEnrollmentInput = Omit<z.infer<typeof createEnrollmentSchema>, "status"> & { status?: EnrollmentStatus };
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type PatchEnrollmentInput = z.infer<typeof patchEnrollmentSchema>;
export type EnrollmentListQuery = z.infer<typeof enrollmentListSchema>;
