import { NextRequest } from "next/server";
import { apiHandler } from "@/utils/apiHandler";
import { navigationController } from "@/controllers/navigation.controller";

export const GET = apiHandler(async (req: NextRequest) => {
  return navigationController.getNavigation(req);
});
