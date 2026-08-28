import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const ALLOWED_ORIGIN = "http://localhost:3000";
const UNKNOWN_ORIGIN = "http://evil.example.com";

function makeRequest(method: string, pathname: string, origin: string | null, cookie?: string) {
  const headers: Record<string, string> = {};
  if (origin !== null) headers["origin"] = origin;
  if (cookie) headers["cookie"] = cookie;
  return new NextRequest(`http://localhost${pathname}`, { method, headers });
}

describe("CORS origin allowlist", () => {
  it("should set Access-Control-Allow-Origin to configured origin for allowed origin", async () => {
    const req = makeRequest("GET", "/api/admin/users", ALLOWED_ORIGIN);
    const response = await middleware(req);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN);
    assert.equal(response.headers.get("Access-Control-Allow-Credentials"), "true");
  });

  it("should NOT set Access-Control-Allow-Origin for unknown origin", async () => {
    const req = makeRequest("GET", "/api/admin/users", UNKNOWN_ORIGIN);
    const response = await middleware(req);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  });

  it("should not reflect arbitrary origin in error responses", async () => {
    const req = makeRequest("POST", "/api/auth/change-password", UNKNOWN_ORIGIN);
    const response = await middleware(req);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  });

  it("should not reflect arbitrary origin in CSRF error responses", async () => {
    const req = makeRequest("POST", "/api/admin/users", UNKNOWN_ORIGIN, "accessToken=fake-token");
    const response = await middleware(req);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  });
});
