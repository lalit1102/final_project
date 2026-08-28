import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { AppError, handleMongoError } from "@/utils/AppError";

describe("handleMongoError", () => {
  it("should return AppError with 409 for duplicate key error (code 11000)", () => {
    const mongoError = { code: 11000, keyPattern: { email: 1 }, keyValue: { email: "test@example.com" } };
    const result = handleMongoError(mongoError);

    assert.ok(result instanceof AppError);
    assert.equal(result.statusCode, 409);
  });

  it("should return null for non-duplicate-key errors", () => {
    const genericError = { code: 28, message: "some other error" };
    const result = handleMongoError(genericError);

    assert.equal(result, null);
  });

  it("should return null for non-mongo errors", () => {
    const result = handleMongoError(new Error("regular error"));

    assert.equal(result, null);
  });

  it("should return null for null/undefined input", () => {
    assert.equal(handleMongoError(null), null);
    assert.equal(handleMongoError(undefined), null);
  });

  it("should not expose raw MongoDB internals in error message", () => {
    const mongoError = { code: 11000, keyPattern: { email: 1 }, keyValue: { email: "test@example.com" }, errmsg: "E11000 duplicate key" };
    const result = handleMongoError(mongoError);

    assert.ok(result instanceof AppError);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0], "A user with this email already exists.");
  });
});
