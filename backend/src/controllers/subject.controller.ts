import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subjectService } from "@/services/subject.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import {
  createSubjectSchema,
  updateSubjectSchema,
  patchSubjectSchema,
  subjectListSchema,
} from "@/validations/subject.validation";

export class SubjectController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = subjectListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await subjectService.listSubjects(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Subjects fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const subject = await subjectService.getSubjectById(id, currentUserId);

      return NextResponse.json(
        sendResponse(subject, "Subject fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createSubjectSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const subject = await subjectService.createSubject(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(subject, "Subject created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateSubjectSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const subject = await subjectService.updateSubject(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(subject, "Subject updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchSubjectSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const subject = await subjectService.patchSubject(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(subject, "Subject updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const subject = await subjectService.deleteSubject(id, currentUserId);

      return NextResponse.json(
        sendResponse(subject, "Subject deactivated successfully"),
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

    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const subjectController = new SubjectController();
