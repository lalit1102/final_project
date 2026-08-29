import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { materialService } from "@/services/material.service";
import { sendResponse } from "@/utils/apiResponse";
import { AppError, handleMongoError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import {
  createMaterialSchema,
  updateMaterialSchema,
  patchMaterialSchema,
  materialListSchema,
} from "@/validations/material.validation";

export class MaterialController {
  async list(req: NextRequest, lessonId: string) {
    try {
      const { searchParams } = new URL(req.url);

      const rawParams: Record<string, string | null> = {};
      for (const key of ["page", "limit", "search", "materialType", "isActive"]) {
        rawParams[key] = searchParams.get(key);
      }

      const validatedData = materialListSchema.parse(rawParams);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const result = await materialService.listMaterials(validatedData, lessonId, currentUserId);

      return NextResponse.json(
        sendResponse(result, "Materials fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(req: NextRequest, lessonId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const material = await materialService.getMaterialById(id, lessonId, currentUserId);

      return NextResponse.json(
        sendResponse(material, "Material fetched successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async create(req: NextRequest, lessonId: string) {
    try {
      const body = await req.json();
      const validatedData = createMaterialSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const material = await materialService.createMaterial(lessonId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(material, "Material created successfully"),
        { status: STATUS_CODES.CREATED },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(req: NextRequest, lessonId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = updateMaterialSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const material = await materialService.updateMaterial(id, lessonId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(material, "Material updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(req: NextRequest, lessonId: string, id: string) {
    try {
      const body = await req.json();
      const validatedData = patchMaterialSchema.parse(body);
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";

      const material = await materialService.patchMaterial(id, lessonId, validatedData, currentUserId);

      return NextResponse.json(
        sendResponse(material, "Material updated successfully"),
        { status: STATUS_CODES.OK },
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(req: NextRequest, lessonId: string, id: string) {
    try {
      const currentUserId = req.headers.get("x-user-id") ?? "unknown";
      const material = await materialService.deleteMaterial(id, lessonId, currentUserId);

      return NextResponse.json(
        sendResponse(material, "Material deactivated successfully"),
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

export const materialController = new MaterialController();
