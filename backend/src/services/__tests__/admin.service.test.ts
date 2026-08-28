import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { AuthProvider, IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";

import { adminService } from "@/services/admin.service";
import { userRepository } from "@/repositories/user.repository";

const mockUsers: Partial<IUser>[] = [
  {
    _id: "507f1f77bcf86cd799439011" as unknown as IUser["_id"],
    name: "Alice Admin",
    email: "alice@example.com",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: null,
    role: UserRole.ADMIN,
    isActive: true,
    isVerified: true,
    lastLogin: new Date("2025-01-15T10:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
  },
  {
    _id: "507f1f77bcf86cd799439012" as unknown as IUser["_id"],
    name: "Bob Teacher",
    email: "bob@example.com",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: null,
    role: UserRole.TEACHER,
    isActive: true,
    isVerified: false,
    lastLogin: null,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
  {
    _id: "507f1f77bcf86cd799439013" as unknown as IUser["_id"],
    name: "Inactive User",
    email: "inactive@example.com",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: null,
    role: UserRole.STUDENT,
    isActive: false,
    isVerified: false,
    lastLogin: null,
    createdAt: new Date("2025-01-03T00:00:00Z"),
    updatedAt: new Date("2025-01-03T00:00:00Z"),
  },
];

const defaultMock = {
  findAllPaginated: async () => ({ users: mockUsers, total: mockUsers.length }),
  findByIdSafe: async (_id: string) => mockUsers.find((u) => u._id?.toString() === _id) ?? null,
  findById: async (_id: string) => mockUsers.find((u) => u._id?.toString() === _id) ?? null,
  findByEmail: async (email: string) => mockUsers.find((u) => u.email === email) ?? null,
  update: async () => mockUsers[0],
  softDelete: async (_id: string) => {
    const user = mockUsers.find((u) => u._id?.toString() === _id);
    if (!user) return null;
    return { ...user, isActive: false } as IUser;
  },
};

type MockOverrides = Partial<typeof defaultMock>;

let mockOverrides: MockOverrides;

function installMockRepo(): void {
  const repo = userRepository as unknown as Record<string, unknown>;
  const source = { ...defaultMock, ...mockOverrides };

  repo.findAllPaginated = source.findAllPaginated;
  repo.findByIdSafe = source.findByIdSafe;
  repo.findById = source.findById;
  repo.findByEmail = source.findByEmail;
  repo.update = source.update;
  repo.softDelete = source.softDelete;
}

describe("AdminService", () => {
  beforeEach(() => {
    mockOverrides = {};
    installMockRepo();
  });

  describe("listUsers", () => {
    it("should return all users with pagination metadata", async () => {
      const result = await adminService.listUsers({
        page: 1,
        limit: 20,
      });

      assert.equal(result.pagination.total, 3);
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 20);
      assert.equal(result.pagination.totalPages, 1);
      assert.equal(result.users.length, 3);
    });

    it("should not expose password or refreshToken fields", async () => {
      const result = await adminService.listUsers({
        page: 1,
        limit: 20,
      });

      for (const user of result.users) {
        const u = user as unknown as Record<string, unknown>;
        assert.equal(u.password, undefined);
        assert.equal(u.refreshToken, undefined);
        assert.equal(u.loginAttempts, undefined);
      }
    });

    it("should filter by role", async () => {
      mockOverrides = {
        findAllPaginated: (async (filter: { role?: UserRole }) => {
          const filtered = mockUsers.filter((u) => u.role === filter.role);
          return { users: filtered, total: filtered.length };
        }) as typeof defaultMock.findAllPaginated,
      };
      installMockRepo();

      const result = await adminService.listUsers({
        page: 1,
        limit: 20,
        role: UserRole.ADMIN,
      });

      assert.equal(result.users.length, 1);
      assert.equal(result.users[0].role, UserRole.ADMIN);
    });

    it("should return empty result when no users match", async () => {
      mockOverrides = {
        findAllPaginated: async () => ({ users: [], total: 0 }),
      };
      installMockRepo();

      const result = await adminService.listUsers({
        page: 1,
        limit: 20,
      });

      assert.equal(result.users.length, 0);
      assert.equal(result.pagination.total, 0);
      assert.equal(result.pagination.totalPages, 0);
    });

    it("should calculate totalPages correctly for large datasets", async () => {
      mockOverrides = {
        findAllPaginated: async () => ({ users: mockUsers, total: 45 }),
      };
      installMockRepo();

      const result = await adminService.listUsers({
        page: 1,
        limit: 20,
      });

      assert.equal(result.pagination.totalPages, 3);
      assert.equal(result.pagination.total, 45);
    });
  });

  describe("getUserById", () => {
    it("should return a sanitized user for a valid ID", async () => {
      const user = await adminService.getUserById("507f1f77bcf86cd799439011");

      assert.equal(user.id, "507f1f77bcf86cd799439011");
      assert.equal(user.name, "Alice Admin");
      assert.equal(user.email, "alice@example.com");
      assert.equal(user.role, UserRole.ADMIN);
    });

    it("should not expose password or refreshToken", async () => {
      const user = await adminService.getUserById("507f1f77bcf86cd799439011");

      const u = user as unknown as Record<string, unknown>;
      assert.equal(u.password, undefined);
      assert.equal(u.refreshToken, undefined);
    });

    it("should throw 404 for non-existent user", async () => {
      try {
        await adminService.getUserById("507f1f77bcf86cd799439999");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateUser", () => {
    it("should update user role", async () => {
      const updatedUser = { ...mockUsers[1], role: UserRole.ADMIN };
      mockOverrides = {
        update: async () => updatedUser as IUser,
        findByEmail: async () => null,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439012",
        { role: UserRole.ADMIN },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.role, UserRole.ADMIN);
    });

    it("should update isActive status", async () => {
      const updatedUser = { ...mockUsers[1], isActive: false };
      mockOverrides = {
        update: async () => updatedUser as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439012",
        { isActive: false },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.isActive, false);
    });

    it("should update name", async () => {
      const updatedUser = { ...mockUsers[1], name: "Updated Name" };
      mockOverrides = {
        update: async () => updatedUser as IUser,
        findByEmail: async () => null,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439012",
        { name: "Updated Name" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Updated Name");
    });

    it("should reject duplicate email", async () => {
      mockOverrides = {
        findByEmail: async (email: string) =>
          email === "alice@example.com" ? (mockUsers[0] as IUser) : null,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439012",
          { email: "alice@example.com" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });

    it("should allow same email (own email)", async () => {
      const updatedUser = { ...mockUsers[1], name: "Updated" };
      mockOverrides = {
        update: async () => updatedUser as IUser,
        findByEmail: async () => mockUsers[1] as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439012",
        { email: "bob@example.com" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Updated");
    });

    it("should throw 404 for non-existent user", async () => {
      mockOverrides = {
        findById: async () => null,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439999",
          { name: "Test" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return sanitized user without password", async () => {
      mockOverrides = {
        update: async () => mockUsers[0] as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439011",
        { name: "Updated" },
        "507f1f77bcf86cd799439011",
      );

      const u = result as unknown as Record<string, unknown>;
      assert.equal(u.password, undefined);
      assert.equal(u.refreshToken, undefined);
    });

    it("should reject non-admin requester (service-level authorization)", async () => {
      mockOverrides = {
        findById: async (_id: string) =>
          _id === "507f1f77bcf86cd799439012" ? (mockUsers[1] as IUser) : null,
        update: async () => mockUsers[1] as IUser,
      };
      installMockRepo();

      try {
        await adminService.updateUser("507f1f77bcf86cd799439012", { name: "Test" }, "507f1f77bcf86cd799439012");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });
  });

  describe("updateUserStatus", () => {
    it("should set isActive to false", async () => {
      const updatedUser = { ...mockUsers[1], isActive: false };
      mockOverrides = {
        update: async () => updatedUser as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUserStatus(
        "507f1f77bcf86cd799439012",
        false,
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.isActive, false);
    });

    it("should set isActive to true", async () => {
      const updatedUser = { ...mockUsers[2], isActive: true };
      mockOverrides = {
        update: async () => updatedUser as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUserStatus(
        "507f1f77bcf86cd799439013",
        true,
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.isActive, true);
    });

    it("should not call update if status is already the same", async () => {
      let updateCalled = false;
      mockOverrides = {
        update: async () => {
          updateCalled = true;
          return mockUsers[0] as IUser;
        },
      };
      installMockRepo();

      await adminService.updateUserStatus(
        "507f1f77bcf86cd799439011",
        true,
        "507f1f77bcf86cd799439011",
      );

      assert.equal(updateCalled, false);
    });

    it("should throw 404 for non-existent user", async () => {
      mockOverrides = {
        findById: async () => null,
      };
      installMockRepo();

      try {
        await adminService.updateUserStatus(
          "507f1f77bcf86cd799439999",
          false,
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return sanitized user", async () => {
      const updatedUser = { ...mockUsers[1], isActive: false };
      mockOverrides = {
        update: async () => updatedUser as IUser,
      };
      installMockRepo();

      const result = await adminService.updateUserStatus(
        "507f1f77bcf86cd799439012",
        false,
        "507f1f77bcf86cd799439011",
      );

      const u = result as unknown as Record<string, unknown>;
      assert.equal(u.password, undefined);
      assert.equal(u.refreshToken, undefined);
      assert.equal(u.loginAttempts, undefined);
    });

    it("should reject non-admin requester (service-level authorization)", async () => {
      try {
        await adminService.updateUserStatus(
          "507f1f77bcf86cd799439012",
          false,
          "507f1f77bcf86cd799439012",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });
  });

  describe("deleteUser", () => {
    it("should deactivate an active user (isActive becomes false)", async () => {
      mockOverrides = {
        findById: async (_id: string) =>
          _id === "507f1f77bcf86cd799439012" ? (mockUsers[1] as IUser) : null,
        softDelete: async () => ({ ...mockUsers[1], isActive: false } as IUser),
      };
      installMockRepo();

      const result = await adminService.deleteUser("507f1f77bcf86cd799439012", "507f1f77bcf86cd799439011");

      assert.equal(result.isActive, false);
    });

    it("should not call softDelete if user is already inactive", async () => {
      let softDeleteCalled = false;
      mockOverrides = {
        findById: async (_id: string) =>
          _id === "507f1f77bcf86cd799439013" ? (mockUsers[2] as IUser) : null,
        softDelete: async () => {
          softDeleteCalled = true;
          return mockUsers[2] as IUser;
        },
      };
      installMockRepo();

      const result = await adminService.deleteUser("507f1f77bcf86cd799439013", "507f1f77bcf86cd799439011");

      assert.equal(softDeleteCalled, false);
      assert.equal(result.isActive, false);
    });

    it("should throw 404 for non-existent user", async () => {
      mockOverrides = {
        findById: async () => null,
      };
      installMockRepo();

      try {
        await adminService.deleteUser("507f1f77bcf86cd799439999", "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should throw 403 for non-admin requester", async () => {
      try {
        await adminService.deleteUser("507f1f77bcf86cd799439012", "507f1f77bcf86cd799439012");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should throw 401 for non-existent requester", async () => {
      try {
        await adminService.deleteUser("507f1f77bcf86cd799439012", "507f1f77bcf86cd799439999");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should return sanitized user without password", async () => {
      mockOverrides = {
        findById: async (_id: string) =>
          _id === "507f1f77bcf86cd799439012" ? (mockUsers[1] as IUser) : null,
        softDelete: async () => ({ ...mockUsers[1], isActive: false } as IUser),
      };
      installMockRepo();

      const result = await adminService.deleteUser("507f1f77bcf86cd799439012", "507f1f77bcf86cd799439011");

      const u = result as unknown as Record<string, unknown>;
      assert.equal(u.password, undefined);
      assert.equal(u.refreshToken, undefined);
    });

    it("should behave consistently on repeated deactivation", async () => {
      mockOverrides = {
        findById: async (_id: string) =>
          _id === "507f1f77bcf86cd799439013" ? (mockUsers[2] as IUser) : null,
        softDelete: async () => ({ ...mockUsers[2], isActive: false } as IUser),
      };
      installMockRepo();

      const result1 = await adminService.deleteUser("507f1f77bcf86cd799439013", "507f1f77bcf86cd799439011");
      const result2 = await adminService.deleteUser("507f1f77bcf86cd799439013", "507f1f77bcf86cd799439011");

      assert.equal(result1.isActive, false);
      assert.equal(result2.isActive, false);
    });
  });
});
