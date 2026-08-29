import { NextRequest } from "next/server";
import { lessonController } from "@/controllers/lesson.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractModuleId(args: unknown[]): Promise<string> {
  const { moduleId } = await (args[0] as { params: Promise<{ courseId: string; moduleId: string }> }).params;
  return objectIdSchema.parse(moduleId);
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const moduleId = await extractModuleId(args);
  return lessonController.list(req, moduleId);
});

export const POST = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const moduleId = await extractModuleId(args);
  return lessonController.create(req, moduleId);
});
