import { NextRequest } from "next/server";
import { adminController } from "@/controllers/admin.controller";
import { apiHandler } from "@/utils/apiHandler";
import { userIdParamSchema } from "@/validations/admin.validation";

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  const validatedId = userIdParamSchema.parse({ id }).id;
  return adminController.updateUserStatus(req, validatedId);
});
