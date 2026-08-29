import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";
import { SubmissionStatus } from "@/types/submission.types";

export const submissionIdParamSchema = z.object({
  id: objectIdSchema,
});

export const statusEnum = z.nativeEnum(SubmissionStatus);

export const createSubmissionSchema = z
  .object({
    assignmentId: objectIdSchema,
    content: z.string().trim().max(50000).nullable().optional(),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed").optional(),
  })
  .strict();

export const updateSubmissionSchema = z
  .object({
    assignmentId: objectIdSchema,
    content: z.string().trim().max(50000).nullable().optional(),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed"),
  })
  .strict();

export const patchSubmissionSchema = z
  .object({
    content: z.string().trim().max(50000).nullable().optional(),
    attachments: z.array(z.string()).max(20, "Maximum 20 attachments allowed").optional(),
    status: statusEnum.optional(),
  })
  .strict();

export const submissionListSchema = paginationSchema.extend({
  search: searchSchema,
  assignmentId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  classId: objectIdSchema.optional(),
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
});

export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type PatchSubmissionInput = z.infer<typeof patchSubmissionSchema>;
export type SubmissionListQuery = z.infer<typeof submissionListSchema>;
