import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { rateLimiter } from "@/utils/rateLimiter";
import { sendResponse } from "@/utils/apiResponse";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";

type Handler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

export const apiHandler = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      // 1. Connect to Database
      await connectDB();

      // 2. Rate Limiting
      // Extract IP address
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      
      try {
        await rateLimiter.consume(ip);
      } catch (rateLimiterRes) {
        return NextResponse.json(
          sendResponse(null, ERROR_MESSAGES.RATE_LIMIT_EXCEEDED),
          { status: STATUS_CODES.TOO_MANY_REQUESTS }
        );
      }

      // 3. Execute main handler
      return await handler(req, ...args);
    } catch (error) {
      logger.error("API Handler Wrapper Error:", error);
      return NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR),
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }
  };
};
