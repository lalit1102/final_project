import { NextRequest } from "next/server";
import { adminController } from "@/controllers/admin.controller";
import { apiHandler } from "@/utils/apiHandler";

export const GET = apiHandler(async (req: NextRequest) => {
  return adminController.listUsers(req);
});
