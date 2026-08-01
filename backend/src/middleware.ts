import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeAccessToken } from "./lib/edgeJwt";
import { UserRole } from "./types/user.types";
import { STATUS_CODES } from "./constants/statusCodes";
import { ERROR_MESSAGES } from "./constants/errorMessages";

const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout"];
const adminRoutes = ["/api/admin"];

function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function createJsonError(statusCode: number, message: string, errors: string[]) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = matchesRoute(pathname, protectedRoutes);
  const isAdmin = matchesRoute(pathname, adminRoutes);

  if (!isProtected && !isAdmin) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED, ["Missing access token"]);
  }

  try {
    const decoded = await verifyEdgeAccessToken(accessToken);

    if (isAdmin && decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.SUPER_ADMIN) {
      return createJsonError(STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN, ["Insufficient permissions"]);
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", decoded.userId);
    requestHeaders.set("x-user-role", decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return createJsonError(STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_INVALID, ["Invalid access token"]);
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
