import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { middleware, matchesRoute } from "@/middleware";
import { generateAccessToken } from "@/lib/jwt";
import { UserRole } from "@/types/user.types";
import jwt from "jsonwebtoken";

const realTeacher = "507f1f77bcf86cd799439011";
const attackerId = "507f1f77bcf86cd799439022";

function makeToken(role: UserRole, userId: string) {
  return generateAccessToken({ userId, role });
}

function makeRequest(method: string, pathname: string, cookie?: string, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = { origin: "http://localhost:3000" };
  if (cookie) headers["cookie"] = cookie;
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new NextRequest(`http://localhost${pathname}`, { method, headers });
}

describe("Phase 2E Middleware Security — Route Protection", () => {
  describe("Protected route matching (including descendants)", () => {
    const protectedPaths = [
      ["/api/subjects", "GET"],
      ["/api/subjects/607f1f77bcf86cd799439011", "GET"],
      ["/api/courses", "POST"],
      ["/api/courses/707f1f77bcf86cd799439011", "GET"],
      ["/api/courses/707f1f77bcf86cd799439011", "PUT"],
      ["/api/courses/707f1f77bcf86cd799439011", "PATCH"],
      ["/api/courses/707f1f77bcf86cd799439011", "DELETE"],
      ["/api/classes", "GET"],
      ["/api/classes/807f1f77bcf86cd799439011", "GET"],
      ["/api/classes/807f1f77bcf86cd799439011", "PUT"],
      ["/api/classes/807f1f77bcf86cd799439011", "PATCH"],
      ["/api/classes/807f1f77bcf86cd799439011", "DELETE"],
    ];

    for (const [path, method] of protectedPaths) {
      it(`should require auth for ${method} ${path}`, async () => {
        const req = makeRequest(method, path);
        const response = await middleware(req);
        assert.equal(
          response.status,
          401,
          `Expected 401 for unauthenticated ${method} ${path}, got ${response.status}`,
        );
        const body = await response.json();
        assert.equal(body.success, false);
      });
    }

    it("should require auth + CSRF token for POST /api/classes", async () => {
      const req = makeRequest("POST", "/api/classes", undefined, {
        "content-type": "application/json",
        "x-csrf-token": "bogus",
      });
      const response = await middleware(req);
      assert.equal(response.status, 401, "Expected 401 when no access token");
    });
  });

  describe("Route matcher correctness", () => {
    const protectedRoutes = ["/api/subjects", "/api/courses", "/api/classes"];

    for (const route of protectedRoutes) {
      it(`${route} should match its descendant ${route}/:id`, () => {
        assert.equal(matchesRoute(`${route}/abc123`, protectedRoutes), true);
      });
    }

    it("should NOT protect unrelated routes", () => {
      assert.equal(matchesRoute("/api/auth/login", ["/api/subjects", "/api/courses", "/api/classes"]), false);
      assert.equal(matchesRoute("/api/admin/users", ["/api/subjects", "/api/courses", "/api/classes"]), false);
    });
  });

  describe("Token validation", () => {
    it("should reject requests with no access token", async () => {
      const req = makeRequest("GET", "/api/classes");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should reject an invalid (forged) token", async () => {
      const req = makeRequest("GET", "/api/classes", "accessToken=forged.invalid.token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should reject a token signed with the wrong secret", async () => {
      const forgedToken = jwt.sign(
        { userId: realTeacher, role: UserRole.TEACHER, type: "access" },
        "wrong_secret",
        { expiresIn: "15m" },
      );

      const req = makeRequest("GET", "/api/classes", `accessToken=${forgedToken}`);
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should forward STUDENT identity from token (middleware authenticates; RBAC enforced in service)", async () => {
      const token = makeToken(UserRole.STUDENT, "507f1f77bcf86cd799439044");
      const req = makeRequest("GET", "/api/subjects", `accessToken=${token}`);
      const response = await middleware(req);
      assert.equal(response.status, 200, "Middleware should authenticate the valid STUDENT token");
    });
  });

  describe("Header spoof protection (identity comes from verified JWT, not client headers)", () => {
    it("should authenticate a valid TEACHER token even when client supplies spoofed headers", async () => {
      const realToken = makeToken(UserRole.TEACHER, realTeacher);

      const req = makeRequest("GET", "/api/subjects", `accessToken=${realToken}`, {
        "x-user-id": attackerId,
        "x-user-role": UserRole.ADMIN,
      });

      const response = await middleware(req);
      assert.equal(response.status, 200, "Valid token must be authenticated regardless of spoofed headers");
    });

    it("should reject forged token that claims ADMIN role", async () => {
      const forgedToken = jwt.sign(
        { userId: attackerId, role: UserRole.ADMIN, type: "access" },
        "wrong_secret",
        { expiresIn: "15m" },
      );

      const req = makeRequest("GET", "/api/admin/users", `accessToken=${forgedToken}`);
      const response = await middleware(req);
      assert.equal(response.status, 401, "Forged ADMIN token must be rejected");
    });

    it("should block TEACHER from /api/admin routes (admin route matcher)", async () => {
      const token = makeToken(UserRole.TEACHER, realTeacher);
      const req = makeRequest("GET", "/api/admin/users", `accessToken=${token}`);
      const response = await middleware(req);
      assert.equal(response.status, 403, "TEACHER must be blocked from admin routes");
    });
  });
});
