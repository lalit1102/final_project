import { NextRequest } from "next/server";
import { gradeController } from "@/controllers/grade.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return gradeController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return gradeController.create(req);
});
