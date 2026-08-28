import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  googleLoginSchema,
  forgotPasswordSchema,
} from "@/validations/auth.validation";

describe("auth validation schemas (strict)", () => {
  describe("registerSchema", () => {
    it("should reject unexpected role field", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });
  });

  describe("loginSchema", () => {
    it("should reject unexpected fields", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "Password123!",
        isAdmin: true,
      });
      assert.equal(result.success, false);
    });
  });

  describe("changePasswordSchema", () => {
    it("should reject unexpected fields", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should reject unexpected fields", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token",
        newPassword: "NewPass123!",
        userId: "123",
      });
      assert.equal(result.success, false);
    });
  });

  describe("updateProfileSchema", () => {
    it("should reject unexpected fields", () => {
      const result = updateProfileSchema.safeParse({
        name: "Updated Name",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });
  });

  describe("googleLoginSchema", () => {
    it("should reject unexpected fields", () => {
      const result = googleLoginSchema.safeParse({
        idToken: "google-id-token",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should reject unexpected fields", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "test@example.com",
        role: "ADMIN",
      });
      assert.equal(result.success, false);
    });

    it("should accept a valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "test@example.com" });
      assert.equal(result.success, true);
    });
  });
});
