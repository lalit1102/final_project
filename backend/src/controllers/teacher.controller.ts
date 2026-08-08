import { NextRequest, NextResponse } from "next/server";
import { teacherService } from "@/services/teacher.service";
import { createTeacherSchema } from "@/validations/teacher.validation";
import { sendResponse } from "@/utils/apiResponse";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { PermissionCode } from "@/types/permission.types";
import { userRepository } from "@/repositories/user.repository";

export class TeacherController {
  async createTeacher(req: NextRequest) {
    try {
      const userId = req.headers.get("x-user-id");
      if (!userId) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      const requester = await userRepository.findById(userId);
      if (!requester) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      requirePermission(requester, PermissionCode.TEACHER_CREATE);

      const body = await req.json();
      const validatedData = createTeacherSchema.parse(body);

      const teacher = await teacherService.createTeacher(validatedData);

      return NextResponse.json(
        sendResponse(teacher, "Teacher created successfully"),
        { status: STATUS_CODES.CREATED }
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

    logger.error("Unhandled teacher controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

export const teacherController = new TeacherController();
