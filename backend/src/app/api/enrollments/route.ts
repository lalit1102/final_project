import { NextRequest } from "next/server";
import { enrollmentController } from "@/controllers/enrollment.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return enrollmentController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return enrollmentController.create(req);
});
