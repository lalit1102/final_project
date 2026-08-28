import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { middleware, matchesRoute, CSRF_STATE_CHANGING_METHODS } from "@/middleware";
import { generateAccessToken } from "@/lib/jwt";
import { UserRole } from "@/types/user.types";
import jwt from "jsonwebtoken";

const realTeacher = "507f1f77bcf86cd799439011";
const teacherB = "507f1f77bcf86cd799439022";
const adminId = "507f1f77bcf86cd799439033";
const studentId = "507f1f77bcf86cd799439044";
const parentId = "507f1f77bcf86cd799439055";

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

describe("Phase 3 Security — Enrollment Middleware", () => {
  describe("Route protection", () => {
    it("should match /api/enrollments as a protected route", () => {
      assert.equal(matchesRoute("/api/enrollments", ["/api/enrollments"]), true);
    });

    it("should match /api/enrollments/:id as a protected route (prefix match)", () => {
      assert.equal(matchesRoute("/api/enrollments/907f1f77bcf86cd799439011", ["/api/enrollments"]), true);
    });

    it("should require auth for GET /api/enrollments (no token → 401)", async () => {
      const req = makeRequest("GET", "/api/enrollments");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should require auth for POST /api/enrollments (no token → 401)", async () => {
      const req = makeRequest("POST", "/api/enrollments");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should require auth for GET /api/enrollments/:id (no token → 401)", async () => {
      const req = makeRequest("GET", "/api/enrollments/907f1f77bcf86cd799439011");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should require auth for DELETE /api/enrollments/:id (no token → 401)", async () => {
      const req = makeRequest("DELETE", "/api/enrollments/907f1f77bcf86cd799439011");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });
  });

  describe("CSRF protection", () => {
    it("GET /api/enrollments should not require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("GET /api/enrollments without CSRF cookie passes (GET is exempt)", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("POST /api/enrollments should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("POST", "/api/enrollments", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("POST /api/enrollments with CSRF mismatch → 403", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const headers: Record<string, string> = {
        origin: "http://localhost:3000",
        cookie: `accessToken=${token}; csrfToken=valid-csrf-token`,
        "x-csrf-token": "different-csrf-token",
      };
      const req = new NextRequest(`http://localhost/api/enrollments`, { method: "POST", headers });
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PUT /api/enrollments/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("PUT", "/api/enrollments/907f1f77bcf86cd799439011", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PATCH /api/enrollments/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("PATCH", "/api/enrollments/907f1f77bcf86cd799439011", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("DELETE /api/enrollments/:id should require CSRF token (missing → 403)", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("DELETE", "/api/enrollments/907f1f77bcf86cd799439011", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });
  });

  describe("RBAC — STUDENT and PARENT are authenticated (service enforces RBAC)", () => {
    it("STUDENT token passes middleware authentication (not blocked at middleware)", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("PARENT token passes middleware authentication (not blocked at middleware)", async () => {
      const token = makeToken(UserRole.PARENT, parentId);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("STUDENT token passes middleware for GET /api/enrollments/:id", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("GET", "/api/enrollments/907f1f77bcf86cd799439011", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("TEACHER token passes middleware authentication", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("ADMIN token passes middleware authentication", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("GET", "/api/enrollments", token, "csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("RBAC — STUDENT/PARENT blocked from write operations at middleware", () => {
    it("STUDENT cannot POST to /api/enrollments — CSRF blocks without token", async () => {
      const token = makeToken(UserRole.STUDENT, studentId);
      const req = makeCsrfRequest("POST", "/api/enrollments", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });

    it("PARENT cannot POST to /api/enrollments — CSRF blocks without token", async () => {
      const token = makeToken(UserRole.PARENT, parentId);
      const req = makeCsrfRequest("POST", "/api/enrollments", token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 403);
    });
  });

  describe("Middleware route matching is not admin-only", () => {
    it("/api/enrollments should NOT be in adminRoutes (not admin-only)", () => {
      assert.equal(matchesRoute("/api/enrollments/123", ["/api/admin"]), false);
    });

    it("/api/enrollments should NOT match admin route prefix", () => {
      assert.equal(matchesRoute("/api/enrollments", ["/api/admin"]), false);
    });
  });

  describe("Header spoof protection", () => {
    it("should authenticate a valid STUDENT token even when client supplies spoofed headers", async () => {
      const realToken = makeToken(UserRole.STUDENT, studentId);

      const req = makeRequest("GET", "/api/enrollments", `accessToken=${realToken}`, {
        "x-user-id": teacherB,
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

      const req = makeRequest("GET", "/api/enrollments", `accessToken=${forgedToken}`);
      const response = await middleware(req);
      assert.equal(response.status, 401, "Forged ADMIN token must be rejected");
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
