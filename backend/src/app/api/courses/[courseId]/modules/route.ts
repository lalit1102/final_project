import { NextRequest } from "next/server";
import { moduleController } from "@/controllers/module.controller";
import { apiHandler } from "@/utils/apiHandler";
import { objectIdSchema } from "@/validations/objectId";

async function extractCourseId(args: unknown[]): Promise<string> {
  const { courseId } = await (args[0] as { params: Promise<{ courseId: string }> }).params;
  return objectIdSchema.parse(courseId);
}

export const GET = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const courseId = await extractCourseId(args);
  return moduleController.list(req, courseId);
});

export const POST = apiHandler(async (req: NextRequest, ...args: unknown[]) => {
  const courseId = await extractCourseId(args);
  return moduleController.create(req, courseId);
});
