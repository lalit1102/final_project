import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  moduleIdParamSchema,
  moduleCourseIdParamSchema,
  createModuleSchema,
  updateModuleSchema,
  patchModuleSchema,
  moduleListSchema,
} from "@/validations/module.validation";

describe("Module validation schemas (strict)", () => {
  describe("moduleIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = moduleIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = moduleIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = moduleIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("moduleCourseIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = moduleCourseIdParamSchema.safeParse({ courseId: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = moduleCourseIdParamSchema.safeParse({ courseId: "invalid" });
      assert.equal(result.success, false);
    });
  });

  describe("createModuleSchema", () => {
    it("should accept a valid module", () => {
      const result = createModuleSchema.safeParse({
        title: "Week 1: Introduction",
        description: "Intro to the subject",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid module without description", () => {
      const result = createModuleSchema.safeParse({
        title: "Week 1: Introduction",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = createModuleSchema.safeParse({ description: "desc", order: 0 });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = createModuleSchema.safeParse({ title: "Module" });
      assert.equal(result.success, false);
    });

    it("should reject empty title", () => {
      const result = createModuleSchema.safeParse({ title: "", order: 0 });
      assert.equal(result.success, false);
    });

    it("should reject title exceeding 200 characters", () => {
      const result = createModuleSchema.safeParse({
        title: "x".repeat(201),
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject description exceeding 1000 characters", () => {
      const result = createModuleSchema.safeParse({
        title: "Module",
        description: "x".repeat(1001),
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject order as a negative number", () => {
      const result = createModuleSchema.safeParse({ title: "Module", order: -1 });
      assert.equal(result.success, false);
    });

    it("should reject order as a non-integer", () => {
      const result = createModuleSchema.safeParse({ title: "Module", order: 1.5 });
      assert.equal(result.success, false);
    });

    it("should reject order as a string", () => {
      const result = createModuleSchema.safeParse({ title: "Module", order: "0" });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createModuleSchema.safeParse({
        title: "Module",
        order: 0,
        status: "DRAFT",
      });
      assert.equal(result.success, false);
    });

    it("should reject teacherId field", () => {
      const result = createModuleSchema.safeParse({
        title: "Module",
        order: 0,
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject courseId field (server-controlled from path)", () => {
      const result = createModuleSchema.safeParse({
        title: "Module",
        order: 0,
        courseId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should accept order = 0", () => {
      const result = createModuleSchema.safeParse({ title: "Module", order: 0 });
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = createModuleSchema.safeParse({
        title: "Module",
        description: null,
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should trim whitespace from title", () => {
      const result = createModuleSchema.safeParse({
        title: "  Module Title  ",
        order: 0,
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.title, "Module Title");
    });
  });

  describe("updateModuleSchema (PUT - full replacement)", () => {
    it("should accept all required fields", () => {
      const result = updateModuleSchema.safeParse({
        title: "Updated Module",
        description: "Updated description",
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = updateModuleSchema.safeParse({
        title: "Updated Module",
        description: null,
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = updateModuleSchema.safeParse({ description: "desc", order: 1 });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = updateModuleSchema.safeParse({ title: "Module", description: null });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = updateModuleSchema.safeParse({
        title: "Module",
        description: null,
        order: 0,
        status: "PUBLISHED",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchModuleSchema (PATCH - partial update)", () => {
    it("should accept partial fields", () => {
      const result = patchModuleSchema.safeParse({ title: "Updated" });
      assert.equal(result.success, true);
    });

    it("should accept empty object", () => {
      const result = patchModuleSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = patchModuleSchema.safeParse({ description: null });
      assert.equal(result.success, true);
    });

    it("should accept order only", () => {
      const result = patchModuleSchema.safeParse({ order: 5 });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = patchModuleSchema.safeParse({ status: "DRAFT" });
      assert.equal(result.success, false);
    });

    it("should reject invalid order type", () => {
      const result = patchModuleSchema.safeParse({ order: "5" });
      assert.equal(result.success, false);
    });

    it("should reject negative order", () => {
      const result = patchModuleSchema.safeParse({ order: -1 });
      assert.equal(result.success, false);
    });
  });

  describe("moduleListSchema", () => {
    it("should parse with defaults", () => {
      const result = moduleListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid page and limit", () => {
      const result = moduleListSchema.safeParse({ page: "3", limit: "50" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 3);
        assert.equal(result.data.limit, 50);
      }
    });

    it("should accept search string", () => {
      const result = moduleListSchema.safeParse({ search: "intro" });
      assert.equal(result.success, true);
    });

    it("should reject page < 1", () => {
      const result = moduleListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = moduleListSchema.safeParse({ limit: "101" });
      assert.equal(result.success, false);
    });

    it("should preprocess isActive 'true' to boolean true", () => {
      const result = moduleListSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, true);
    });

    it("should preprocess isActive 'false' to boolean false", () => {
      const result = moduleListSchema.safeParse({ isActive: "false" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, false);
    });

    it("should accept empty search as undefined", () => {
      const result = moduleListSchema.safeParse({ search: undefined });
      assert.equal(result.success, true);
    });

    it("should reject search exceeding 100 characters", () => {
      const result = moduleListSchema.safeParse({ search: "x".repeat(101) });
      assert.equal(result.success, false);
    });
  });
});
