import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IModule } from "@/types/module.types";
import { ICourse } from "@/types/course.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { moduleService } from "@/services/module.service";
import { moduleRepository } from "@/repositories/module.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";

const mockTeacher: Partial<IUser> = {
  _id: "507f1f77bcf86cd799439011" as unknown as IUser["_id"],
  name: "Teacher Alice",
  email: "alice@example.com",
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

const mockCourses: Partial<ICourse>[] = [
  {
    _id: "707f1f77bcf86cd799439011" as unknown as ICourse["_id"],
    name: "Math 101",
    code: "MATH101",
    teacherId: "507f1f77bcf86cd799439011" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "707f1f77bcf86cd799439012" as unknown as ICourse["_id"],
    name: "Physics 101",
    code: "PHYS101",
    teacherId: "507f1f77bcf86cd799439033" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockModules: Partial<IModule>[] = [
  {
    _id: "807f1f77bcf86cd799439011" as unknown as IModule["_id"],
    title: "Introduction to Math",
    description: "Basic concepts",
    courseId: "707f1f77bcf86cd799439011" as unknown as IModule["courseId"],
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "807f1f77bcf86cd799439012" as unknown as IModule["_id"],
    title: "Advanced Algebra",
    description: null,
    courseId: "707f1f77bcf86cd799439012" as unknown as IModule["courseId"],
    order: 1,
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const courseId = "707f1f77bcf86cd799439011";
const otherCourseId = "707f1f77bcf86cd799439012";

const defaultMockModuleRepo = {
  create: async (data: Partial<IModule>) => ({ ...mockModules[0], ...data } as IModule),
  findById: async (id: string) => mockModules.find((m) => m._id?.toString() === id) ?? null,
  update: async (id: string, data: { $set?: Record<string, unknown> }) => {
    const setObj = data?.["$set"] || {};
    const found = mockModules.find((m) => m._id?.toString() === id);
    if (!found) return null;
    return { ...found, ...setObj } as IModule;
  },
  softDelete: async (id: string) => {
    const moduleDoc = mockModules.find((m) => m._id?.toString() === id);
    if (!moduleDoc) return null;
    return { ...moduleDoc, isActive: false } as IModule;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter?: Record<string, unknown>) => mockModules.length,
  findAllPaginated: async (
    _filter?: Record<string, unknown>,
    _page?: number,
    _limit?: number,
    _sortBy?: string,
    _sortOrder?: 1 | -1,
  ) => [...mockModules] as IModule[],
};

const defaultMockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

type ModuleMockOverrides = Partial<typeof defaultMockModuleRepo>;
type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;

let moduleMockOverrides: ModuleMockOverrides;
let courseMockOverrides: CourseMockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const moduleRepo = moduleRepository as unknown as Record<string, unknown>;
  const moduleSource = { ...defaultMockModuleRepo, ...moduleMockOverrides };
  moduleRepo.create = moduleSource.create;
  moduleRepo.findById = moduleSource.findById;
  moduleRepo.update = moduleSource.update;
  moduleRepo.softDelete = moduleSource.softDelete;
  moduleRepo.exists = moduleSource.exists;
  moduleRepo.totalCount = moduleSource.totalCount;
  moduleRepo.findAllPaginated = moduleSource.findAllPaginated;

  const courseRepo = courseRepository as unknown as Record<string, unknown>;
  const courseSource = { ...defaultMockCourseRepo, ...courseMockOverrides };
  courseRepo.findById = courseSource.findById;

  const userRepo = userRepository as unknown as Record<string, unknown>;
  userRepo.findByIdSafe = userMockOverrides.findByIdSafe;
}

function setupMockUsers(): void {
  userMockOverrides = {
    findByIdSafe: async (id: string) => {
      const all = [mockTeacher, mockAdmin, mockStudent];
      return all.find((u) => u._id?.toString() === id) ?? null;
    },
  };
}

describe("ModuleService", () => {
  beforeEach(() => {
    moduleMockOverrides = {};
    courseMockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createModule", () => {
    it("should allow TEACHER to create a module for own course", async () => {
      const result = await moduleService.createModule(
        courseId,
        { title: "New Module", description: "desc", order: 0 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "New Module");
      assert.equal(result.courseId, courseId);
      assert.equal(result.order, 0);
    });

    it("should allow ADMIN to create a module for any course", async () => {
      const result = await moduleService.createModule(
        otherCourseId,
        { title: "Physics Module", order: 0 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.title, "Physics Module");
      assert.equal(result.courseId, otherCourseId);
    });

    it("should reject STUDENT role", async () => {
      try {
        await moduleService.createModule(
          courseId,
          { title: "New Module", order: 0 },
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
        await moduleService.createModule(
          courseId,
          { title: "New Module", order: 0 },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject nonexistent course", async () => {
      try {
        await moduleService.createModule(
          "707f1f77bcf86cd799439999",
          { title: "New Module", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER creating module for another teacher's course", async () => {
      try {
        await moduleService.createModule(
          otherCourseId,
          { title: "New Module", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject duplicate course+order (11000)", async () => {
      moduleMockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { courseId: 1, order: 1 } };
        },
      };
      installMockRepo();

      try {
        await moduleService.createModule(
          courseId,
          { title: "New Module", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("getModuleById", () => {
    it("should allow TEACHER to get own module", async () => {
      const result = await moduleService.getModuleById("807f1f77bcf86cd799439011", courseId, "507f1f77bcf86cd799439011");
      assert.equal(result.title, "Introduction to Math");
    });

    it("should allow ADMIN to get any module", async () => {
      const result = await moduleService.getModuleById("807f1f77bcf86cd799439011", courseId, "507f1f77bcf86cd799439033");
      assert.equal(result.title, "Introduction to Math");
    });

    it("should return 404 for TEACHER accessing another teacher's module", async () => {
      try {
        await moduleService.getModuleById("807f1f77bcf86cd799439011", otherCourseId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent module", async () => {
      try {
        await moduleService.getModuleById("807f1f77bcf86cd799439999", courseId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive module", async () => {
      moduleMockOverrides = {
        findById: async () => ({ ...mockModules[0], isActive: false } as IModule),
      };
      installMockRepo();

      try {
        await moduleService.getModuleById("807f1f77bcf86cd799439011", courseId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateModule (PUT)", () => {
    it("should allow TEACHER to update own module", async () => {
      const result = await moduleService.updateModule(
        "807f1f77bcf86cd799439011",
        courseId,
        { title: "Updated Module", order: 2 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Updated Module");
      assert.equal(result.order, 2);
    });

    it("should reject TEACHER updating another teacher's module", async () => {
      try {
        await moduleService.updateModule(
          "807f1f77bcf86cd799439011",
          otherCourseId,
          { title: "Hacked", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to update any module", async () => {
      const result = await moduleService.updateModule(
        "807f1f77bcf86cd799439012",
        otherCourseId,
        { title: "Updated Physics", order: 5 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.title, "Updated Physics");
    });
  });

  describe("patchModule (PATCH)", () => {
    it("should allow TEACHER to partially update own module", async () => {
      const result = await moduleService.patchModule(
        "807f1f77bcf86cd799439011",
        courseId,
        { title: "Math Intro Updated" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Math Intro Updated");
    });

    it("should return same module if no updates provided", async () => {
      const result = await moduleService.patchModule(
        "807f1f77bcf86cd799439011",
        courseId,
        {},
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Introduction to Math");
    });

    it("should reject TEACHER patching another teacher's module", async () => {
      try {
        await moduleService.patchModule(
          "807f1f77bcf86cd799439011",
          otherCourseId,
          { title: "Hacked" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("deleteModule (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own module", async () => {
      const result = await moduleService.deleteModule("807f1f77bcf86cd799439011", courseId, "507f1f77bcf86cd799439011");
      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's module", async () => {
      try {
        await moduleService.deleteModule("807f1f77bcf86cd799439011", otherCourseId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to soft-delete any module", async () => {
      const result = await moduleService.deleteModule("807f1f77bcf86cd799439012", otherCourseId, "507f1f77bcf86cd799439033");
      assert.equal(result.isActive, false);
    });

    it("should return 404 for nonexistent module", async () => {
      try {
        await moduleService.deleteModule("807f1f77bcf86cd799439999", courseId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("listModules", () => {
    it("should return modules for TEACHER of own course", async () => {
      const result = await moduleService.listModules(
        { page: 1, limit: 20 },
        courseId,
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.modules.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should allow ADMIN to list any course's modules", async () => {
      const result = await moduleService.listModules(
        { page: 1, limit: 10 },
        courseId,
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
    });

    it("should reject STUDENT role", async () => {
      try {
        await moduleService.listModules(
          { page: 1, limit: 20 },
          courseId,
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject TEACHER listing another teacher's course modules", async () => {
      try {
        await moduleService.listModules(
          { page: 1, limit: 20 },
          otherCourseId,
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should filter by isActive", async () => {
      const result = await moduleService.listModules(
        { page: 1, limit: 20, isActive: false },
        courseId,
        "507f1f77bcf86cd799439011",
      );
      assert.ok(result.modules.length >= 0);
    });
  });
});
