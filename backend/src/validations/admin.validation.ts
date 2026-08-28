import { z } from "zod";
import { UserRole } from "@/types/user.types";
import { objectIdSchema } from "./objectId";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const userIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid user ID"),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userListSchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
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
  search: z.string().trim().min(1).max(100).optional(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .trim()
    .toLowerCase()
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  studentId: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .describe("Unique student identifier; only ADMIN may set this on STUDENT users"),
  parentIds: z
    .array(objectIdSchema)
    .max(10, "A student can have at most 10 parents")
    .nullable()
    .optional()
    .describe("Array of parent User ObjectIds; only ADMIN may set this on STUDENT users"),
}).strict();

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

export type UserListQuery = z.infer<typeof userListSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
