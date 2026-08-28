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
  {
    _id: "507f1f77bcf86cd799439014" as unknown as IUser["_id"],
    name: "Parent One",
    email: "parent1@example.com",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: null,
    role: UserRole.PARENT,
    isActive: true,
    isVerified: true,
    lastLogin: null,
    createdAt: new Date("2025-01-04T00:00:00Z"),
    updatedAt: new Date("2025-01-04T00:00:00Z"),
  },
  {
    _id: "507f1f77bcf86cd799439015" as unknown as IUser["_id"],
    name: "Parent Two",
    email: "parent2@example.com",
    provider: AuthProvider.LOCAL,
    providerId: null,
    avatar: null,
    role: UserRole.PARENT,
    isActive: true,
    isVerified: true,
    lastLogin: null,
    createdAt: new Date("2025-01-05T00:00:00Z"),
    updatedAt: new Date("2025-01-05T00:00:00Z"),
  },
];

const defaultMock = {
  findAllPaginated: async () => ({ users: mockUsers, total: mockUsers.length }),
  findByIdSafe: async (_id: string) => mockUsers.find((u) => u._id?.toString() === _id) ?? null,
  findById: async (_id: string) => mockUsers.find((u) => u._id?.toString() === _id) ?? null,
  findByIds: async (_ids: string[]) => mockUsers.filter((u) => _ids.includes(u._id?.toString() ?? "")),
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
  repo.findByIds = source.findByIds;
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

      assert.equal(result.pagination.total, 5);
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 20);
      assert.equal(result.pagination.totalPages, 1);
      assert.equal(result.users.length, 5);
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

    it("should set studentId on a STUDENT user", async () => {
      const student = { ...mockUsers[2] } as unknown as IUser;
      const updated = { ...student, studentId: "STU-2025-001" } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        update: async () => updated,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439013",
        { studentId: "STU-2025-001" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.studentId, "STU-2025-001");
    });

    it("should set parentIds on a STUDENT user referencing valid PARENT users", async () => {
      const student = { ...mockUsers[2] } as unknown as IUser;
      const parent1 = { ...mockUsers[3] } as unknown as IUser;
      const parent2 = { ...mockUsers[4] } as unknown as IUser;
      const updated = {
        ...student,
        parentIds: [
          parent1._id,
          parent2._id,
        ],
      } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        findByIds: async (ids: string[]) =>
          mockUsers.filter((u) => ids.includes(u._id?.toString() ?? "")) as IUser[],
        update: async () => updated,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439013",
        { parentIds: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"] },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.parentIds.length, 2);
      assert.equal(result.parentIds[0], "507f1f77bcf86cd799439014");
    });

    it("should reject studentId on a non-STUDENT target (TEACHER)", async () => {
      mockOverrides = {
        findById: async () => mockUsers[1] as IUser,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439012",
          { studentId: "STU-2025-999" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
        assert.ok(error.message.includes("studentId"));
      }
    });

    it("should reject parentIds on a non-STUDENT target (TEACHER)", async () => {
      mockOverrides = {
        findById: async () => mockUsers[1] as IUser,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439012",
          { parentIds: ["507f1f77bcf86cd799439014"] },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
        assert.ok(error.message.includes("parentIds"));
      }
    });

    it("should reject studentId on a non-STUDENT target (ADMIN)", async () => {
      mockOverrides = {
        findById: async () => mockUsers[0] as IUser,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439011",
          { studentId: "STU-2025-999" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject parentIds on a non-STUDENT target (ADMIN)", async () => {
      mockOverrides = {
        findById: async () => mockUsers[0] as IUser,
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439011",
          { parentIds: ["507f1f77bcf86cd799439014"] },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject parentIds referencing a nonexistent User", async () => {
      const student = { ...mockUsers[2] } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        findByIds: async (_ids: string[]) => [],
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439013",
          { parentIds: ["507f1f77bcf86cd799439099"] },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject parentIds referencing a non-PARENT User (TEACHER)", async () => {
      const student = { ...mockUsers[2] } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        findByIds: async (_ids: string[]) => [mockUsers[1] as IUser],
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439013",
          { parentIds: ["507f1f77bcf86cd799439012"] },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });

    it("should reject parentIds referencing a non-PARENT User (ADMIN)", async () => {
      const student = { ...mockUsers[2] } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        findByIds: async (_ids: string[]) => [mockUsers[0] as IUser],
      };
      installMockRepo();

      try {
        await adminService.updateUser(
          "507f1f77bcf86cd799439013",
          { parentIds: ["507f1f77bcf86cd799439011"] },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });

    it("should allow setting studentId to null (clearing it)", async () => {
      const student = { ...mockUsers[2], studentId: "STU-OLD" } as unknown as IUser;
      const updated = { ...student, studentId: null } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        update: async () => updated,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439013",
        { studentId: null },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.studentId, null);
    });

    it("should allow setting parentIds to empty array (clearing parents)", async () => {
      const student = { ...mockUsers[2], studentId: null, parentIds: [] } as unknown as IUser;
      const updated = { ...student } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        update: async () => updated,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439013",
        { parentIds: [] },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.parentIds.length, 0);
    });

    it("should include studentId and parentIds in sanitized response", async () => {
      const student = {
        ...mockUsers[2],
        studentId: "STU-2025-001",
        parentIds: [
          { toString: () => "507f1f77bcf86cd799439014" } as unknown as IUser["_id"],
        ],
      } as unknown as IUser;
      mockOverrides = {
        findById: async () => student,
        update: async () => student,
      };
      installMockRepo();

      const result = await adminService.updateUser(
        "507f1f77bcf86cd799439013",
        { name: "Updated Name" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.studentId, "STU-2025-001");
      assert.equal(result.parentIds.length, 1);
      assert.equal(result.parentIds[0], "507f1f77bcf86cd799439014");
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
