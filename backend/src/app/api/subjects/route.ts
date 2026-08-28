import { NextRequest } from "next/server";
import { subjectController } from "@/controllers/subject.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return subjectController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return subjectController.create(req);
});
