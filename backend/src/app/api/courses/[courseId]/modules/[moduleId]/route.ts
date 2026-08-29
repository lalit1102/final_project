import { NextRequest } from "next/server";
import { moduleController } from "@/controllers/module.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractParams(args: unknown[]): Promise<{ courseId: string; id: string }> {
  const params = await (args[0] as { params: Promise<{ courseId: string; id: string }> }).params;
  return {
    courseId: objectIdSchema.parse(params.courseId),
    id: objectIdSchema.parse(params.id),
  };
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { courseId, id } = await extractParams(args);
  return moduleController.getById(req, courseId, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { courseId, id } = await extractParams(args);
  return moduleController.update(req, courseId, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { courseId, id } = await extractParams(args);
  return moduleController.patch(req, courseId, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { courseId, id } = await extractParams(args);
  return moduleController.delete(req, courseId, id);
});
