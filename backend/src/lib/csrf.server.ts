import crypto from "node:crypto";

import { CSRF_TOKEN_BYTES } from "@/lib/csrf";

/**
 * Server-only CSRF utilities that require Node.js crypto APIs.
 *
 * This module MUST NOT be imported from the Next.js Edge middleware.
 * The middleware imports only from `csrf.ts` (the Edge-safe module).
 *
 * Token generation should only happen in server-side code (API routes,
 * controllers, services) where the Node.js runtime is available.
 */

/**
 * Generates a cryptographically secure CSRF token.
 *
 * Uses Node's crypto.randomBytes (CSPRNG) — never Math.random.
 * Returns a base64url-encoded string of 32 random bytes (256 bits of entropy).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_BYTES).toString("base64url");
}

/**
 * Timing-safe comparison of two base64url-encoded token strings.
 *
 * Because CSRF tokens are fixed-length base64url strings of 32 bytes
 * (43 characters), length differences indicate a mismatch and are rejected
 * immediately. When lengths match, a constant-time comparison is performed
 * using Node's crypto.timingSafeEqual.
 *
 * This function uses the Node.js crypto module and must only be called in
 * server-side contexts. The Edge middleware uses safeCompareTokenEdge instead,
 * which achieves the same constant-time property without Node-specific APIs.
 */
export function safeCompareToken(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, "base64url"),
      Buffer.from(b, "base64url"),
    );
  } catch {
    return false;
  }
}
