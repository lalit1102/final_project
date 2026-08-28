import { type NextRequest, NextResponse } from "next/server";

import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { sendResponse } from "@/utils/apiResponse";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_BYTES = 32;

/**
 * CSRF protection strategy: Double-submit cookie pattern.
 *
 * Strategy:
 *   - A cryptographically secure random token is stored in a readable
 *     (non-HTTP-only) cookie named "csrfToken".
 *   - The same token must also be sent in the "x-csrf-token" request header.
 *   - The middleware compares the cookie value and the header value using a
 *     timing-safe comparison for every state-changing request.
 *
 * Security properties:
 *   - The csrfToken cookie is NOT an authentication credential and is safe
 *     for frontend JavaScript to read.
 *   - Authentication cookies (accessToken, refreshToken) remain HTTP-only and
 *     are never readable by frontend JavaScript.
 *   - SameSite is set to "strict" to match the authentication cookies, so the
 *     token never leaves the browser for cross-site requests. This is
 *     compatible with the same-origin frontend/backend deployment model used
 *     by this application.
 *
 * State-changing methods requiring CSRF validation: POST, PUT, PATCH, DELETE
 * Methods exempt from CSRF validation: GET, HEAD, OPTIONS
 *
 * EDGE RUNTIME NOTE: This module contains NO Node-only APIs (no node:crypto,
 *   no winston logger). It is safe to import from the Next.js Edge middleware.
 *   Token generation (which requires node:crypto) lives in csrf.server.ts.
 */

/**
 * Edge-compatible timing-safe comparison of two token strings.
 *
 * The Next.js middleware runs on the Edge runtime, which does not provide
 * Node's crypto.timingSafeEqual. This function implements a constant-time
 * comparison over the raw string bytes to prevent timing attacks. Because
 * CSRF tokens are fixed-length base64url strings, length differences are
 * checked first and short-circuit to false.
 */
export function safeCompareTokenEdge(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Extracts the CSRF token from the request header "x-csrf-token".
 *
 * Only the custom header is accepted as a token source. A query-parameter
 * fallback is deliberately NOT implemented because query parameters can leak
 * through logs, browser history, monitoring systems, and analytics.
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  const fromHeader = request.headers.get(CSRF_HEADER_NAME);
  return fromHeader ?? null;
}

/**
 * Validates the CSRF token on a request using the double-submit pattern.
 *
 * Reads the csrfToken cookie and the x-csrf-token header, then compares them
 * using a timing-safe comparison. Returns { valid: true } on success, or an
 * error response on failure.
 *
 * Uses safeCompareTokenEdge for Edge Runtime compatibility.
 *
 * This function must be safe for the Edge runtime — it does NOT use any
 * Node-only APIs (no node:crypto, no winston logger). Failures are returned
 * as structured responses; the caller (middleware) may log as needed.
 */
export function validateCsrf(
  request: NextRequest,
): { valid: true } | { valid: false; response: NextResponse } {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return {
      valid: false,
      response: NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.CSRF_INVALID, [
          "CSRF token missing from cookie",
        ]),
        { status: STATUS_CODES.FORBIDDEN },
      ),
    };
  }

  const requestToken = getCsrfTokenFromRequest(request);

  if (!requestToken) {
    return {
      valid: false,
      response: NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.CSRF_INVALID, [
          "CSRF token missing from request",
        ]),
        { status: STATUS_CODES.FORBIDDEN },
      ),
    };
  }

  if (!safeCompareTokenEdge(cookieToken, requestToken)) {
    return {
      valid: false,
      response: NextResponse.json(
        sendResponse(null, ERROR_MESSAGES.CSRF_INVALID, [
          "CSRF token does not match",
        ]),
        { status: STATUS_CODES.FORBIDDEN },
      ),
    };
  }

  return { valid: true };
}

/**
 * Sets the CSRF cookie on a response.
 *
 * The cookie is NOT HTTP-only because frontend JavaScript must read it to
 * include the token in the "x-csrf-token" header. The csrfToken is not an
 * authentication credential — it is a defense-in-depth token validated
 * alongside the HTTP-only auth cookies.
 *
 * SameSite is set to "strict" to match the authentication cookies and the
 * same-origin deployment model. This ensures the CSRF cookie is only sent
 * on same-site requests, providing the first layer of CSRF defense.
 */
export function setCsrfCookie(
  response: NextResponse,
  token: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Clears the CSRF cookie on a response.
 */
export function clearCsrfCookie(response: NextResponse): void {
  response.cookies.delete(CSRF_COOKIE_NAME);
}
