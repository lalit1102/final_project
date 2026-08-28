import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { sanitizeUser } from "@/lib/userSanitization";
import { IUser, UserRole, AuthProvider } from "@/types/user.types";

function makeMockUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    name: "Test User",
    email: "test@example.com",
    password: "hashed_password_123",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: "https://example.com/avatar.png",
    role: UserRole.STUDENT,
    permissions: [],
    isActive: true,
    isVerified: false,
    refreshToken: "secret_refresh_token",
    lastLogin: new Date("2025-01-15T10:00:00Z"),
    loginAttempts: 0,
    lockUntil: null,
    passwordChangedAt: new Date("2025-01-14T10:00:00Z"),
     studentId: "STU-2025-001",
     parentIds: [],
     createdAt: new Date("2025-01-01T00:00:00Z"),
     updatedAt: new Date("2025-01-15T10:00:00Z"),
     ...overrides,
   };
 }

describe("sanitizeUser", () => {
  it("should return null for null input", () => {
    assert.equal(sanitizeUser(null), null);
  });

  it("should map _id to id", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.id, "507f1f77bcf86cd799439011");
  });

  it("should include name, email, provider, avatar, role, isActive, isVerified", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);

    assert.equal(result?.name, "Test User");
    assert.equal(result?.email, "test@example.com");
    assert.equal(result?.provider, "LOCAL");
    assert.equal(result?.avatar, "https://example.com/avatar.png");
    assert.equal(result?.role, "STUDENT");
    assert.equal(result?.isActive, true);
    assert.equal(result?.isVerified, false);
  });

  it("should NOT include password", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).password, undefined);
  });

  it("should NOT include refreshToken", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).refreshToken, undefined);
  });

  it("should NOT include loginAttempts", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).loginAttempts, undefined);
  });

  it("should NOT include lockUntil", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).lockUntil, undefined);
  });

  it("should NOT include passwordChangedAt", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).passwordChangedAt, undefined);
  });

  it("should NOT include permissions", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal((result as unknown as Record<string, unknown>).permissions, undefined);
  });

  it("should include createdAt and updatedAt", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.ok(result?.createdAt instanceof Date);
    assert.ok(result?.updatedAt instanceof Date);
  });

  it("should include lastLogin", () => {
    const user = makeMockUser() as unknown as IUser;
    const result = sanitizeUser(user);
    assert.ok(result?.lastLogin instanceof Date);
  });

  it("should handle null providerId and avatar", () => {
    const user = makeMockUser({ providerId: null, avatar: null }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.providerId, null);
    assert.equal(result?.avatar, null);
  });

  it("should handle null lastLogin", () => {
    const user = makeMockUser({ lastLogin: null }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.lastLogin, null);
  });

  it("should include studentId as null when not set", () => {
    const user = makeMockUser({ studentId: null }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.studentId, null);
  });

  it("should include studentId when set", () => {
    const user = makeMockUser({ studentId: "STU-2025-001" }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.studentId, "STU-2025-001");
  });

  it("should include parentIds as empty array when not set", () => {
    const user = makeMockUser({ parentIds: [] }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.deepEqual(result?.parentIds, []);
  });

  it("should include parentIds when set", () => {
    const user = makeMockUser({
      parentIds: [
        { toString: () => "507f1f77bcf86cd799439011" },
        { toString: () => "507f1f77bcf86cd799439014" },
      ],
    }) as unknown as IUser;
    const result = sanitizeUser(user);
    assert.equal(result?.parentIds.length, 2);
    assert.equal(result?.parentIds[0], "507f1f77bcf86cd799439011");
    assert.equal(result?.parentIds[1], "507f1f77bcf86cd799439014");
  });
});
