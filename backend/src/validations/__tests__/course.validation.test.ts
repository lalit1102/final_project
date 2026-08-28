import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  courseIdParamSchema,
  createCourseSchema,
  updateCourseSchema,
  patchCourseSchema,
  courseListSchema,
} from "@/validations/course.validation";

describe("Course validation schemas (strict)", () => {
  describe("courseIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = courseIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = courseIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = courseIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createCourseSchema", () => {
    it("should accept a valid course with teacherId", () => {
      const result = createCourseSchema.safeParse({
        name: "Math 101",
        code: "MATH101",
        subjectId: "607f1f77bcf86cd799439011",
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid course without teacherId", () => {
      const result = createCourseSchema.safeParse({
        name: "Math 101",
        code: "MATH101",
        subjectId: "607f1f77bcf86cd799439011",
      });
      assert.equal(result.success, true);
    });

    it("should reject missing name", () => {
      const result = createCourseSchema.safeParse({ code: "MATH101", subjectId: "607f1f77bcf86cd799439011" });
      assert.equal(result.success, false);
    });

    it("should reject missing code", () => {
      const result = createCourseSchema.safeParse({ name: "Math 101", subjectId: "607f1f77bcf86cd799439011" });
      assert.equal(result.success, false);
    });

    it("should reject missing subjectId", () => {
      const result = createCourseSchema.safeParse({ name: "Math 101", code: "MATH101" });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createCourseSchema.safeParse({
        name: "Math 101",
        code: "MATH101",
        subjectId: "607f1f77bcf86cd799439011",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid subjectId format", () => {
      const result = createCourseSchema.safeParse({
        name: "Math 101",
        code: "MATH101",
        subjectId: "invalid-id",
      });
      assert.equal(result.success, false);
    });

    it("should uppercase the code", () => {
      const result = createCourseSchema.safeParse({
        name: "Math 101",
        code: "math101",
        subjectId: "607f1f77bcf86cd799439011",
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.code, "MATH101");
    });
  });

  describe("updateCourseSchema (PUT - full replacement)", () => {
    it("should accept all required fields", () => {
      const result = updateCourseSchema.safeParse({
        name: "Updated Math",
        code: "MATH201",
        subjectId: "607f1f77bcf86cd799439011",
        description: "Updated desc",
      });
      assert.equal(result.success, true);
    });

    it("should reject missing required fields", () => {
      const result = updateCourseSchema.safeParse({ name: "Math" });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = updateCourseSchema.safeParse({
        name: "Math",
        code: "MATH",
        subjectId: "607f1f77bcf86cd799439011",
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchCourseSchema (PATCH - partial update)", () => {
    it("should accept partial fields", () => {
      const result = patchCourseSchema.safeParse({ name: "Updated" });
      assert.equal(result.success, true);
    });

    it("should accept empty object", () => {
      const result = patchCourseSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = patchCourseSchema.safeParse({ description: null });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = patchCourseSchema.safeParse({ role: "ADMIN" });
      assert.equal(result.success, false);
    });
  });

  describe("courseListSchema", () => {
    it("should parse with defaults", () => {
      const result = courseListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid subjectId", () => {
      const result = courseListSchema.safeParse({ subjectId: "607f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject invalid subjectId", () => {
      const result = courseListSchema.safeParse({ subjectId: "invalid" });
      assert.equal(result.success, false);
    });

    it("should accept search string", () => {
      const result = courseListSchema.safeParse({ search: "math" });
      assert.equal(result.success, true);
    });

    it("should reject page < 1", () => {
      const result = courseListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });
  });
});
