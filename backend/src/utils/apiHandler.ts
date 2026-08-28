import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { rateLimiter } from "@/utils/rateLimiter";
import { sendResponse } from "@/utils/apiResponse";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { z } from "zod";

type Handler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

export const apiHandler = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      await connectDB();

      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

      try {
        await rateLimiter.consume(ip);
      } catch {
        return NextResponse.json(
          sendResponse(null, ERROR_MESSAGES.RATE_LIMIT_EXCEEDED),
          { status: STATUS_CODES.TOO_MANY_REQUESTS }
        );
      }

      return await handler(req, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          sendResponse(null, "Validation Error", error.issues.map((e: z.ZodIssue) => e.message)),
          { status: STATUS_CODES.BAD_REQUEST }
        );
      }
      logger.error("API Handler Wrapper Error:", error);
      return NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR),
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }
  };
};
