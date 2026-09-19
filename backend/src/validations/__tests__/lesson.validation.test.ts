import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { LessonContentType } from "@/types/lesson.types";
import {
  lessonIdParamSchema,
  lessonModuleIdParamSchema,
  createLessonSchema,
  updateLessonSchema,
  patchLessonSchema,
  lessonListSchema,
} from "@/validations/lesson.validation";

describe("Lesson validation schemas (strict)", () => {
  describe("lessonIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = lessonIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = lessonIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = lessonIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("lessonModuleIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = lessonModuleIdParamSchema.safeParse({ moduleId: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = lessonModuleIdParamSchema.safeParse({ moduleId: "invalid" });
      assert.equal(result.success, false);
    });
  });

  describe("createLessonSchema", () => {
    it("should accept a valid lesson with VIDEO content type", () => {
      const result = createLessonSchema.safeParse({
        title: "Introduction to Biology",
        contentType: LessonContentType.VIDEO,
        content: "https://example.com/video.mp4",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid lesson with TEXT content type", () => {
      const result = createLessonSchema.safeParse({
        title: "Algebra Basics",
        contentType: LessonContentType.TEXT,
        content: "Today we learn about variables...",
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid lesson with PDF content type", () => {
      const result = createLessonSchema.safeParse({
        title: "Chapter 1",
        contentType: LessonContentType.PDF,
        content: "https://example.com/chapter1.pdf",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid lesson with IMAGE content type", () => {
      const result = createLessonSchema.safeParse({
        title: "Diagram",
        contentType: LessonContentType.IMAGE,
        content: "https://example.com/diagram.png",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid lesson with LINK content type", () => {
      const result = createLessonSchema.safeParse({
        title: "External Resource",
        contentType: LessonContentType.LINK,
        content: "https://example.com/resource",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a lesson without description", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a lesson without durationMinutes (default applied at model level)", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept durationMinutes = 0", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        durationMinutes: 0,
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = createLessonSchema.safeParse({
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing contentType", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing content", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
      });
      assert.equal(result.success, false);
    });

    it("should reject an invalid contentType", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: "INVALID",
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject empty title", () => {
      const result = createLessonSchema.safeParse({
        title: "",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject title exceeding 200 characters", () => {
      const result = createLessonSchema.safeParse({
        title: "x".repeat(201),
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject description exceeding 2000 characters", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        description: "x".repeat(2001),
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject content exceeding 50000 characters", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "x".repeat(50001),
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject empty content string", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject negative order", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: -1,
      });
      assert.equal(result.success, false);
    });

    it("should reject non-integer order", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 1.5,
      });
      assert.equal(result.success, false);
    });

    it("should reject order as string", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: "0",
      });
      assert.equal(result.success, false);
    });

    it("should reject negative durationMinutes", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        durationMinutes: -5,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject durationMinutes as string", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        durationMinutes: "10",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
        moduleId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject teacherId field", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject createdBy field", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
        createdBy: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should accept null description", () => {
      const result = createLessonSchema.safeParse({
        title: "Lesson",
        description: null,
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should trim whitespace from title", () => {
      const result = createLessonSchema.safeParse({
        title: "  Lesson Title  ",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.title, "Lesson Title");
    });
  });

  describe("updateLessonSchema (PUT - full replacement)", () => {
    it("should accept all required fields", () => {
      const result = updateLessonSchema.safeParse({
        title: "Updated Lesson",
        description: "Updated desc",
        contentType: LessonContentType.VIDEO,
        content: "https://example.com/new.mp4",
        durationMinutes: 30,
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = updateLessonSchema.safeParse({
        title: "Updated Lesson",
        description: null,
        contentType: LessonContentType.TEXT,
        content: "content",
        durationMinutes: 10,
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = updateLessonSchema.safeParse({
        description: "desc",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = updateLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = updateLessonSchema.safeParse({
        title: "Lesson",
        contentType: LessonContentType.TEXT,
        content: "content",
        order: 0,
        status: "DRAFT",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchLessonSchema (PATCH - partial update)", () => {
    it("should accept partial fields", () => {
      const result = patchLessonSchema.safeParse({ title: "Updated" });
      assert.equal(result.success, true);
    });

    it("should accept empty object", () => {
      const result = patchLessonSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = patchLessonSchema.safeParse({ description: null });
      assert.equal(result.success, true);
    });

    it("should accept contentType only", () => {
      const result = patchLessonSchema.safeParse({ contentType: LessonContentType.VIDEO });
      assert.equal(result.success, true);
    });

    it("should accept content only", () => {
      const result = patchLessonSchema.safeParse({ content: "new content" });
      assert.equal(result.success, true);
    });

    it("should accept durationMinutes only", () => {
      const result = patchLessonSchema.safeParse({ durationMinutes: 45 });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = patchLessonSchema.safeParse({ status: "PUBLISHED" });
      assert.equal(result.success, false);
    });

    it("should reject invalid contentType", () => {
      const result = patchLessonSchema.safeParse({ contentType: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject content exceeding 50000 characters", () => {
      const result = patchLessonSchema.safeParse({ content: "x".repeat(50001) });
      assert.equal(result.success, false);
    });

    it("should reject negative durationMinutes", () => {
      const result = patchLessonSchema.safeParse({ durationMinutes: -1 });
      assert.equal(result.success, false);
    });

    it("should reject non-integer order", () => {
      const result = patchLessonSchema.safeParse({ order: 1.5 });
      assert.equal(result.success, false);
    });
  });

  describe("lessonListSchema", () => {
    it("should parse with defaults", () => {
      const result = lessonListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid page and limit", () => {
      const result = lessonListSchema.safeParse({ page: "2", limit: "10" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 10);
      }
    });

    it("should accept search string", () => {
      const result = lessonListSchema.safeParse({ search: "biology" });
      assert.equal(result.success, true);
    });

    it("should accept contentType filter", () => {
      const result = lessonListSchema.safeParse({ contentType: LessonContentType.VIDEO });
      assert.equal(result.success, true);
    });

    it("should accept contentType filter as TEXT", () => {
      const result = lessonListSchema.safeParse({ contentType: LessonContentType.TEXT });
      assert.equal(result.success, true);
    });

    it("should reject invalid contentType filter", () => {
      const result = lessonListSchema.safeParse({ contentType: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject page < 1", () => {
      const result = lessonListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = lessonListSchema.safeParse({ limit: "101" });
      assert.equal(result.success, false);
    });

    it("should preprocess isActive 'true' to boolean true", () => {
      const result = lessonListSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, true);
    });

    it("should preprocess isActive 'false' to boolean false", () => {
      const result = lessonListSchema.safeParse({ isActive: "false" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, false);
    });

    it("should reject search exceeding 100 characters", () => {
      const result = lessonListSchema.safeParse({ search: "x".repeat(101) });
      assert.equal(result.success, false);
    });

    it("should not reject unknown fields on list schema (non-strict)", () => {
      const result = lessonListSchema.safeParse({ status: "DRAFT" });
      assert.equal(result.success, true);
    });
  });
});
