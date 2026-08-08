import { NextRequest } from "next/server";
import { apiHandler } from "@/utils/apiHandler";
import { teacherController } from "@/controllers/teacher.controller";

export const POST = apiHandler(async (req: NextRequest) => {
  return teacherController.createTeacher(req);
});
