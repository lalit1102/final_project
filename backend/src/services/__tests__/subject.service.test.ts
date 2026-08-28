import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { ISubject } from "@/types/subject.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { subjectService } from "@/services/subject.service";
import { subjectRepository } from "@/repositories/subject.repository";
import { userRepository } from "@/repositories/user.repository";

const mockTeacher: Partial<IUser> = {
  _id: "507f1f77bcf86cd799439011" as unknown as IUser["_id"],
  name: "Teacher Alice",
  email: "alice@example.com",
  role: UserRole.TEACHER,
  isActive: true,
  isVerified: true,
};

const mockOtherTeacher: Partial<IUser> = {
  _id: "507f1f77bcf86cd799439022" as unknown as IUser["_id"],
  name: "Teacher Bob",
  email: "bob@example.com",
  role: UserRole.TEACHER,
  isActive: true,
  isVerified: true,
};

const mockAdmin: Partial<IUser> = {
  _id: "507f1f77bcf86cd799439033" as unknown as IUser["_id"],
  name: "Admin Root",
  email: "admin@example.com",
  role: UserRole.ADMIN,
  isActive: true,
  isVerified: true,
};

const mockStudent: Partial<IUser> = {
  _id: "507f1f77bcf86cd799439044" as unknown as IUser["_id"],
  name: "Student Carol",
  email: "carol@example.com",
  role: UserRole.STUDENT,
  isActive: true,
  isVerified: true,
};

