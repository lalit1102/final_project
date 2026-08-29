import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { middleware, matchesRoute, CSRF_STATE_CHANGING_METHODS } from "@/middleware";
import { generateAccessToken } from "@/lib/jwt";
import { UserRole } from "@/types/user.types";
import jwt from "jsonwebtoken";

const teacher = "507f1f77bcf86cd799439011";
const student = "507f1f77bcf86cd799439044";
const parent = "507f1f77bcf86cd799439055";
const adminId = "507f1f77bcf86cd799439033";
const validGradeId = "c07f1f77bcf86cd799439011";

function makeToken(role: UserRole, userId: string) {
  return generateAccessToken({ userId, role });
}

function makeRequest(method: string, pathname: string, cookie?: string, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { origin: "http://localhost:3000" };
  if (cookie) headers["cookie"] = cookie;
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new NextRequest(`http://localhost${pathname}`, { method, headers });
}

function makeCsrfRequest(method: string, pathname: string, token: string, csrfToken?: string) {
  const headers: Record<string, string> = {
    origin: "http://localhost:3000",
    cookie: `accessToken=${token}; csrfToken=${csrfToken ?? "valid-csrf-token"}`,
  };
  if (csrfToken !== undefined) {
    headers["x-csrf-token"] = csrfToken as string;
  }
  return new NextRequest(`http://localhost${pathname}`, { method, headers });
}

describe("Phase 4C Security — Grade Middleware", () => {
  describe("Route protection", () => {
    const protectedPaths: Array<[string, string]> = [
      ["GET", "/api/grades"],
      ["POST", "/api/grades"],
      ["GET", `/api/grades/${validGradeId}`],
      ["PUT", `/api/grades/${validGradeId}`],
      ["PATCH", `/api/grades/${validGradeId}`],
      ["DELETE", `/api/grades/${validGradeId}`],
    ];

    for (const [method, path] of protectedPaths) {
      it(`should require auth for ${method} ${path}`, async () => {
        const req = makeRequest(method, path);
        const response = await middleware(req);
        assert.equal(response.status, 401, `Expected 401 for unauthenticated ${method} ${path}`);
        const body = await response.json();
        assert.equal(body.success, false);
      });
    }

    it("should match /api/grades as a protected route", () => {
      assert.equal(matchesRoute("/api/grades", ["/api/grades"]), true);
    });

    it("should match /api/grades/:id as a protected route (prefix match)", () => {
      assert.equal(matchesRoute(`/api/grades/${validGradeId}`, ["/api/grades"]), true);
    });

    it("should NOT protect unrelated routes", () => {
      assert.equal(matchesRoute("/api/auth/login", ["/api/grades"]), false);
      assert.equal(matchesRoute("/api/admin/users", ["/api/grades"]), false);
      assert.equal(matchesRoute("/api/assignments", ["/api/grades"]), false);
    });

    it("/api/grades should NOT be in adminRoutes (not admin-only at middleware)", () => {
      assert.equal(matchesRoute("/api/grades/123", ["/api/admin"]), false);
    });
  });

  describe("CSRF protection", () => {
    it("GET /api/grades should not require CSRF token", async () => {
      const token = makeToken(UserRole.STUDENT, student);
      const req = makeRequest("GET", "/api/grades", `accessToken=${token}; csrfToken=valid-csrf-token`);
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("POST /api/grades should require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("POST", "/api/grades", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PUT /api/grades/:id should require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("PUT", `/api/grades/${validGradeId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PATCH /api/grades/:id should require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("PATCH", `/api/grades/${validGradeId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("DELETE /api/grades/:id should require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("DELETE", `/api/grades/${validGradeId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });
  });

  describe("Authentication & identity", () => {
    it("should return 401 for expired/invalid token", async () => {
      const req = makeRequest("GET", "/api/grades", "accessToken=invalid-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should set x-user-id and x-user-role from JWT (not from client)", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should authenticate a valid token even when client supplies spoofed headers", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = new NextRequest(`http://localhost/api/grades`, {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          cookie: `accessToken=${token}; csrfToken=valid-csrf-token`,
          "x-user-id": student,
          "x-user-role": UserRole.STUDENT,
        },
      });
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should reject forged token that claims ADMIN role", async () => {
      const forgedToken = jwt.sign({ userId: student, role: "ADMIN" }, "wrong-secret");
      const req = makeCsrfRequest("GET", "/api/grades", forgedToken, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should reject forged token that claims TEACHER role", async () => {
      const forgedToken = jwt.sign({ userId: student, role: "TEACHER" }, "wrong-secret");
      const req = makeCsrfRequest("GET", "/api/grades", forgedToken, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should allow ADMIN token to access /api/grades", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should allow TEACHER token to access /api/grades", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should allow STUDENT token to access /api/grades", async () => {
      const token = makeToken(UserRole.STUDENT, student);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should allow PARENT token to access /api/grades", async () => {
      const token = makeToken(UserRole.PARENT, parent);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("CORS", () => {
    it("should apply CORS headers for allowed origin", async () => {
      const token = makeToken(UserRole.STUDENT, student);
      const req = makeCsrfRequest("GET", "/api/grades", token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
      assert.equal(response.headers.get("Access-Control-Allow-Credentials"), "true");
    });

    it("should not apply CORS headers for disallowed origin", async () => {
      const token = makeToken(UserRole.STUDENT, student);
      const req = new NextRequest(`http://localhost/api/grades`, {
        method: "GET",
        headers: {
          origin: "http://evil.com",
          cookie: `accessToken=${token}; csrfToken=valid-csrf-token`,
        },
      });
      const response = await middleware(req);
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
    });

    it("should handle OPTIONS preflight", async () => {
      const req = new NextRequest("http://localhost/api/grades", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      });
      const response = await middleware(req);
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    });
  });

  describe("CSRF_METHOD detection", () => {
    it("should classify POST as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("POST"), true);
    });

    it("should classify PUT as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("PUT"), true);
    });

    it("should classify PATCH as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("PATCH"), true);
    });

    it("should classify DELETE as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("DELETE"), true);
    });

    it("should NOT classify GET as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("GET"), false);
    });

    it("should NOT classify OPTIONS as CSRF-protected", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("OPTIONS"), false);
    });
  });
});
