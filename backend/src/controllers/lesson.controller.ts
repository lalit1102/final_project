import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lessonService } from "@/services/lesson.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import {
  createLessonSchema,
  updateLessonSchema,
  patchLessonSchema,
  lessonListSchema,
} from "@/validations/lesson.validation";

export class LessonController {
  async list(req: NextRequest, moduleId: string) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "contentType", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = lessonListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await lessonService.listLessons(validatedData, moduleId, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Lessons fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, moduleId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const lesson = await lessonService.getLessonById(id, moduleId, currentUserId);

      return NextResponse.json(
        sendResponse(lesson, "Lesson fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest, moduleId: string) {
    try {
      const body = await req.json();
      const validatedData = createLessonSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const lesson = await lessonService.createLesson(moduleId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(lesson, "Lesson created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, moduleId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateLessonSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const lesson = await lessonService.updateLesson(id, moduleId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(lesson, "Lesson updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, moduleId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchLessonSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const lesson = await lessonService.patchLesson(id, moduleId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(lesson, "Lesson updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, moduleId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const lesson = await lessonService.deleteLesson(id, moduleId, currentUserId);

      return NextResponse.json(
        sendResponse(lesson, "Lesson deactivated successfully"),
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
      sendResponse(null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

export const lessonController = new LessonController();
