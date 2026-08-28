import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrollmentService } from "@/services/enrollment.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { logger } from "@/utils/logger";
import {
  enrollmentListSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  patchEnrollmentSchema,
} from "@/validations/enrollment.validation";

export class EnrollmentController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "studentId", "classId", "status", "isActive", "search"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = enrollmentListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await enrollmentService.listEnrollments(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Enrollments fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const enrollment = await enrollmentService.getEnrollmentById(id, currentUserId);

      return NextResponse.json(
        sendResponse(enrollment, "Enrollment fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createEnrollmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const enrollment = await enrollmentService.createEnrollment(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(enrollment, "Enrollment created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateEnrollmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const enrollment = await enrollmentService.updateEnrollment(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(enrollment, "Enrollment updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchEnrollmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const enrollment = await enrollmentService.patchEnrollment(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(enrollment, "Enrollment updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const enrollment = await enrollmentService.deleteEnrollment(id, currentUserId);

      return NextResponse.json(
        sendResponse(enrollment, "Enrollment deactivated successfully"),
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

    logger.error("Unhandled enrollment controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const enrollmentController = new EnrollmentController();
