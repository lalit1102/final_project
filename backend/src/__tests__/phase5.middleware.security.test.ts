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

const validCourseId = "707f1f77bcf86cd799439011";
const validModuleId = "807f1f77bcf86cd799439011";
const validLessonId = "907f1f77bcf86cd799439011";
const validMaterialId = "107f1f77bcf86cd799439011";

const modulesBase = `/api/courses/${validCourseId}/modules`;
const moduleItem = `${modulesBase}/${validModuleId}`;
const lessonsBase = `${moduleItem}/lessons`;
const lessonItem = `${lessonsBase}/${validLessonId}`;
const materialsBase = `${lessonItem}/materials`;
const materialItem = `${materialsBase}/${validMaterialId}`;

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

describe("Phase 5 Security — Course Materials Middleware", () => {
  describe("Route protection (unauthenticated → 401)", () => {
    const protectedPaths: Array<[string, string]> = [
      ["GET", modulesBase],
      ["POST", modulesBase],
      ["GET", moduleItem],
      ["PUT", moduleItem],
      ["PATCH", moduleItem],
      ["DELETE", moduleItem],
      ["GET", lessonsBase],
      ["POST", lessonsBase],
      ["GET", lessonItem],
      ["PUT", lessonItem],
      ["PATCH", lessonItem],
      ["DELETE", lessonItem],
      ["GET", materialsBase],
      ["POST", materialsBase],
      ["GET", materialItem],
      ["PUT", materialItem],
      ["PATCH", materialItem],
      ["DELETE", materialItem],
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
  });

  describe("Route prefix matching", () => {
    it("should match /api/courses/[courseId]/modules as a protected route via /api/courses prefix", () => {
      assert.equal(matchesRoute(modulesBase, ["/api/courses"]), true);
    });

    it("should match /api/courses/[courseId]/modules/[moduleId] as a protected route", () => {
      assert.equal(matchesRoute(moduleItem, ["/api/courses"]), true);
    });

    it("should match nested lessons route as protected", () => {
      assert.equal(matchesRoute(lessonsBase, ["/api/courses"]), true);
    });

    it("should match nested lesson item route as protected", () => {
      assert.equal(matchesRoute(lessonItem, ["/api/courses"]), true);
    });

    it("should match nested materials route as protected", () => {
      assert.equal(matchesRoute(materialsBase, ["/api/courses"]), true);
    });

    it("should match nested material item route as protected", () => {
      assert.equal(matchesRoute(materialItem, ["/api/courses"]), true);
    });

    it("should NOT match /api/auth/login as a protected route", () => {
      assert.equal(matchesRoute("/api/auth/login", ["/api/courses"]), false);
    });

    it("should NOT match /api/subjects as a protected route via /api/courses", () => {
      assert.equal(matchesRoute("/api/subjects", ["/api/courses"]), false);
    });
  });

  describe("Authenticated requests (TEACHER)", () => {
    it("GET " + modulesBase + " should pass middleware for TEACHER", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", modulesBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("POST " + modulesBase + " should pass middleware for TEACHER with valid CSRF", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("POST", modulesBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("GET " + lessonsBase + " should pass middleware for TEACHER", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", lessonsBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("GET " + materialsBase + " should pass middleware for TEACHER", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", materialsBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("Authenticated requests (ADMIN)", () => {
    it("GET " + modulesBase + " should pass middleware for ADMIN", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("GET", modulesBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });

    it("DELETE " + materialItem + " should pass middleware for ADMIN with valid CSRF", async () => {
      const token = makeToken(UserRole.ADMIN, adminId);
      const req = makeCsrfRequest("DELETE", materialItem, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("Authenticated requests (STUDENT)", () => {
    it("GET " + modulesBase + " should pass middleware for STUDENT", async () => {
      const token = makeToken(UserRole.STUDENT, student);
      const req = makeCsrfRequest("GET", modulesBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("Authenticated requests (PARENT)", () => {
    it("GET " + materialsBase + " should pass middleware for PARENT", async () => {
      const token = makeToken(UserRole.PARENT, parent);
      const req = makeCsrfRequest("GET", materialsBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("CSRF protection", () => {
    const csrfProtectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

    for (const method of csrfProtectedMethods) {
      it(`${method} ${modulesBase} should require CSRF token`, async () => {
        const token = makeToken(UserRole.TEACHER, teacher);
        const req = makeCsrfRequest(method, modulesBase, token, undefined);
        const response = await middleware(req);
        assert.equal(response.status, 403);
      });

      it(`${method} ${moduleItem} should require CSRF token`, async () => {
        const token = makeToken(UserRole.TEACHER, teacher);
        const req = makeCsrfRequest(method, moduleItem, token, undefined);
        const response = await middleware(req);
        assert.equal(response.status, 403);
      });

      it(`${method} ${lessonsBase} should require CSRF token`, async () => {
        const token = makeToken(UserRole.TEACHER, teacher);
        const req = makeCsrfRequest(method, lessonsBase, token, undefined);
        const response = await middleware(req);
        assert.equal(response.status, 403);
      });

      it(`${method} ${materialItem} should require CSRF token`, async () => {
        const token = makeToken(UserRole.TEACHER, teacher);
        const req = makeCsrfRequest(method, materialItem, token, undefined);
        const response = await middleware(req);
        assert.equal(response.status, 403);
      });
    }

    it("GET should NOT require CSRF token", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", modulesBase, token, undefined);
      const response = await middleware(req);
      assert.equal(response.status, 200);
    });
  });

  describe("Authentication & token validation", () => {
    it("should return 401 for invalid token", async () => {
      const req = makeRequest("GET", modulesBase, "accessToken=invalid-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should return 401 for expired/invalid token on POST", async () => {
      const req = makeRequest("POST", modulesBase, "accessToken=invalid-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should reject forged token that claims ADMIN role", async () => {
      const forgedToken = jwt.sign({ userId: student, role: "ADMIN" }, "wrong-secret");
      const req = makeCsrfRequest("GET", modulesBase, forgedToken, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should reject forged token that claims TEACHER role", async () => {
      const forgedToken = jwt.sign({ userId: student, role: "TEACHER" }, "wrong-secret");
      const req = makeCsrfRequest("GET", modulesBase, forgedToken, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.status, 401);
    });

    it("should set x-user-id and x-user-role from JWT, not from client headers", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = new NextRequest(`http://localhost${modulesBase}`, {
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
  });

  describe("CORS", () => {
    it("should apply CORS headers for allowed origin on Phase 5 routes", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = makeCsrfRequest("GET", modulesBase, token, "valid-csrf-token");
      const response = await middleware(req);
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
      assert.equal(response.headers.get("Access-Control-Allow-Credentials"), "true");
    });

    it("should not apply CORS headers for disallowed origin", async () => {
      const token = makeToken(UserRole.TEACHER, teacher);
      const req = new NextRequest(`http://localhost${modulesBase}`, {
        method: "GET",
        headers: {
          origin: "http://evil.com",
          cookie: `accessToken=${token}; csrfToken=valid-csrf-token`,
        },
      });
      const response = await middleware(req);
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
    });

    it("should handle OPTIONS preflight for Phase 5 routes", async () => {
      const req = new NextRequest(`http://localhost${modulesBase}`, {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      });
      const response = await middleware(req);
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    });

    it("should handle OPTIONS preflight for nested material routes", async () => {
      const req = new NextRequest(`http://localhost${materialItem}`, {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      });
      const response = await middleware(req);
      assert.equal(response.status, 204);
    });
  });

  describe("CSRF_METHOD detection (inherited global set)", () => {
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
  });
});
