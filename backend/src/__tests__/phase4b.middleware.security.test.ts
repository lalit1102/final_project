import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { middleware, matchesRoute, CSRF_STATE_CHANGING_METHODS } from "@/middleware";
import { generateAccessToken } from "@/lib/jwt";
import { UserRole } from "@/types/user.types";
import jwt from "jsonwebtoken";

const realTeacher = "507f1f77bcf86cd799439011";
const attackerId = "507f1f77bcf86cd799439022";
const adminId = "507f1f77bcf86cd799439033";
const studentId = "507f1f77bcf86cd799439044";
const parentId = "507f1f77bcf86cd799439055";
const validSubmissionId = "b07f1f77bcf86cd799439011";

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

describe("Phase 4B Security — Submission Middleware", () => {
  describe("Route protection", () => {
    const protectedPaths: Array<[string, string]> = [
      ["GET", "/api/submissions"],
      ["POST", "/api/submissions"],
      ["GET", `/api/submissions/${validSubmissionId}`],
      ["PUT", `/api/submissions/${validSubmissionId}`],
      ["PATCH", `/api/submissions/${validSubmissionId}`],
      ["DELETE", `/api/submissions/${validSubmissionId}`],
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

    it("should match /api/submissions as a protected route", () => {
      assert.equal(matchesRoute("/api/submissions", ["/api/submissions"]), true);
    });

    it("should match /api/submissions/:id as a protected route (prefix match)", () => {
      assert.equal(matchesRoute(`/api/submissions/${validSubmissionId}`, ["/api/submissions"]), true);
    });

    it("should NOT protect unrelated routes", () => {
      assert.equal(matchesRoute("/api/auth/login", ["/api/submissions"]), false);
      assert.equal(matchesRoute("/api/admin/users", ["/api/submissions"]), false);
      assert.equal(matchesRoute("/api/assignments", ["/api/submissions"]), false);
    });

    it("/api/submissions should NOT be in adminRoutes (not admin-only at middleware)", () => {
      assert.equal(matchesRoute("/api/submissions/123", ["/api/admin"]), false);
    });
  });

  describe("CSRF protection", () => {
    it("GET /api/submissions should not require CSRF token", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("GET /api/submissions without CSRF cookie passes (GET is exempt)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/submissions", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("POST /api/submissions should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("POST", "/api/submissions", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("POST /api/submissions with CSRF mismatch → 403", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const headers: Record<string, string> = {
        origin: "http://localhost:3000",
        cookie: `accessToken=${token}; csrfToken=valid-csrf-token`,
        "x-csrf-token": "different-csrf-token",
      };
      const req = new NextRequest("http://localhost/api/submissions", { method: "POST", headers });
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PUT /api/submissions/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("PUT", `/api/submissions/${validSubmissionId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PATCH /api/submissions/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("PATCH", `/api/submissions/${validSubmissionId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("DELETE /api/submissions/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("DELETE", `/api/submissions/${validSubmissionId}`, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });
  });

  describe("RBAC — All roles authenticated at middleware (service enforces RBAC)", () => {
    it("STUDENT token passes middleware authentication", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("PARENT token passes middleware authentication", async () => {
      const token = makeToken(UserRole.PARENT, parentId);
      const req = makeCsrfRequest("GET", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("TEACHER token passes middleware authentication", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("GET", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("ADMIN token passes middleware authentication", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("GET", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("STUDENT token passes middleware for GET /api/submissions/:id", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", `/api/submissions/${validSubmissionId}`, token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("STUDENT token passes middleware for POST /api/submissions (CSRF present)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("POST", "/api/submissions", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("Header spoof protection", () => {
    it("should authenticate a valid STUDENT token even when client supplies spoofed headers", async () => {
      const realToken = makeToken(UserRole.STUDENT, studentId);

      const req = makeRequest("GET", "/api/submissions", `accessToken=${realToken}`, {
        "x-user-id": attackerId,
        "x-user-role": UserRole.ADMIN,
      });

      const response = await middleware(req);
      assert.equal(response.status, 200, "Valid token must be authenticated regardless of spoofed headers");
    });

    it("should reject forged token that claims ADMIN role", async () => {
      const forgedToken = jwt.sign(
        { userId: studentId, role: UserRole.ADMIN, type: "access" },
        "wrong_secret",
        { expiresIn: "15m" },
      );

      const req = makeRequest("GET", "/api/submissions", `accessToken=${forgedToken}`);
      const response = await middleware(req);
      assert.equal(response.status, 401, "Forged ADMIN token must be rejected");
    });

    it("should reject forged token that claims TEACHER role", async () => {
      const forgedToken = jwt.sign(
        { userId: studentId, role: UserRole.TEACHER, type: "access" },
        "wrong_secret",
        { expiresIn: "15m" },
      );

      const req = makeRequest("GET", "/api/submissions", `accessToken=${forgedToken}`);
      const response = await middleware(req);
      assert.equal(response.status, 401, "Forged TEACHER token must be rejected");
    });
  });

  describe("Query parameter bypass protection", () => {
    it("should allow ADMIN token to access /api/submissions?studentId=...", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("GET", "/api/submissions?studentId=" + studentId, token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should allow STUDENT token to access /api/submissions?studentId=... (params passed to service)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/submissions?studentId=" + attackerId, token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("should allow TEACHER token to access /api/submissions?assignmentId=...", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("GET", "/api/submissions?assignmentId=a07f1f77bcf86cd799439011", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("CSRF_STATE_CHANGING_METHODS coverage", () => {
    it("should include POST in CSRF-protected methods", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("POST"), true);
    });

    it("should include PUT in CSRF-protected methods", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("PUT"), true);
    });

    it("should include PATCH in CSRF-protected methods", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("PATCH"), true);
    });

    it("should include DELETE in CSRF-protected methods", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("DELETE"), true);
    });

    it("should NOT include GET in CSRF-protected methods", () => {
      assert.equal(CSRF_STATE_CHANGING_METHODS.has("GET"), false);
    });
  });
});
