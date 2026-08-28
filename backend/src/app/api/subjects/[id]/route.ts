import { NextRequest } from "next/server";
import { subjectController } from "@/controllers/subject.controller";
import { apiHandler } from "@/utils/apiHandler";
import { subjectIdParamSchema } from "@/validations/subject.validation";

async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return subjectIdParamSchema.parse({ id }).id;
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return subjectController.getById(req, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return subjectController.update(req, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return subjectController.patch(req, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return subjectController.delete(req, id);
});
