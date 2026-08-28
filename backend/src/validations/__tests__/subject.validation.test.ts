import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  subjectIdParamSchema,
  createSubjectSchema,
  updateSubjectSchema,
  patchSubjectSchema,
  subjectListSchema,
} from "@/validations/subject.validation";

describe("Subject validation schemas (strict)", () => {
  describe("subjectIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = subjectIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = subjectIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = subjectIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createSubjectSchema", () => {
    it("should accept a valid subject", () => {
      const result = createSubjectSchema.safeParse({
        name: "Mathematics",
        code: "MATH",
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, true);
    });

    it("should accept optional description", () => {
      const result = createSubjectSchema.safeParse({
        name: "Mathematics",
        code: "MATH",
        description: "Core math",
      });
      assert.equal(result.success, true);
    });

    it("should reject missing name", () => {
      const result = createSubjectSchema.safeParse({ code: "MATH" });
      assert.equal(result.success, false);
    });

    it("should reject missing code", () => {
      const result = createSubjectSchema.safeParse({ name: "Math" });
      assert.equal(result.success, false);
    });

    it("should reject empty name", () => {
      const result = createSubjectSchema.safeParse({ name: "", code: "MATH" });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createSubjectSchema.safeParse({
        name: "Math",
        code: "MATH",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });

    it("should uppercase the code", () => {
      const result = createSubjectSchema.safeParse({ name: "Math", code: "math" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.code, "MATH");
    });
  });

  describe("updateSubjectSchema (PUT - full replacement)", () => {
    it("should accept all required fields", () => {
      const result = updateSubjectSchema.safeParse({
        name: "Updated Math",
        code: "MATH2",
        description: "Updated desc",
      });
      assert.equal(result.success, true);
    });

    it("should reject missing required fields", () => {
      const result = updateSubjectSchema.safeParse({ name: "Math" });
      assert.equal(result.success, false);
    });

    it("should accept null description", () => {
      const result = updateSubjectSchema.safeParse({
        name: "Math",
        code: "MATH",
        description: null,
      });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = updateSubjectSchema.safeParse({
        name: "Math",
        code: "MATH",
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchSubjectSchema (PATCH - partial update)", () => {
    it("should accept partial fields", () => {
      const result = patchSubjectSchema.safeParse({ name: "Updated" });
      assert.equal(result.success, true);
    });

    it("should accept empty object", () => {
      const result = patchSubjectSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = patchSubjectSchema.safeParse({ description: null });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = patchSubjectSchema.safeParse({ role: "ADMIN" });
      assert.equal(result.success, false);
    });
  });

  describe("subjectListSchema", () => {
    it("should parse with defaults", () => {
      const result = subjectListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept search string", () => {
      const result = subjectListSchema.safeParse({ search: "math" });
      assert.equal(result.success, true);
    });

    it("should accept isActive filter", () => {
      const result = subjectListSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, true);
    });

    it("should reject page < 1", () => {
      const result = subjectListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });
  });
});
