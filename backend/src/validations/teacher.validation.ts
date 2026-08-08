import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must not exceed 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  avatar: z.string().url("Invalid avatar URL").optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
