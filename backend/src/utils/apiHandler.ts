import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { rateLimiter } from "@/utils/rateLimiter";
import { sendResponse } from "@/utils/apiResponse";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { z } from "zod";
import { randomUUID } from "node:crypto";

type Handler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

const MAX_REQUEST_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export const apiHandler = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: unknown[]) => {
    const requestId = randomUUID();
    const method = req.method;
    const pathname = req.nextUrl.pathname;
    const ip = getClientIp(req);
    const startTime = Date.now();

    const logFields = { requestId, method, pathname, ip };

    let response: NextResponse;
    try {
      await connectDB();

      try {
        await rateLimiter.consume(ip);
      } catch {
        logger.warn("Rate limit exceeded", logFields);
        response = NextResponse.json(
          sendResponse(null, ERROR_MESSAGES.RATE_LIMIT_EXCEEDED),
          { status: STATUS_CODES.TOO_MANY_REQUESTS }
        );
        logger.info("Request completed", { ...logFields, statusCode: response.status, duration: Date.now() - startTime });
        return response;
      }

      const contentLength = req.headers.get("content-length");
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (!Number.isNaN(size) && size > MAX_REQUEST_BODY_BYTES) {
          response = NextResponse.json(
            sendResponse(null, ERROR_MESSAGES.PAYLOAD_TOO_LARGE, [
              `Request body exceeds maximum allowed size of ${MAX_REQUEST_BODY_BYTES} bytes.`,
            ]),
            { status: STATUS_CODES.REQUEST_ENTITY_TOO_LARGE }
          );
          logger.warn("Request body too large", { ...logFields, contentLength: size, statusCode: response.status });
          return response;
        }
      }

      response = await handler(req, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response = NextResponse.json(
          sendResponse(null, "Validation Error", error.issues.map((e: z.ZodIssue) => e.message)),
          { status: STATUS_CODES.BAD_REQUEST }
        );
        logger.info("Request completed", { ...logFields, statusCode: response.status, duration: Date.now() - startTime });
        return response;
      }
      logger.error("API Handler Wrapper Error:", { ...logFields, error: error instanceof Error ? error.message : String(error) });
      response = NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.INTERNAL_SERVER_ERROR),
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }

    const duration = Date.now() - startTime;
    logger.info("Request completed", { ...logFields, statusCode: response.status, duration });
    return response;
  };
};
