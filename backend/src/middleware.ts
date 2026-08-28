import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeAccessToken } from "./lib/edgeJwt";
import { UserRole } from "./types/user.types";
import { STATUS_CODES } from "./constants/statusCodes";
import { ERROR_MESSAGES } from "./constants/errorMessages";
import { env } from "./config/env";
import { validateCsrf } from "./lib/csrf";

const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout", "/api/subjects", "/api/courses", "/api/classes"];
const adminRoutes = ["/api/admin"];
const allowedOrigin = env.FRONTEND_ORIGIN || "http://localhost:3000";

function getAllowedOrigin(requestOrigin: string | null): string {
  if (requestOrigin === allowedOrigin) {
    return allowedOrigin;
  }
  return "";
}

export function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function createJsonError(statusCode: number, message: string, errors: string[], origin: string) {
  const response = NextResponse.json(
    {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );

  applyCorsHeaders(response, origin);
  return response;
}

function applyCorsHeaders(response: NextResponse, origin: string) {
  if (!origin) return;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,x-csrf-token");
}

export const CSRF_STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = matchesRoute(pathname, protectedRoutes);
  const isAdmin = matchesRoute(pathname, adminRoutes);
  const origin = getAllowedOrigin(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    applyCorsHeaders(response, origin);
    return response;
  }

  const response = NextResponse.next();
  applyCorsHeaders(response, origin);

  if (!isProtected && !isAdmin) {
    return response;
  }

  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED, ["Missing access token"], origin);
  }

  try {
    const decoded = await verifyEdgeAccessToken(accessToken);

    if (isAdmin && decoded.role !== UserRole.ADMIN) {
      return createJsonError(STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN, ["Insufficient permissions"], origin);
    }

    // CSRF validation: applied after authentication and authorization, only
    // for state-changing methods on authenticated routes. Safe methods
    // (GET, HEAD, OPTIONS) are exempt.
    if (CSRF_STATE_CHANGING_METHODS.has(req.method)) {
      const csrfResult = validateCsrf(req);
      if (!csrfResult.valid) {
        applyCorsHeaders(csrfResult.response, origin);
        return csrfResult.response;
      }
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-role", decoded.role);

    const authResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    applyCorsHeaders(authResponse, origin);

    return authResponse;
  } catch {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_INVALID, ["Invalid access token"], origin);
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
