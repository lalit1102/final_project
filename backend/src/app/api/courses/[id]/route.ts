import { NextRequest } from "next/server";
import { courseController } from "@/controllers/course.controller";
import { apiHandler } from "@/utils/apiHandler";
import { courseIdParamSchema } from "@/validations/course.validation";

async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return courseIdParamSchema.parse({ id }).id;
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return courseController.getById(req, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return courseController.update(req, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return courseController.patch(req, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const id = await extractValidatedId(args);
  return courseController.delete(req, id);
});
