import { NextRequest } from "next/server";
import { authController } from "@/controllers/auth.controller";
import { apiHandler } from "@/utils/apiHandler";

export const POST = apiHandler(async (req: NextRequest) => {
  return authController.logout(req);
});
