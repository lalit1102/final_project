import { NextRequest } from "next/server";
import { adminController } from "@/controllers/admin.controller";
import { apiHandler } from "@/utils/apiHandler";
import { userIdParamSchema } from "@/validations/admin.validation";

async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return userIdParamSchema.parse({ id }).id;
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return adminController.getUserById(req, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return adminController.updateUser(req, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return adminController.updateUser(req, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return adminController.deleteUser(req, id);
});
