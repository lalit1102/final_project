import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeAccessToken } from "./lib/edgeJwt";
import { UserRole } from "./types/user.types";
import { STATUS_CODES } from "./constants/statusCodes";
import { ERROR_MESSAGES } from "./constants/errorMessages";
import { env } from "./config/env";

const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout"]; 
const adminRoutes = ["/api/admin"];
const allowedOrigin = env.FRONTEND_ORIGIN || "http://localhost:3000";

function matchesRoute(pathname: string, routes: readonly string[]): boolean {
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

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");

  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = matchesRoute(pathname, protectedRoutes);
  const isAdmin = matchesRoute(pathname, adminRoutes);
  const origin = req.headers.get("origin") ?? allowedOrigin;

  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");

  if (!isProtected && !isAdmin) {
    return response;
  }

  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED, ["Missing access token"], origin);
  }

  try {
    const decoded = await verifyEdgeAccessToken(accessToken);

    if (isAdmin && decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.SUPER_ADMIN) {
      return createJsonError(STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN, ["Insufficient permissions"], origin);
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-role", decoded.role);

    const authResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    authResponse.headers.set("Access-Control-Allow-Origin", origin);
    authResponse.headers.set("Access-Control-Allow-Credentials", "true");
    authResponse.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    authResponse.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");

    return authResponse;
  } catch {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_INVALID, ["Invalid access token"], origin);
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
