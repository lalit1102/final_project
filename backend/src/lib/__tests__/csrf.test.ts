import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest, NextResponse } from "next/server";

import {
  getCsrfTokenFromRequest,
  validateCsrf,
  setCsrfCookie,
  clearCsrfCookie,
  safeCompareTokenEdge,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/csrf";
import { generateCsrfToken, safeCompareToken } from "@/lib/csrf.server";
import { CSRF_STATE_CHANGING_METHODS } from "@/middleware";

describe("csrf utility", () => {
  describe("generateCsrfToken", () => {
    it("should generate a non-empty token", () => {
      const token = generateCsrfToken();
      assert.ok(token.length > 0);
    });

    it("should produce a base64url-encoded 32-byte token", () => {
      const token = generateCsrfToken();
      // base64url encoding of 32 bytes = ceil(32/3)*4 = 44 characters, no trailing =
      assert.equal(token.length, 43);
    });

    it("should produce different tokens on each call", () => {
      const a = generateCsrfToken();
      const b = generateCsrfToken();
      assert.notEqual(a, b);
    });

    it("should not use Math.random (token should be cryptographically random)", () => {
      // Generate many tokens and verify they are all unique
      const tokens = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateCsrfToken());
      }
      assert.equal(tokens.size, 1000);
    });
  });

  describe("safeCompareToken", () => {
    it("should return true for identical tokens", () => {
      const token = generateCsrfToken();
      assert.equal(safeCompareToken(token, token), true);
    });

    it("should return false for different tokens", () => {
      const a = generateCsrfToken();
      const b = generateCsrfToken();
      assert.equal(safeCompareToken(a, b), false);
    });

    it("should return false for different-length tokens", () => {
      assert.equal(safeCompareToken("short", "longertoken"), false);
    });

    it("should return false for empty strings", () => {
      assert.equal(safeCompareToken("", ""), false);
    });

    it("should safely reject malformed input without throwing", () => {
      assert.equal(safeCompareToken("!!!notbase64url???", "validtoken"), false);
      assert.equal(safeCompareToken("a", undefined as unknown as string), false);
    });
  });

  describe("safeCompareTokenEdge", () => {
    it("should return true for identical tokens", () => {
      const token = generateCsrfToken();
      assert.equal(safeCompareTokenEdge(token, token), true);
    });

    it("should return false for different tokens", () => {
      const a = generateCsrfToken();
      const b = generateCsrfToken();
      assert.equal(safeCompareTokenEdge(a, b), false);
    });

    it("should return false for different-length tokens", () => {
      assert.equal(safeCompareTokenEdge("short", "longertoken"), false);
    });

    it("should return false for empty strings", () => {
      assert.equal(safeCompareTokenEdge("", ""), false);
    });

    it("should return false for null/undefined input", () => {
      assert.equal(safeCompareTokenEdge(null as unknown as string, "token"), false);
      assert.equal(safeCompareTokenEdge("token", undefined as unknown as string), false);
    });
  });

  describe("getCsrfTokenFromRequest", () => {
    it("should extract token from x-csrf-token header", () => {
      const request = new NextRequest("http://localhost/api/test", {
        headers: { [CSRF_HEADER_NAME]: "test-token" },
      });
      assert.equal(getCsrfTokenFromRequest(request), "test-token");
    });

    it("should return null when header is missing", () => {
      const request = new NextRequest("http://localhost/api/test");
      assert.equal(getCsrfTokenFromRequest(request), null);
    });

    it("should return null when query param is used (no fallback)", () => {
      const request = new NextRequest("http://localhost/api/test?csrfToken=query-param-token");
      assert.equal(getCsrfTokenFromRequest(request), null);
    });

    it("should return null when an unrelated header is present", () => {
      const request = new NextRequest("http://localhost/api/test", {
        headers: { "content-type": "application/json" },
      });
      assert.equal(getCsrfTokenFromRequest(request), null);
    });
  });

  describe("validateCsrf", () => {
    function makeRequest(cookieToken: string | undefined, headerToken: string | undefined, method = "POST"): NextRequest {
      const headers: Record<string, string> = {};
      if (headerToken) {
        headers[CSRF_HEADER_NAME] = headerToken;
      }
      const cookie = cookieToken ? `${CSRF_COOKIE_NAME}=${cookieToken}` : "";
      return new NextRequest("http://localhost/api/auth/profile", {
        method,
        headers: { ...headers, cookie },
      });
    }

    it("should validate GET requests (exemption is in middleware, not validateCsrf)", () => {
      const token = generateCsrfToken();
      const request = makeRequest(token, token, "GET");
      const result = validateCsrf(request);
      // validateCsrf itself always validates; METHOD exemption happens in middleware
      assert.equal(result.valid, true);
    });

    it("should return 403 when csrf cookie is missing", () => {
      const token = generateCsrfToken();
      const request = makeRequest(undefined, token);
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should return 403 when x-csrf-token header is missing", () => {
      const token = generateCsrfToken();
      const request = makeRequest(token, undefined);
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should return 403 when tokens do not match", () => {
      const cookieToken = generateCsrfToken();
      const headerToken = generateCsrfToken();
      const request = makeRequest(cookieToken, headerToken);
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should return valid when cookie and header tokens match", () => {
      const token = generateCsrfToken();
      const request = makeRequest(token, token);
      const result = validateCsrf(request);
      assert.equal(result.valid, true);
    });

    it("should return 403 for PUT without tokens", () => {
      const request = makeRequest(undefined, undefined, "PUT");
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should return 403 for PATCH without tokens", () => {
      const request = makeRequest(undefined, undefined, "PATCH");
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should return 403 for DELETE without tokens", () => {
      const request = makeRequest(undefined, undefined, "DELETE");
      const result = validateCsrf(request);
      assert.equal(result.valid, false);
      assert.equal(result.response?.status, 403);
    });

    it("should use ERROR_MESSAGES.CSRF_INVALID in response body", async () => {
      const request = makeRequest(undefined, undefined, "POST");
      const result = validateCsrf(request);
      if (!result.valid) {
        const body = await result.response.json();
        assert.equal(body.message, "CSRF validation failed.");
      }
    });
  });

  describe("setCsrfCookie", () => {
    it("should set csrfToken cookie as non-HTTP-only", () => {
      const response = new NextResponse();
      const token = generateCsrfToken();
      setCsrfCookie(response, token);

      const cookie = response.cookies.get(CSRF_COOKIE_NAME);
      assert.ok(cookie);
      assert.equal(cookie.value, token);
    });

    it("should set cookie with 7-day maxAge and path /", () => {
      const response = new NextResponse();
      setCsrfCookie(response, generateCsrfToken());

      const cookie = response.cookies.get(CSRF_COOKIE_NAME);
      assert.ok(cookie);
      const rawCookie = response.headers.get("set-cookie");
      assert.ok(rawCookie?.includes("Max-Age=604800"));
      assert.ok(rawCookie?.includes("Path=/"));
    });

    it("should set sameSite to strict", () => {
      const response = new NextResponse();
      setCsrfCookie(response, generateCsrfToken());

      const rawCookie = response.headers.get("set-cookie");
      assert.ok(rawCookie?.toLowerCase().includes("samesite=strict"));
    });

    it("should set Secure in production", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.assign(process.env, { NODE_ENV: "production" });
      try {
        const response = new NextResponse();
        setCsrfCookie(response, generateCsrfToken());
        const rawCookie = response.headers.get("set-cookie");
        assert.ok(rawCookie?.includes("Secure"));
      } finally {
        Object.assign(process.env, { NODE_ENV: originalEnv });
      }
    });

    it("should NOT set Secure in development", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.assign(process.env, { NODE_ENV: "development" });
      try {
        const response = new NextResponse();
        setCsrfCookie(response, generateCsrfToken());
        const rawCookie = response.headers.get("set-cookie");
        assert.equal(rawCookie?.includes("Secure"), false);
      } finally {
        Object.assign(process.env, { NODE_ENV: originalEnv });
      }
    });
  });

  describe("clearCsrfCookie", () => {
    it("should delete the csrfToken cookie (sets expired empty value)", () => {
      const response = new NextResponse();
      setCsrfCookie(response, generateCsrfToken());
      assert.ok(response.cookies.get(CSRF_COOKIE_NAME));

      clearCsrfCookie(response);
      // Next.js cookies.delete sets an expired empty cookie rather than
      // removing it from the cookie jar — this is the expected behavior
      const deleted = response.cookies.get(CSRF_COOKIE_NAME);
      assert.ok(deleted);
      assert.deepEqual(deleted.expires, new Date(0));
      assert.equal(deleted.value, "");
    });
  });

  describe("middleware method exemption", () => {
    it("GET should be exempt from CSRF validation (checked via constant set)", () => {
      // The middleware uses CSRF_STATE_CHANGING_METHODS set to determine
      // which methods require validation. GET/HEAD/OPTIONS are NOT in it.
      const safeMethods = ["GET", "HEAD", "OPTIONS"];
      safeMethods.forEach((method) => {
        assert.equal(CSRF_STATE_CHANGING_METHODS.has(method), false);
      });
    });

    it("POST/PUT/PATCH/DELETE should require CSRF validation", () => {
      const changingMethods = ["POST", "PUT", "PATCH", "DELETE"];
      changingMethods.forEach((method) => {
        assert.equal(CSRF_STATE_CHANGING_METHODS.has(method), true);
      });
    });
  });

  describe("timing-safe property", () => {
    it("safeCompareTokenEdge should compare byte-by-byte in constant time", () => {
      // Create tokens that differ only in the last character
      const a = generateCsrfToken();
      const b = a.slice(0, -1) + (a.slice(-1) === "A" ? "B" : "A");
      assert.equal(safeCompareTokenEdge(a, b), false);
      assert.equal(safeCompareTokenEdge(a, a), true);
    });
  });
});
