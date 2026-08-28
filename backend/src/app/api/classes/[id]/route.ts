import { NextRequest } from "next/server";
import { classController } from "@/controllers/class.controller";
import { apiHandler } from "@/utils/apiHandler";
import { classIdParamSchema } from "@/validations/class.validation";

async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return classIdParamSchema.parse({ id }).id;
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return classController.getById(req, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return classController.update(req, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return classController.patch(req, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return classController.delete(req, id);
});
