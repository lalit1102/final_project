import { NextRequest } from "next/server";
import { submissionController } from "@/controllers/submission.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return submissionController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return submissionController.create(req);
});
