import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { MaterialType } from "@/types/material.types";
import {
  materialIdParamSchema,
  createMaterialSchema,
  updateMaterialSchema,
  patchMaterialSchema,
  materialListSchema,
} from "@/validations/material.validation";

describe("Material validation schemas (strict)", () => {
  describe("materialIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = materialIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid ObjectId", () => {
      const result = materialIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = materialIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createMaterialSchema", () => {
    it("should accept a valid FILE material", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet PDF",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/worksheet.pdf",
        fileSize: 1024,
        thumbnailUrl: "https://example.com/thumb.jpg",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid DOCUMENT material", () => {
      const result = createMaterialSchema.safeParse({
        title: "Chapter Notes",
        materialType: MaterialType.DOCUMENT,
        fileUrl: "https://example.com/notes.docx",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid IMAGE material", () => {
      const result = createMaterialSchema.safeParse({
        title: "Diagram",
        materialType: MaterialType.IMAGE,
        fileUrl: "https://example.com/diagram.png",
        thumbnailUrl: "https://example.com/thumb.jpg",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid VIDEO material", () => {
      const result = createMaterialSchema.safeParse({
        title: "Lecture Video",
        materialType: MaterialType.VIDEO,
        fileUrl: "https://example.com/lecture.mp4",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a valid LINK material", () => {
      const result = createMaterialSchema.safeParse({
        title: "External Resource",
        materialType: MaterialType.LINK,
        externalUrl: "https://example.com/resource",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a material without description", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a material with nullable externalUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        externalUrl: null,
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept a material with fileSize = 0", () => {
      const result = createMaterialSchema.safeParse({
        title: "Empty file",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/empty.pdf",
        fileSize: 0,
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should accept null description", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        description: null,
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = createMaterialSchema.safeParse({
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing materialType", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
      });
      assert.equal(result.success, false);
    });

    it("should reject an invalid materialType", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: "INVALID",
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject empty title", () => {
      const result = createMaterialSchema.safeParse({
        title: "",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject title exceeding 200 characters", () => {
      const result = createMaterialSchema.safeParse({
        title: "x".repeat(201),
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject description exceeding 2000 characters", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        description: "x".repeat(2001),
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject negative order", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: -1,
      });
      assert.equal(result.success, false);
    });

    it("should reject non-integer order", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 1.5,
      });
      assert.equal(result.success, false);
    });

    it("should reject order as string", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: "0",
      });
      assert.equal(result.success, false);
    });

    it("should reject negative fileSize", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        fileSize: -100,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject non-integer fileSize", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        fileSize: 1.5,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject fileSize as string", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        fileSize: "1024",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid fileUrl (not a URL)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "not-a-url",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid externalUrl (not a URL)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Link",
        materialType: MaterialType.LINK,
        externalUrl: "not-a-url",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid externalUrl (no protocol)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Link",
        materialType: MaterialType.LINK,
        externalUrl: "example.com",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid thumbnailUrl (not a URL)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        thumbnailUrl: "not-a-url",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject FILE material without fileUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject IMAGE material without fileUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Image",
        materialType: MaterialType.IMAGE,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject VIDEO material without fileUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Video",
        materialType: MaterialType.VIDEO,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject DOCUMENT material without fileUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Document",
        materialType: MaterialType.DOCUMENT,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject LINK material without externalUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Link",
        materialType: MaterialType.LINK,
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should reject LINK material with empty externalUrl", () => {
      const result = createMaterialSchema.safeParse({
        title: "Link",
        materialType: MaterialType.LINK,
        externalUrl: "",
        order: 0,
      });
      assert.equal(result.success, false);
    });

    it("should accept FILE material with externalUrl (not required but allowed)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        externalUrl: "https://example.com/reference",
        order: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
        content: "text content",
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields with url", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
        url: "https://example.com",
      });
      assert.equal(result.success, false);
    });

    it("should reject teacherId field", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
        teacherId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject createdBy field", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
        createdBy: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject lessonId field (server-controlled from path)", () => {
      const result = createMaterialSchema.safeParse({
        title: "Worksheet",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
        lessonId: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should trim whitespace from title", () => {
      const result = createMaterialSchema.safeParse({
        title: "  Worksheet  ",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/ws.pdf",
        order: 0,
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.title, "Worksheet");
    });
  });

  describe("updateMaterialSchema (PUT - full replacement)", () => {
    it("should accept all required fields", () => {
      const result = updateMaterialSchema.safeParse({
        title: "Updated Material",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/new.pdf",
        fileSize: 2048,
        thumbnailUrl: "https://example.com/new-thumb.jpg",
        externalUrl: null,
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should accept null for all nullable fields", () => {
      const result = updateMaterialSchema.safeParse({
        title: "Updated Material",
        materialType: MaterialType.LINK,
        fileUrl: null,
        fileSize: null,
        thumbnailUrl: null,
        externalUrl: "https://example.com/new-link",
        order: 1,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = updateMaterialSchema.safeParse({
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/new.pdf",
        order: 1,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing materialType", () => {
      const result = updateMaterialSchema.safeParse({
        title: "Updated",
        fileUrl: "https://example.com/new.pdf",
        order: 1,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing order", () => {
      const result = updateMaterialSchema.safeParse({
        title: "Updated",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/new.pdf",
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = updateMaterialSchema.safeParse({
        title: "Updated",
        materialType: MaterialType.FILE,
        fileUrl: "https://example.com/new.pdf",
        order: 1,
        content: "text",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchMaterialSchema (PATCH - partial update)", () => {
    it("should accept partial fields", () => {
      const result = patchMaterialSchema.safeParse({ title: "Updated" });
      assert.equal(result.success, true);
    });

    it("should accept empty object", () => {
      const result = patchMaterialSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null fileUrl", () => {
      const result = patchMaterialSchema.safeParse({ fileUrl: null });
      assert.equal(result.success, true);
    });

    it("should accept null externalUrl", () => {
      const result = patchMaterialSchema.safeParse({ externalUrl: null });
      assert.equal(result.success, true);
    });

    it("should accept materialType only", () => {
      const result = patchMaterialSchema.safeParse({ materialType: MaterialType.IMAGE });
      assert.equal(result.success, true);
    });

    it("should accept order only", () => {
      const result = patchMaterialSchema.safeParse({ order: 5 });
      assert.equal(result.success, true);
    });

    it("should accept fileSize only", () => {
      const result = patchMaterialSchema.safeParse({ fileSize: 1024 });
      assert.equal(result.success, true);
    });

    it("should reject unknown fields", () => {
      const result = patchMaterialSchema.safeParse({ status: "PUBLISHED" });
      assert.equal(result.success, false);
    });

    it("should reject invalid materialType", () => {
      const result = patchMaterialSchema.safeParse({ materialType: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject invalid fileUrl", () => {
      const result = patchMaterialSchema.safeParse({ fileUrl: "not-a-url" });
      assert.equal(result.success, false);
    });

    it("should reject invalid externalUrl", () => {
      const result = patchMaterialSchema.safeParse({ externalUrl: "not-a-url" });
      assert.equal(result.success, false);
    });

    it("should reject invalid thumbnailUrl", () => {
      const result = patchMaterialSchema.safeParse({ thumbnailUrl: "not-a-url" });
      assert.equal(result.success, false);
    });

    it("should reject negative fileSize", () => {
      const result = patchMaterialSchema.safeParse({ fileSize: -1 });
      assert.equal(result.success, false);
    });

    it("should reject negative order", () => {
      const result = patchMaterialSchema.safeParse({ order: -1 });
      assert.equal(result.success, false);
    });

    it("should reject non-integer order", () => {
      const result = patchMaterialSchema.safeParse({ order: 1.5 });
      assert.equal(result.success, false);
    });
  });

  describe("materialListSchema", () => {
    it("should parse with defaults", () => {
      const result = materialListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid page and limit", () => {
      const result = materialListSchema.safeParse({ page: "2", limit: "15" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 15);
      }
    });

    it("should accept search string", () => {
      const result = materialListSchema.safeParse({ search: "worksheet" });
      assert.equal(result.success, true);
    });

    it("should accept materialType filter", () => {
      const result = materialListSchema.safeParse({ materialType: MaterialType.FILE });
      assert.equal(result.success, true);
    });

    it("should accept materialType filter as LINK", () => {
      const result = materialListSchema.safeParse({ materialType: MaterialType.LINK });
      assert.equal(result.success, true);
    });

    it("should reject invalid materialType filter", () => {
      const result = materialListSchema.safeParse({ materialType: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject page < 1", () => {
      const result = materialListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = materialListSchema.safeParse({ limit: "101" });
      assert.equal(result.success, false);
    });

    it("should preprocess isActive 'true' to boolean true", () => {
      const result = materialListSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, true);
    });

    it("should preprocess isActive 'false' to boolean false", () => {
      const result = materialListSchema.safeParse({ isActive: "false" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.isActive, false);
    });

    it("should reject search exceeding 100 characters", () => {
      const result = materialListSchema.safeParse({ search: "x".repeat(101) });
      assert.equal(result.success, false);
    });

    it("should not reject unknown fields on list schema (non-strict)", () => {
      const result = materialListSchema.safeParse({ status: "DRAFT" });
      assert.equal(result.success, true);
    });
  });
});
