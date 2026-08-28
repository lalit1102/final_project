import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminService } from "@/services/admin.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { logger } from "@/utils/logger";
import { userListSchema, updateUserSchema, updateUserStatusSchema } from "@/validations/admin.validation";

export class AdminController {
  async listUsers(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "role", "isActive", "search"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = userListSchema.parse(rawParams);

      const result = await adminService.listUsers(validatedData);

      return NextResponse.json(
        sendResponse(result, "Users fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserById(req: NextRequest, id: string) {
    try {
      const user = await adminService.getUserById(id);

      return NextResponse.json(
        sendResponse(user, "User fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUser(req: NextRequest, id: string) {
    try {
      const userId = req.headers.get("x-user-id");

      const body = await req.json();
      const validatedData = updateUserSchema.parse(body);

      const user = await adminService.updateUser(id, validatedData, userId ?? "unknown");

      return NextResponse.json(
        sendResponse(user, "User updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUserStatus(req: NextRequest, id: string) {
    try {
      const userId = req.headers.get("x-user-id");

      const body = await req.json();
      const validatedData = updateUserStatusSchema.parse(body);

      const user = await adminService.updateUserStatus(id, validatedData.isActive, userId ?? "unknown");

      return NextResponse.json(
        sendResponse(user, "User status updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteUser(req: NextRequest, id: string) {
    try {
      const userId = req.headers.get("x-user-id");

      const user = await adminService.deleteUser(id, userId ?? "unknown");

      return NextResponse.json(
        sendResponse(user, "User deactivated successfully"),
        { status: STATUS_CODES.OK },
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
    const mongoError = handleMongoError(error);
    if (mongoError) {
      return NextResponse.json(
        sendResponse(null, mongoError.message, mongoError.errors),
        { status: mongoError.statusCode }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        sendResponse(null, error.message, error.errors),
        { status: error.statusCode },
      );
    }

    logger.error("Unhandled admin controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const adminController = new AdminController();
