import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  avatar: z.string().url().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
