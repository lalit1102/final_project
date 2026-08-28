import { NextRequest } from "next/server";
import { classController } from "@/controllers/class.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return classController.list(req);
});

export const POST = apiHandler(async (req: NextRequest) => {
  return classController.create(req);
});
