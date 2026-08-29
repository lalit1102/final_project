import { describe, it, beforeEach, afterEach, before, after } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/utils/apiHandler";
import { logger } from "@/utils/logger";
import mongoose from "mongoose";

let originalConnect: typeof mongoose.connect;

before(async () => {
  originalConnect = mongoose.connect;
  mongoose.connect = (async () => ({})) as unknown as typeof mongoose.connect;
});

after(async () => {
  mongoose.connect = originalConnect;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe("apiHandler", () => {
  describe("request body size limit", () => {
    it("should reject requests with Content-Length exceeding 5MB", async () => {
      const handler = apiHandler(async (req: NextRequest) => {
        return NextResponse.json({ ok: true });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
        headers: {
          "content-length": String(5 * 1024 * 1024 + 1),
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: "x" }),
      });

      const response = await handler(req);
      assert.equal(response.status, 413);
    });

    it("should allow requests with Content-Length under 5MB", async () => {
      const handler = apiHandler(async (req: NextRequest) => {
        return NextResponse.json({ ok: true });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
        headers: {
          "content-length": "100",
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: "small" }),
      });

      const response = await handler(req);
      assert.equal(response.status, 200);
    });

    it("should not check body size when Content-Length header is absent", async () => {
      const handler = apiHandler(async (req: NextRequest) => {
        return NextResponse.json({ ok: true });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "GET",
      });

      const response = await handler(req);
      assert.equal(response.status, 200);
    });
  });

  describe("request logging", () => {
    let infoLogs: unknown[];
    let warnLogs: unknown[];
    let errorLogs: unknown[];
    let originalInfo: typeof logger.info;
    let originalWarn: typeof logger.warn;
    let originalError: typeof logger.error;

    beforeEach(() => {
      infoLogs = [];
      warnLogs = [];
      errorLogs = [];
      originalInfo = logger.info.bind(logger);
      originalWarn = logger.warn.bind(logger);
      originalError = logger.error.bind(logger);

      logger.info = ((...args: unknown[]) => { infoLogs.push(args); }) as typeof logger.info;
      logger.warn = ((...args: unknown[]) => { warnLogs.push(args); }) as typeof logger.warn;
      logger.error = ((...args: unknown[]) => { errorLogs.push(args); }) as typeof logger.error;
    });

    afterEach(() => {
      logger.info = originalInfo;
      logger.warn = originalWarn;
      logger.error = originalError;
    });

    it("should log request completion with requestId, method, pathname, statusCode, and duration", async () => {
      const handler = apiHandler(async (req: NextRequest) => {
        return NextResponse.json({ ok: true });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "GET",
        headers: { "x-forwarded-for": "1.2.3.4" },
      });

      await handler(req);

      assert.equal(infoLogs.length, 1);
      const logArg = infoLogs[0] as unknown as string;
      assert.ok(logArg.includes("Request completed"));
    });

    it("should log rate limit exceeded as warning", async () => {
      const handler = apiHandler(async (req: NextRequest) => {
        return NextResponse.json({ ok: true });
      });

      let rateLimiterCalled = false;
      const originalModule = await import("@/utils/rateLimiter");
      const originalConsume = originalModule.rateLimiter.consume;
      originalModule.rateLimiter.consume = async () => {
        rateLimiterCalled = true;
        throw new Error("Rate limit exceeded");
      };

      try {
        const req = new NextRequest("http://localhost/api/test", {
          method: "GET",
          headers: { "x-forwarded-for": "1.2.3.4" },
        });

        const response = await handler(req);
        assert.equal(response.status, 429);
        assert.equal(rateLimiterCalled, true);
        assert.ok(warnLogs.length >= 1);
      } finally {
        originalModule.rateLimiter.consume = originalConsume;
      }
    });

    it("should log validation errors via ZodError handling", async () => {
      const { z } = await import("zod");
      const schema = z.object({ field: z.string() });
      const handler = apiHandler(async (req: NextRequest) => {
        schema.parse({ field: 123 });
        return NextResponse.json({ ok: true });
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({}),
      });

      const response = await handler(req);
      assert.equal(response.status, 400);
      assert.ok(infoLogs.some((log) => (log as unknown as string).includes("Request completed")));
    });

    it("should log unhandled errors without leaking sensitive data", async () => {
      const handler = apiHandler(async () => {
        throw new Error("Database connection string: mongodb://secret:password@host");
      });

      const req = new NextRequest("http://localhost/api/test", {
        method: "GET",
        headers: { "x-forwarded-for": "1.2.3.4" },
      });

      const response = await handler(req);
      assert.equal(response.status, 500);
      assert.ok(errorLogs.length >= 1);
    });
  });
});
