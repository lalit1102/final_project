import { NextRequest } from "next/server";
import { assignmentController } from "@/controllers/assignment.controller";
import { apiHandler } from "@/utils/apiHandler";
import { assignmentIdParamSchema } from "@/validations/assignment.validation";

async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return assignmentIdParamSchema.parse({ id }).id;
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return assignmentController.getById(req, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return assignmentController.update(req, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return assignmentController.patch(req, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return assignmentController.delete(req, id);
});
