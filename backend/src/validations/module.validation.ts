import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const moduleIdParamSchema = z.object({
  id: objectIdSchema,
});

export const moduleCourseIdParamSchema = z.object({
  courseId: objectIdSchema,
});

export const createModuleSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(1000).nullable().optional(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict();

export const updateModuleSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(1000).nullable().optional(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict();

export const patchModuleSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    order: z
      .number()
      .int("Order must be an integer")
      .min(0, "Order must be at least 0")
      .optional(),
  })
  .strict();

export const moduleListSchema = paginationSchema.extend({
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

export type ModuleIdParam = z.infer<typeof moduleIdParamSchema>;
export type ModuleCourseIdParam = z.infer<typeof moduleCourseIdParamSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type PatchModuleInput = z.infer<typeof patchModuleSchema>;
export type ModuleListQuery = z.infer<typeof moduleListSchema>;
