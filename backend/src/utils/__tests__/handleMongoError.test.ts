import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { AppError, handleMongoError } from "@/utils/AppError";
import { ERROR_MESSAGES } from "@/constants/errorMessages";

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

  it("should use domain-neutral message by default (not user-specific)", () => {
    const mongoError = { code: 11000, keyPattern: { points: 1 }, keyValue: { points: 85 } };
    const result = handleMongoError(mongoError);

    assert.ok(result instanceof AppError);
    assert.equal(result.statusCode, 409);
    assert.equal(result.message, ERROR_MESSAGES.DUPLICATE_RESOURCE);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0], "A resource with this value already exists.");
  });

  it("should not expose raw MongoDB internals in error message", () => {
    const mongoError = { code: 11000, keyPattern: { email: 1 }, keyValue: { email: "test@example.com" }, errmsg: "E11000 duplicate key" };
    const result = handleMongoError(mongoError);

    assert.ok(result instanceof AppError);
    assert.equal(result.message, ERROR_MESSAGES.DUPLICATE_RESOURCE);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0], "A resource with this value already exists.");
  });

  it("should use custom duplicateMessage when provided", () => {
    const mongoError = { code: 11000, keyPattern: { studentId: 1, assignmentId: 1 }, keyValue: { studentId: "abc", assignmentId: "def" } };
    const result = handleMongoError(mongoError, ERROR_MESSAGES.GRADE_EXISTS);

    assert.ok(result instanceof AppError);
    assert.equal(result.statusCode, 409);
    assert.equal(result.message, ERROR_MESSAGES.GRADE_EXISTS);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0], ERROR_MESSAGES.GRADE_EXISTS);
  });

  it("should use custom duplicateMessage for assignment duplicates", () => {
    const mongoError = { code: 11000, keyPattern: { title: 1, classId: 1 }, keyValue: { title: "HW1", classId: "class1" } };
    const result = handleMongoError(mongoError, ERROR_MESSAGES.ASSIGNMENT_EXISTS);

    assert.ok(result instanceof AppError);
    assert.equal(result.message, ERROR_MESSAGES.ASSIGNMENT_EXISTS);
  });

  it("should use custom duplicateMessage for submission duplicates", () => {
    const mongoError = { code: 11000, keyPattern: { studentId: 1, assignmentId: 1 }, keyValue: { studentId: "s1", assignmentId: "a1" } };
    const result = handleMongoError(mongoError, ERROR_MESSAGES.SUBMISSION_EXISTS);

    assert.ok(result instanceof AppError);
    assert.equal(result.message, ERROR_MESSAGES.SUBMISSION_EXISTS);
  });

  it("should use custom duplicateMessage for enrollment duplicates", () => {
    const mongoError = { code: 11000, keyPattern: { studentId: 1, classId: 1 }, keyValue: { studentId: "s1", classId: "c1" } };
    const result = handleMongoError(mongoError, ERROR_MESSAGES.ENROLLMENT_EXISTS);

    assert.ok(result instanceof AppError);
    assert.equal(result.message, ERROR_MESSAGES.ENROLLMENT_EXISTS);
  });
});
