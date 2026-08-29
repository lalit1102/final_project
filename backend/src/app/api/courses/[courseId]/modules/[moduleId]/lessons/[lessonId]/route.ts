import { NextRequest } from "next/server";
import { lessonController } from "@/controllers/lesson.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractParams(args: unknown[]): Promise<{ moduleId: string; id: string }> {
  const params = await (args[0] as { params: Promise<{ courseId: string; moduleId: string; id: string }> }).params;
  return {
    moduleId: objectIdSchema.parse(params.moduleId),
    id: objectIdSchema.parse(params.id),
  };
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { moduleId, id } = await extractParams(args);
  return lessonController.getById(req, moduleId, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { moduleId, id } = await extractParams(args);
  return lessonController.update(req, moduleId, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { moduleId, id } = await extractParams(args);
  return lessonController.patch(req, moduleId, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { moduleId, id } = await extractParams(args);
  return lessonController.delete(req, moduleId, id);
});