const mockSubjects: Partial<ISubject>[] = [
  {
    _id: "607f1f77bcf86cd799439011" as unknown as ISubject["_id"],
    name: "Mathematics",
    code: "MATH",
    description: "Core mathematics",
    teacherId: "507f1f77bcf86cd799439011" as unknown as ISubject["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "607f1f77bcf86cd799439012" as unknown as ISubject["_id"],
    name: "Physics",
    code: "PHYS",
    description: null,
    teacherId: "507f1f77bcf86cd799439022" as unknown as ISubject["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const defaultMock = {
  create: async (data: Partial<ISubject>) => ({ ...mockSubjects[0], ...data } as ISubject),
  findById: async (id: string) => mockSubjects.find((s) => s._id?.toString() === id) ?? null,
  update: async (_id: string, data: Partial<ISubject>) => {
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    return { ...mockSubjects[0], ...setObj } as ISubject;
  },
  softDelete: async (id: string) => {
    const subject = mockSubjects.find((s) => s._id?.toString() === id);
    if (!subject) return null;
    return { ...subject, isActive: false } as ISubject;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter: Record<string, unknown> = {}) => mockSubjects.length,
  findAllPaginated: async (_filter: Record<string, unknown> = {}, _page: number = 1, _limit: number = 20, _sortBy: string = "createdAt", _sortOrder: 1 | -1 = -1) => [...mockSubjects] as ISubject[],
};

type MockOverrides = Partial<typeof defaultMock>;

let mockOverrides: MockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const repo = subjectRepository as unknown as Record<string, unknown>;
  const source = { ...defaultMock, ...mockOverrides };
  repo.create = source.create;
  repo.findById = source.findById;
  repo.update = source.update;
  repo.softDelete = source.softDelete;
  repo.exists = source.exists;
  repo.totalCount = source.totalCount;
  repo.findAllPaginated = source.findAllPaginated;

  const userRepo = userRepository as unknown as Record<string, unknown>;
  userRepo.findByIdSafe = userMockOverrides.findByIdSafe;
}

function setupMockUsers(): void {
  userMockOverrides = {
    findByIdSafe: async (id: string) => {
      const all = [mockTeacher, mockOtherTeacher, mockAdmin, mockStudent];
      return all.find((u) => u._id?.toString() === id) ?? null;
    },
  };
}

describe("SubjectService", () => {
  beforeEach(() => {
    mockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createSubject", () => {
    it("should allow ADMIN to create a subject with any teacher", async () => {
      mockOverrides = {
        create: async (data: Partial<ISubject>) => ({ ...mockSubjects[0], ...data } as ISubject),
      };
      installMockRepo();

      const result = await subjectService.createSubject(
        { name: "Mathematics", code: "MATH", teacherId: "507f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.name, "Mathematics");
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should allow TEACHER to create a subject with their own ID", async () => {
      mockOverrides = {
        create: async (data: Partial<ISubject>) => ({ ...mockSubjects[0], ...data } as ISubject),
      };
      installMockRepo();

      const result = await subjectService.createSubject(
        { name: "Mathematics", code: "MATH", teacherId: "507f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Mathematics");
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should ignore TEACHER-supplied teacherId and use authenticated ID", async () => {
      mockOverrides = {
        create: async (data: Partial<ISubject>) => ({ ...mockSubjects[0], ...data } as ISubject),
      };
      installMockRepo();

      const result = await subjectService.createSubject(
        { name: "Mathematics", code: "MATH", teacherId: "507f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should reject STUDENT role", async () => {
      try {
        await subjectService.createSubject(
          { name: "Mathematics", code: "MATH" },
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject nonexistent requester", async () => {
      try {
        await subjectService.createSubject(
          { name: "Mathematics", code: "MATH" },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject duplicate code (11000)", async () => {
      mockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { code: 1 } };
        },
      };
      installMockRepo();

      try {
        await subjectService.createSubject(
          { name: "Mathematics", code: "MATH" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("getSubjectById", () => {
    it("should allow ADMIN to get any subject", async () => {
      const result = await subjectService.getSubjectById(
        "607f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.name, "Mathematics");
    });

    it("should allow TEACHER to get own subject", async () => {
      const result = await subjectService.getSubjectById(
        "607f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.name, "Mathematics");
    });

    it("should return 404 for TEACHER accessing another teacher's subject", async () => {
      try {
        await subjectService.getSubjectById(
          "607f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent subject", async () => {
      try {
        await subjectService.getSubjectById(
          "607f1f77bcf86cd799439999",
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive subject", async () => {
      mockOverrides = {
        findById: async () => ({ ...mockSubjects[0], isActive: false } as ISubject),
      };
      installMockRepo();

      try {
        await subjectService.getSubjectById(
          "607f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439033",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateSubject (PUT)", () => {
    it("should allow TEACHER to update own subject", async () => {
      mockOverrides = {
        update: async (_id: string, data: Partial<ISubject>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockSubjects[0], ...setObj } as ISubject;
        },
      };
      installMockRepo();

      const result = await subjectService.updateSubject(
        "607f1f77bcf86cd799439011",
        { name: "Advanced Mathematics", code: "MATH201", description: "Updated desc" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Advanced Mathematics");
      assert.equal(result.code, "MATH201");
    });

    it("should reject TEACHER updating another teacher's subject", async () => {
      try {
        await subjectService.updateSubject(
          "607f1f77bcf86cd799439011",
          { name: "Hacked", code: "HACKED" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to update any subject", async () => {
      mockOverrides = {
        update: async (_id: string, data: Partial<ISubject>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockSubjects[0], ...setObj } as ISubject;
        },
      };
      installMockRepo();

      const result = await subjectService.updateSubject(
        "607f1f77bcf86cd799439012",
        { name: "Updated Physics", code: "PHYS201", description: null },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.name, "Updated Physics");
      assert.equal(result.code, "PHYS201");
      assert.equal(result.description, null);
    });
  });

  describe("patchSubject (PATCH)", () => {
    it("should allow TEACHER to partially update own subject", async () => {
      mockOverrides = {
        update: async (_id: string, data: Partial<ISubject>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockSubjects[0], ...setObj } as ISubject;
        },
      };
      installMockRepo();

      const result = await subjectService.patchSubject(
        "607f1f77bcf86cd799439011",
        { name: "Math Updated" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Math Updated");
    });

    it("should reject TEACHER patching another teacher's subject", async () => {
      try {
        await subjectService.patchSubject(
          "607f1f77bcf86cd799439011",
          { name: "Hacked" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return same subject if no updates provided", async () => {
      const result = await subjectService.patchSubject(
        "607f1f77bcf86cd799439011",
        {},
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Mathematics");
      assert.equal(result.id, "607f1f77bcf86cd799439011");
    });
  });

  describe("deleteSubject (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own subject", async () => {
      const result = await subjectService.deleteSubject(
        "607f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's subject", async () => {
      try {
        await subjectService.deleteSubject(
          "607f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent subject", async () => {
      try {
        await subjectService.deleteSubject(
          "607f1f77bcf86cd799439999",
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should behave consistently on repeated deactivation", async () => {
      const result1 = await subjectService.deleteSubject(
        "607f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439011",
      );
      const result2 = await subjectService.deleteSubject(
        "607f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result1.isActive, false);
      assert.equal(result2.isActive, false);
    });

    it("should allow ADMIN to soft-delete any subject", async () => {
      const result = await subjectService.deleteSubject(
        "607f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.isActive, false);
    });
  });

  describe("listSubjects", () => {
    it("should return all subjects for ADMIN", async () => {
      const result = await subjectService.listSubjects(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.subjects.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should return only teacher's own subjects for TEACHER", async () => {
      mockOverrides = {
        findAllPaginated: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockSubjects.filter((s) => s.teacherId?.toString() === teacherId) as ISubject[];
        },
        totalCount: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockSubjects.filter((s) => s.teacherId?.toString() === teacherId).length;
        },
      };
      installMockRepo();

      const result = await subjectService.listSubjects(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.subjects.length, 1);
      assert.equal(result.subjects[0].teacherId, "507f1f77bcf86cd799439011");
    });

    it("should respect pagination", async () => {
      mockOverrides = {
        findAllPaginated: async () => mockSubjects as ISubject[],
        totalCount: async () => 2,
      };
      installMockRepo();

      const result = await subjectService.listSubjects(
        { page: 1, limit: 10 },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
      assert.equal(result.pagination.totalPages, 1);
    });

    it("should reject STUDENT role", async () => {
      try {
        await subjectService.listSubjects(
          { page: 1, limit: 20 },
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });
  });
});
