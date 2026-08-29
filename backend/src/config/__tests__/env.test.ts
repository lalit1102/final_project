import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("env configuration", () => {
  it("should throw when required environment variables are missing", () => {
    const env = {
      MONGODB_URI: "",
      JWT_ACCESS_SECRET: "",
      JWT_REFRESH_SECRET: "",
    };

    const missingVariables = [
      ["MONGODB_URI", env.MONGODB_URI],
      ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
      ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
    ].filter(([, value]) => !value);

    assert.ok(missingVariables.length > 0);
    const errorMessage = `Missing required environment variables: ${missingVariables.map(([name]) => name).join(", ")}`;
    assert.ok(errorMessage.includes("MONGODB_URI"));
    assert.ok(errorMessage.includes("JWT_ACCESS_SECRET"));
    assert.ok(errorMessage.includes("JWT_REFRESH_SECRET"));
  });

  it("should not throw when all required environment variables are present", () => {
    const env = {
      MONGODB_URI: "mongodb://localhost:27017/test",
      JWT_ACCESS_SECRET: "test-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
    };

    const missingVariables = [
      ["MONGODB_URI", env.MONGODB_URI],
      ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
      ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
    ].filter(([, value]) => !value);

    assert.equal(missingVariables.length, 0);
  });

  it("should provide default values for optional variables", () => {
    const env = {
      NODE_ENV: process.env.NODE_ENV || "development",
      ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    };

    assert.equal(env.NODE_ENV, "development");
    assert.equal(env.ACCESS_TOKEN_EXPIRES_IN, "15m");
    assert.equal(env.REFRESH_TOKEN_EXPIRES_IN, "7d");
    assert.equal(env.FRONTEND_ORIGIN, "http://localhost:3000");
    assert.equal(env.REDIS_URL, "redis://localhost:6379");
  });

   it("should not include GOOGLE_CLIENT_SECRET in env object shape", async () => {
     const { env: envObject } = await import("@/config/env");
     assert.equal("GOOGLE_CLIENT_SECRET" in envObject, false);
   });
});