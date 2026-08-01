import { NextRequest } from "next/server";
import { authController } from "@/controllers/auth.controller";
import { apiHandler } from "@/utils/apiHandler";

export const PUT = apiHandler(async (req: NextRequest) => {
  return authController.updateProfile(req);
});
