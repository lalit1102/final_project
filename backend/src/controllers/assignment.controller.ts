import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assignmentService } from "@/services/assignment.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { logger } from "@/utils/logger";
import {
  assignmentListSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  patchAssignmentSchema,
} from "@/validations/assignment.validation";

export class AssignmentController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "classId", "courseId", "status", "submissionType", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = assignmentListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await assignmentService.listAssignments(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Assignments fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const assignment = await assignmentService.getAssignmentById(id, currentUserId);

      return NextResponse.json(
        sendResponse(assignment, "Assignment fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createAssignmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const assignment = await assignmentService.createAssignment(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(assignment, "Assignment created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateAssignmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const assignment = await assignmentService.updateAssignment(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(assignment, "Assignment updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchAssignmentSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const assignment = await assignmentService.patchAssignment(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(assignment, "Assignment updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const assignment = await assignmentService.deleteAssignment(id, currentUserId);

      return NextResponse.json(
        sendResponse(assignment, "Assignment deactivated successfully"),
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

    logger.error("Unhandled assignment controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const assignmentController = new AssignmentController();
