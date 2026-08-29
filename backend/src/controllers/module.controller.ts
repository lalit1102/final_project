import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { moduleService } from "@/services/module.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import {
  createModuleSchema,
  updateModuleSchema,
  patchModuleSchema,
  moduleListSchema,
} from "@/validations/module.validation";

export class ModuleController {
  async list(req: NextRequest, courseId: string) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = moduleListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await moduleService.listModules(validatedData, courseId, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Modules fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, courseId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const moduleDoc = await moduleService.getModuleById(id, courseId, currentUserId);

      return NextResponse.json(
        sendResponse(moduleDoc, "Module fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest, courseId: string) {
    try {
      const body = await req.json();
      const validatedData = createModuleSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const moduleDoc = await moduleService.createModule(courseId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(moduleDoc, "Module created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, courseId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateModuleSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const moduleDoc = await moduleService.updateModule(id, courseId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(moduleDoc, "Module updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, courseId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchModuleSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const moduleDoc = await moduleService.patchModule(id, courseId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(moduleDoc, "Module updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, courseId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const moduleDoc = await moduleService.deleteModule(id, courseId, currentUserId);

      return NextResponse.json(
        sendResponse(moduleDoc, "Module deactivated successfully"),
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

export const moduleController = new ModuleController();
