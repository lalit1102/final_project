import { NextRequest } from "next/server";
import { courseController } from "@/controllers/course.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return courseController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return courseController.create(req);
});
