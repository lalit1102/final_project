import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { UserRole } from "@/types/user.types";
import {
  userListSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "@/validations/admin.validation";

describe("admin.validation schemas", () => {
  describe("userIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = userIdParamSchema.safeParse({ id: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, true);
    });

    it("should reject a non-ObjectId string", () => {
      const result = userIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = userIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });

    it("should reject a 12-char hex (not 24)", () => {
      const result = userIdParamSchema.safeParse({ id: "507f1f77bcf8" });
      assert.equal(result.success, false);
    });
  });

  describe("userListSchema", () => {
    it("should parse with defaults for page and limit", () => {
      const result = userListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid pagination params", () => {
      const result = userListSchema.safeParse({ page: "2", limit: "10" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 10);
      }
    });

    it("should reject page < 1", () => {
      const result = userListSchema.safeParse({ page: "0", limit: "10" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = userListSchema.safeParse({ page: "1", limit: "200" });
      assert.equal(result.success, false);
    });

    it("should accept a valid role", () => {
      const result = userListSchema.safeParse({ role: "ADMIN" });
      assert.equal(result.success, true);
    });

    it("should reject an invalid role", () => {
      const result = userListSchema.safeParse({ role: "SUPERADMIN" });
      assert.equal(result.success, false);
    });

    it("should accept isActive true/false strings", () => {
      const result1 = userListSchema.safeParse({ isActive: "true" });
      assert.equal(result1.success, true);
      if (result1.success) assert.equal(result1.data.isActive, true);

      const result2 = userListSchema.safeParse({ isActive: "false" });
      assert.equal(result2.success, true);
      if (result2.success) assert.equal(result2.data.isActive, false);
    });

    it("should accept a search string", () => {
      const result = userListSchema.safeParse({ search: "alice" });
      assert.equal(result.success, true);
    });

    it("should reject a search string shorter than 1 char", () => {
      const result = userListSchema.safeParse({ search: "" });
      // empty string gets trimmed; min(1) will fail after trim
      assert.equal(result.success, false);
    });
  });

  describe("updateUserSchema", () => {
    it("should accept a valid role update", () => {
      const result = updateUserSchema.safeParse({ role: UserRole.TEACHER });
      assert.equal(result.success, true);
    });

    it("should accept a valid name update", () => {
      const result = updateUserSchema.safeParse({ name: "Updated Name" });
      assert.equal(result.success, true);
    });

    it("should reject a too-short name", () => {
      const result = updateUserSchema.safeParse({ name: "A" });
      assert.equal(result.success, false);
    });

    it("should accept a valid email update", () => {
      const result = updateUserSchema.safeParse({ email: "new@example.com" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.email, "new@example.com");
    });

    it("should reject an invalid email", () => {
      const result = updateUserSchema.safeParse({ email: "not-an-email" });
      assert.equal(result.success, false);
    });

    it("should lowercase the email", () => {
      const result = updateUserSchema.safeParse({ email: "TEST@EXAMPLE.COM" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.email, "test@example.com");
    });

    it("should accept isActive boolean", () => {
      const result = updateUserSchema.safeParse({ isActive: false });
      assert.equal(result.success, true);
    });
    it("should reject an unknown field via strict parsing check", () => {
      const result = updateUserSchema.safeParse({ password: "hacked" });
      assert.equal(result.success, false);
    });

    it("should reject null role", () => {
      const result = updateUserSchema.safeParse({ role: null });
      assert.equal(result.success, false);
    });

    it("should accept empty object (optional fields)", () => {
      const result = updateUserSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept studentId as a string", () => {
      const result = updateUserSchema.safeParse({ studentId: "STU-2025-001" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.studentId, "STU-2025-001");
    });

    it("should accept studentId as null", () => {
      const result = updateUserSchema.safeParse({ studentId: null });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.studentId, null);
    });

    it("should reject studentId as a number", () => {
      const result = updateUserSchema.safeParse({ studentId: 12345 });
      assert.equal(result.success, false);
    });

    it("should reject studentId exceeding max length", () => {
      const result = updateUserSchema.safeParse({ studentId: "x".repeat(101) });
      assert.equal(result.success, false);
    });

    it("should accept studentId with exactly 100 chars", () => {
      const result = updateUserSchema.safeParse({ studentId: "x".repeat(100) });
      assert.equal(result.success, true);
    });

    it("should trim whitespace from studentId", () => {
      const result = updateUserSchema.safeParse({ studentId: "  STU-2025-001  " });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.studentId, "STU-2025-001");
    });

    it("should accept parentIds as an array of ObjectIds", () => {
      const result = updateUserSchema.safeParse({
        parentIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439014"],
      });
      assert.equal(result.success, true);
    });

    it("should accept parentIds as an empty array", () => {
      const result = updateUserSchema.safeParse({ parentIds: [] });
      assert.equal(result.success, true);
      if (result.success) assert.deepEqual(result.data.parentIds, []);
    });

    it("should accept parentIds as null", () => {
      const result = updateUserSchema.safeParse({ parentIds: null });
      assert.equal(result.success, true);
    });

    it("should reject parentIds containing non-ObjectId strings", () => {
      const result = updateUserSchema.safeParse({ parentIds: ["not-a-valid-id"] });
      assert.equal(result.success, false);
    });

    it("should reject parentIds with more than 10 entries", () => {
      const ids = Array.from({ length: 11 }, (_, i) => `507f1f77bcf86cd79943901${i}`);
      const result = updateUserSchema.safeParse({ parentIds: ids });
      assert.equal(result.success, false);
    });

    it("should reject parentIds as a non-array value", () => {
      const result = updateUserSchema.safeParse({ parentIds: "not-an-array" });
      assert.equal(result.success, false);
    });
  });

  describe("updateUserStatusSchema", () => {
    it("should accept isActive true", () => {
      const result = updateUserStatusSchema.safeParse({ isActive: true });
      assert.equal(result.success, true);
    });

    it("should accept isActive false", () => {
      const result = updateUserStatusSchema.safeParse({ isActive: false });
      assert.equal(result.success, true);
    });

    it("should reject isActive as string", () => {
      const result = updateUserStatusSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, false);
    });

    it("should reject missing isActive", () => {
      const result = updateUserStatusSchema.safeParse({});
      assert.equal(result.success, false);
    });

    it("should reject isActive as number", () => {
      const result = updateUserStatusSchema.safeParse({ isActive: 1 });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = updateUserStatusSchema.safeParse({ isActive: true, role: "ADMIN" });
      assert.equal(result.success, false);
    });
  });
});
