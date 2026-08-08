import { NextRequest, NextResponse } from "next/server";
import { navigationService } from "@/services/navigation.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { z } from "zod";
import { userRepository } from "@/repositories/user.repository";

export class NavigationController {
  async getNavigation(req: NextRequest) {
    try {
      const userId = req.headers.get("x-user-id");
      if (!userId) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      const navigation = navigationService.getNavigation(user);

      return NextResponse.json(
        sendResponse({ items: navigation }, "Navigation fetched successfully"),
        { status: STATUS_CODES.OK }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        sendResponse(null, "Validation Error", error.issues.map((e: z.ZodIssue) => e.message)),
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        sendResponse(null, error.message, error.errors),
        { status: error.statusCode }
      );
    }

    logger.error("Unhandled navigation controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

export const navigationController = new NavigationController();
