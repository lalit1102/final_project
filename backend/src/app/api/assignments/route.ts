import { NextRequest } from "next/server";
import { assignmentController } from "@/controllers/assignment.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return assignmentController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return assignmentController.create(req);
});
