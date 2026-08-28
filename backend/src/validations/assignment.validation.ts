import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";
import { AssignmentStatus, SubmissionType } from "@/types/assignment.types";

export const assignmentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createAssignmentSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(5000).nullable().optional(),
    classId: objectIdSchema,
    dueDate: z.string().datetime(),
    maxPoints: z.number().min(0, "Max points must be at least 0"),
    status: z.nativeEnum(AssignmentStatus).optional().default(AssignmentStatus.DRAFT),
    allowLateSubmissions: z.boolean().optional().default(false),
    latePenaltyPercent: z.number().min(0).max(100).optional().default(0),
    submissionType: z.nativeEnum(SubmissionType).optional().default(SubmissionType.TEXT),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed").optional().default([]),
  })
  .strict();

export const updateAssignmentSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(5000).nullable().optional(),
    classId: objectIdSchema,
    courseId: objectIdSchema,
    dueDate: z.string().datetime(),
    maxPoints: z.number().min(0, "Max points must be at least 0"),
    status: z.nativeEnum(AssignmentStatus),
    allowLateSubmissions: z.boolean(),
    latePenaltyPercent: z.number().min(0).max(100),
    submissionType: z.nativeEnum(SubmissionType),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed"),
  })
  .strict();

export const patchAssignmentSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    classId: objectIdSchema.optional(),
    dueDate: z.string().datetime().optional(),
    maxPoints: z.number().min(0, "Max points must be at least 0").optional(),
    status: z.nativeEnum(AssignmentStatus).optional(),
    allowLateSubmissions: z.boolean().optional(),
    latePenaltyPercent: z.number().min(0).max(100).optional(),
    submissionType: z.nativeEnum(SubmissionType).optional(),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed").optional(),
  })
  .strict();

export const assignmentListSchema = paginationSchema.extend({
  search: searchSchema,
  classId: objectIdSchema.optional(),
  courseId: objectIdSchema.optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  submissionType: z.nativeEnum(SubmissionType).optional(),
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

export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type CreateAssignmentInput = Omit<z.infer<typeof createAssignmentSchema>, "status" | "allowLateSubmissions" | "latePenaltyPercent" | "submissionType" | "attachments"> & { status?: AssignmentStatus; allowLateSubmissions?: boolean; latePenaltyPercent?: number; submissionType?: SubmissionType; attachments?: string[] };
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type PatchAssignmentInput = z.infer<typeof patchAssignmentSchema>;
export type AssignmentListQuery = z.infer<typeof assignmentListSchema>;
