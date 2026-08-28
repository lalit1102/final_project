import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classService } from "@/services/class.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import {
  createClassSchema,
  updateClassSchema,
  patchClassSchema,
  classListSchema,
} from "@/validations/class.validation";

export class ClassController {
  async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "courseId", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = classListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await classService.listClasses(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Classes fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const cls = await classService.getClassById(id, currentUserId);

      return NextResponse.json(
        sendResponse(cls, "Class fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = createClassSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const cls = await classService.createClass(validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(cls, "Class created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateClassSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const cls = await classService.updateClass(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(cls, "Class updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchClassSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const cls = await classService.patchClass(id, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(cls, "Class updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const cls = await classService.deleteClass(id, currentUserId);

      return NextResponse.json(
        sendResponse(cls, "Class deactivated successfully"),
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

export const classController = new ClassController();
