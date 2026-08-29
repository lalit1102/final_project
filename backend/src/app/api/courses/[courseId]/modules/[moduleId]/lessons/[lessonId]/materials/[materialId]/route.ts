import { NextRequest } from "next/server";
import { materialController } from "@/controllers/material.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractParams(args: unknown[]): Promise<{ lessonId: string; id: string }> {
  const params = await (args[0] as { params: Promise<{ courseId: string; moduleId: string; lessonId: string; id: string }> }).params;
  return {
    lessonId: objectIdSchema.parse(params.lessonId),
    id: objectIdSchema.parse(params.id),
  };
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { lessonId, id } = await extractParams(args);
  return materialController.getById(req, lessonId, id);
});

export const PUT = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { lessonId, id } = await extractParams(args);
  return materialController.update(req, lessonId, id);
});

export const PATCH = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { lessonId, id } = await extractParams(args);
  return materialController.patch(req, lessonId, id);
});

export const DELETE = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const { lessonId, id } = await extractParams(args);
  return materialController.delete(req, lessonId, id);
});
