import { NextRequest } from "next/server";
import { materialController } from "@/controllers/material.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractLessonId(args: unknown[]): Promise<string> {
  const { lessonId } = await (args[0] as { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }).params;
  return objectIdSchema.parse(lessonId);
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const lessonId = await extractLessonId(args);
  return materialController.list(req, lessonId);
});

export const POST = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const lessonId = await extractLessonId(args);
  return materialController.create(req, lessonId);
});
