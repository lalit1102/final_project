import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submissionService } from "@/services/submission.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { logger } from "@/utils/logger";
import {
  submissionListSchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  patchSubmissionSchema,
} from "@/validations/submission.validation";

export class SubmissionController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "assignmentId", "studentId", "classId", "status", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = submissionListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await submissionService.listSubmissions(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Submissions fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const submission = await submissionService.getSubmissionById(id, currentUserId);

      return NextResponse.json(
        sendResponse(submission, "Submission fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createSubmissionSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const submission = await submissionService.createSubmission(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(submission, "Submission created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateSubmissionSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const submission = await submissionService.updateSubmission(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(submission, "Submission updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchSubmissionSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const submission = await submissionService.patchSubmission(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(submission, "Submission updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const submission = await submissionService.deleteSubmission(id, currentUserId);

      return NextResponse.json(
        sendResponse(submission, "Submission deactivated successfully"),
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

    logger.error("Unhandled submission controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const submissionController = new SubmissionController();
