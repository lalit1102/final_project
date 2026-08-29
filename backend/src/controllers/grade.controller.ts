import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gradeService } from "@/services/grade.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { logger } from "@/utils/logger";
import {
  gradeListSchema,
  createGradeSchema,
  updateGradeSchema,
  patchGradeSchema,
} from "@/validations/grade.validation";

export class GradeController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "studentId", "assignmentId", "classId", "submissionId", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = gradeListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await gradeService.listGrades(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Grades fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const grade = await gradeService.getGradeById(id, currentUserId);

      return NextResponse.json(
        sendResponse(grade, "Grade fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createGradeSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const grade = await gradeService.createGrade(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(grade, "Grade created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateGradeSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const grade = await gradeService.updateGrade(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(grade, "Grade updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchGradeSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const grade = await gradeService.patchGrade(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(grade, "Grade updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const grade = await gradeService.deleteGrade(id, currentUserId);

      return NextResponse.json(
        sendResponse(grade, "Grade deactivated successfully"),
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
        { status: STATUS_CODES.BAD_REQUEST },
      );
    }
    const mongoError = handleMongoError(error);
    if (mongoError) {
      return NextResponse.json(
        sendResponse(null, mongoError.message, mongoError.errors),
        { status: mongoError.statusCode },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        sendResponse(null, error.message, error.errors),
        { status: error.statusCode },
      );
    }

    logger.error("Unhandled grade controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const gradeController = new GradeController();
