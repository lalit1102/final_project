import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";
import { MaterialType } from "@/types/material.types";

export const materialIdParamSchema = z.object({
  id: objectIdSchema,
});

export const lessonMaterialUrlRegex = /^https?:\/\/[^\s]+$/;

export const createMaterialSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    materialType: z.nativeEnum(MaterialType),
    fileUrl: z.string().trim().url("Invalid file URL").optional().nullable(),
    fileSize: z
      .number()
      .int("File size must be an integer")
      .min(0, "File size must be at least 0")
      .optional()
      .nullable(),
    thumbnailUrl: z.string().trim().url("Invalid thumbnail URL").optional().nullable(),
    externalUrl: z
      .string()
      .trim()
      .url("Invalid external URL")
      .refine((val) => lessonMaterialUrlRegex.test(val), {
        message: "External URL must be a valid http(s) URL",
      })
      .optional()
      .nullable(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fileMaterialTypes = [
      MaterialType.FILE,
      MaterialType.IMAGE,
      MaterialType.VIDEO,
      MaterialType.DOCUMENT,
    ];
    if (fileMaterialTypes.includes(data.materialType) && !data.fileUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "fileUrl is required for file-based materials", path: ["fileUrl"] });
    }
    if (data.materialType === MaterialType.LINK && !data.externalUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "externalUrl is required for LINK materials", path: ["externalUrl"] });
    }
  });

export const updateMaterialSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    materialType: z.nativeEnum(MaterialType),
    fileUrl: z.string().trim().url("Invalid file URL").nullable(),
    fileSize: z
      .number()
      .int("File size must be an integer")
      .min(0, "File size must be at least 0")
      .nullable(),
    thumbnailUrl: z.string().trim().url("Invalid thumbnail URL").nullable(),
    externalUrl: z
      .string()
      .trim()
      .url("Invalid external URL")
      .refine((val) => lessonMaterialUrlRegex.test(val), {
        message: "External URL must be a valid http(s) URL",
      })
      .nullable(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0"),
  })
  .strict();

export const patchMaterialSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    materialType: z.nativeEnum(MaterialType).optional(),
    fileUrl: z.string().trim().url("Invalid file URL").nullable().optional(),
    fileSize: z
      .number()
      .int("File size must be an integer")
      .min(0, "File size must be at least 0")
      .nullable()
      .optional(),
    thumbnailUrl: z.string().trim().url("Invalid thumbnail URL").nullable().optional(),
    externalUrl: z
      .string()
      .trim()
      .url("Invalid external URL")
      .refine((val) => lessonMaterialUrlRegex.test(val), {
        message: "External URL must be a valid http(s) URL",
      })
      .nullable()
      .optional(),
    order: z.number().int("Order must be an integer").min(0, "Order must be at least 0").optional(),
  })
  .strict();

export const materialListSchema = paginationSchema.extend({
  search: searchSchema,
  materialType: z.nativeEnum(MaterialType).optional(),
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

export type MaterialIdParam = z.infer<typeof materialIdParamSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type PatchMaterialInput = z.infer<typeof patchMaterialSchema>;
export type MaterialListQuery = z.infer<typeof materialListSchema>;
