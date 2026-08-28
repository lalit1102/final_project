import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IClass } from "@/types/class.types";
import { ICourse } from "@/types/course.types";
import { ISubject } from "@/types/subject.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { classService } from "@/services/class.service";
import { classRepository } from "@/repositories/class.repository";
import { courseRepository } from "@/repositories/course.repository";
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
    teacherId: "507f1f77bcf86cd799439011" as unknown as ISubject["teacherId"],
    isActive: true,
  },
  {
    _id: "607f1f77bcf86cd799439022" as unknown as ISubject["_id"],
    name: "Physics",
    code: "PHYS",
    teacherId: "507f1f77bcf86cd799439022" as unknown as ISubject["teacherId"],
    isActive: true,
  },
];

const mockCourses: Partial<ICourse>[] = [
  {
    _id: "707f1f77bcf86cd799439011" as unknown as ICourse["_id"],
    name: "Math 101",
    code: "MATH101",
    description: "Intro to math",
    subjectId: "607f1f77bcf86cd799439011" as unknown as ICourse["subjectId"],
    teacherId: "507f1f77bcf86cd799439011" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "707f1f77bcf86cd799439012" as unknown as ICourse["_id"],
    name: "Physics 101",
    code: "PHYS101",
    description: null,
    subjectId: "607f1f77bcf86cd799439022" as unknown as ICourse["subjectId"],
    teacherId: "507f1f77bcf86cd799439022" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockClasses: Partial<IClass>[] = [
  {
    _id: "807f1f77bcf86cd799439011" as unknown as IClass["_id"],
    name: "Math Class A",
    code: "CLSMATH1",
    description: "Intro math class",
    courseId: "707f1f77bcf86cd799439011" as unknown as IClass["courseId"],
    teacherId: "507f1f77bcf86cd799439011" as unknown as IClass["teacherId"],
    startDate: new Date("2025-02-01T00:00:00Z"),
    endDate: new Date("2025-06-01T00:00:00Z"),
    isActive: true,
    createdAt: new Date("2025-01-15T00:00:00Z"),
    updatedAt: new Date("2025-01-15T00:00:00Z"),
  },
  {
    _id: "807f1f77bcf86cd799439012" as unknown as IClass["_id"],
    name: "Physics Class B",
    code: "CLSPHYS1",
    description: null,
    courseId: "707f1f77bcf86cd799439012" as unknown as IClass["courseId"],
    teacherId: "507f1f77bcf86cd799439022" as unknown as IClass["teacherId"],
    startDate: null,
    endDate: null,
    isActive: true,
    createdAt: new Date("2025-01-20T00:00:00Z"),
    updatedAt: new Date("2025-01-20T00:00:00Z"),
  },
];

const defaultMockClassRepo = {
  create: async (data: Partial<IClass>) => ({ _id: "999999999999999999999999", isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data } as IClass),
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  update: async (_id: string, data: Partial<IClass>) => {
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    return { ...mockClasses[0], ...setObj } as IClass;
  },
  softDelete: async (id: string) => {
    const cls = mockClasses.find((c) => c._id?.toString() === id);
    if (!cls) return null;
    return { ...cls, isActive: false } as IClass;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter?: Record<string, unknown>) => mockClasses.length,
  findAllPaginated: async (_filter?: Record<string, unknown>, _page?: number, _limit?: number, _sortBy?: string, _sortOrder?: 1 | -1) => [...mockClasses] as IClass[],
};

const defaultMockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

const defaultMockSubjectRepo = {
  findById: async (id: string) => mockSubjects.find((s) => s._id?.toString() === id) ?? null,
};

type ClassMockOverrides = Partial<typeof defaultMockClassRepo>;
type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;

let classMockOverrides: ClassMockOverrides;
let courseMockOverrides: CourseMockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const classRepo = classRepository as unknown as Record<string, unknown>;
  const merged = { ...defaultMockClassRepo, ...classMockOverrides };
  classRepo.create = merged.create;
  classRepo.findById = merged.findById;
  classRepo.update = merged.update;
  classRepo.softDelete = merged.softDelete;
  classRepo.exists = merged.exists;
  classRepo.totalCount = merged.totalCount;
  classRepo.findAllPaginated = merged.findAllPaginated;

  const courseRepo = courseRepository as unknown as Record<string, unknown>;
  const courseSource = { ...defaultMockCourseRepo, ...courseMockOverrides };
  courseRepo.findById = courseSource.findById;

  const subjectRepo = subjectRepository as unknown as Record<string, unknown>;
  subjectRepo.findById = defaultMockSubjectRepo.findById;

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

describe("ClassService", () => {
  beforeEach(() => {
    classMockOverrides = {};
    courseMockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createClass", () => {
    it("should allow ADMIN to create a class with explicit teacher", async () => {
      const result = await classService.createClass(
        { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.name, "Math Class");
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should allow ADMIN to create a class without explicit teacher (defaults to admin)", async () => {
      const result = await classService.createClass(
        { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.teacherId, "507f1f77bcf86cd799439033");
    });

    it("should allow TEACHER to create a class with their own course", async () => {
      const result = await classService.createClass(
        { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
      assert.equal(result.courseId, "707f1f77bcf86cd799439011");
    });

    it("should ignore TEACHER-supplied teacherId and use authenticated ID", async () => {
      const result = await classService.createClass(
        { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should reject STUDENT role", async () => {
      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject nonexistent requester", async () => {
      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject nonexistent Course", async () => {
      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439999" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject inactive Course", async () => {
      courseMockOverrides = {
        findById: async () => ({ ...mockCourses[0], isActive: false } as ICourse),
      };
      installMockRepo();

      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER using another teacher's Course", async () => {
      try {
        await classService.createClass(
          { name: "Physics Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439012" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject ADMIN assigning class to non-TEACHER user", async () => {
      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439044" },
          "507f1f77bcf86cd799439033",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject ADMIN assigning class to nonexistent teacher", async () => {
      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439999" },
          "507f1f77bcf86cd799439033",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject duplicate code (11000)", async () => {
      classMockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { code: 1 } };
        },
      };
      installMockRepo();

      try {
        await classService.createClass(
          { name: "Math Class", code: "CLASS1", courseId: "707f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });

    it("should reject startDate >= endDate", async () => {
      try {
        await classService.createClass(
          {
            name: "Math Class",
            code: "CLASS1",
            courseId: "707f1f77bcf86cd799439011",
            startDate: "2025-06-01T00:00:00Z",
            endDate: "2025-06-01T00:00:00Z",
          },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.BAD_REQUEST);
      }
    });

    it("should accept valid date range (startDate < endDate)", async () => {
      const result = await classService.createClass(
        {
          name: "Math Class",
          code: "CLASS1",
          courseId: "707f1f77bcf86cd799439011",
          startDate: "2025-02-01T00:00:00Z",
          endDate: "2025-06-01T00:00:00Z",
        },
        "507f1f77bcf86cd799439011",
      );
      assert.ok(result.startDate);
      assert.ok(result.endDate);
    });

    it("should accept class without dates (both omitted)", async () => {
      const result = await classService.createClass(
        {
          name: "Math Class",
          code: "CLASS1",
          courseId: "707f1f77bcf86cd799439011",
        },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.startDate, null);
      assert.equal(result.endDate, null);
    });
  });

  describe("getClassById", () => {
    it("should allow ADMIN to get any class", async () => {
      const result = await classService.getClassById("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439033");
      assert.equal(result.name, "Math Class A");
    });

    it("should allow TEACHER to get own class", async () => {
      const result = await classService.getClassById("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      assert.equal(result.name, "Math Class A");
    });

    it("should return 404 for TEACHER accessing another teacher's class", async () => {
      try {
        await classService.getClassById("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439022");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent class", async () => {
      try {
        await classService.getClassById("807f1f77bcf86cd799439999", "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive class", async () => {
      classMockOverrides = {
        findById: async () => ({ ...mockClasses[0], isActive: false } as IClass),
      };
      installMockRepo();

      try {
        await classService.getClassById("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439033");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateClass (PUT)", () => {
    it("should allow TEACHER to update own class", async () => {
      classMockOverrides = {
        update: async (_id: string, data: Partial<IClass>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockClasses[0], ...setObj } as IClass;
        },
      };
      installMockRepo();

      const result = await classService.updateClass(
        "807f1f77bcf86cd799439011",
        { name: "Advanced Math Class", code: "CLASS2", description: "Updated", courseId: "707f1f77bcf86cd799439011", startDate: null, endDate: null },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Advanced Math Class");
      assert.equal(result.code, "CLASS2");
    });

    it("should reject TEACHER updating another teacher's class", async () => {
      try {
        await classService.updateClass(
          "807f1f77bcf86cd799439011",
          { name: "Hacked", code: "HACK", description: null, courseId: "707f1f77bcf86cd799439011", startDate: null, endDate: null },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to update any class", async () => {
      classMockOverrides = {
        update: async (_id: string, data: Partial<IClass>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockClasses[1], ...setObj } as IClass;
        },
      };
      installMockRepo();

      const result = await classService.updateClass(
        "807f1f77bcf86cd799439012",
        { name: "Updated Physics Class", code: "CLSPHYS2", description: null, courseId: "707f1f77bcf86cd799439012", startDate: null, endDate: null },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.name, "Updated Physics Class");
      assert.equal(result.code, "CLSPHYS2");
    });

    it("should reject invalid courseId", async () => {
      try {
        await classService.updateClass(
          "807f1f77bcf86cd799439011",
          { name: "Math", code: "M", description: null, courseId: "707f1f77bcf86cd799439999", startDate: null, endDate: null },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER changing courseId to another teacher's course", async () => {
      try {
        await classService.updateClass(
          "807f1f77bcf86cd799439011",
          { name: "Math", code: "M", description: null, courseId: "707f1f77bcf86cd799439012", startDate: null, endDate: null },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject invalid date range", async () => {
      try {
        await classService.updateClass(
          "807f1f77bcf86cd799439011",
          { name: "Math", code: "M", description: null, courseId: "707f1f77bcf86cd799439011", startDate: "2025-06-01T00:00:00Z", endDate: "2025-02-01T00:00:00Z" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.BAD_REQUEST);
      }
    });
  });

  describe("patchClass (PATCH)", () => {
    it("should allow TEACHER to partially update own class", async () => {
      classMockOverrides = {
        update: async (_id: string, data: Partial<IClass>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockClasses[0], ...setObj } as IClass;
        },
      };
      installMockRepo();

      const result = await classService.patchClass(
        "807f1f77bcf86cd799439011",
        { name: "Math Class Updated" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Math Class Updated");
    });

    it("should reject TEACHER patching another teacher's class", async () => {
      try {
        await classService.patchClass(
          "807f1f77bcf86cd799439011",
          { name: "Hacked" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return same class if no updates provided", async () => {
      const result = await classService.patchClass(
        "807f1f77bcf86cd799439011",
        {},
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Math Class A");
      assert.equal(result.id, "807f1f77bcf86cd799439011");
    });

    it("should reject TEACHER patching courseId to another teacher's course", async () => {
      try {
        await classService.patchClass(
          "807f1f77bcf86cd799439011",
          { courseId: "707f1f77bcf86cd799439012" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should accept partial date patch", async () => {
      classMockOverrides = {
        update: async (_id: string, data: Partial<IClass>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockClasses[0], ...setObj } as IClass;
        },
      };
      installMockRepo();

      const result = await classService.patchClass(
        "807f1f77bcf86cd799439011",
        { startDate: "2025-03-01T00:00:00Z" },
        "507f1f77bcf86cd799439011",
      );

      assert.ok(result.startDate);
    });

    it("should reject PATCH with invalid date range", async () => {
      try {
        await classService.patchClass(
          "807f1f77bcf86cd799439012",
          { startDate: "2025-06-01T00:00:00Z", endDate: "2025-02-01T00:00:00Z" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.BAD_REQUEST);
      }
    });
  });

  describe("deleteClass (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own class", async () => {
      const result = await classService.deleteClass("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's class", async () => {
      try {
        await classService.deleteClass("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439022");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent class", async () => {
      try {
        await classService.deleteClass("807f1f77bcf86cd799439999", "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should behave consistently on repeated deactivation", async () => {
      const result1 = await classService.deleteClass("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      const result2 = await classService.deleteClass("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");

      assert.equal(result1.isActive, false);
      assert.equal(result2.isActive, false);
    });

    it("should allow ADMIN to soft-delete any class", async () => {
      const result = await classService.deleteClass("807f1f77bcf86cd799439012", "507f1f77bcf86cd799439033");
      assert.equal(result.isActive, false);
    });
  });

  describe("listClasses", () => {
    it("should return all classes for ADMIN", async () => {
      const result = await classService.listClasses(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.classes.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should return only teacher's own classes for TEACHER", async () => {
      classMockOverrides = {
        findAllPaginated: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockClasses.filter((c) => c.teacherId?.toString() === teacherId) as IClass[];
        },
        totalCount: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockClasses.filter((c) => c.teacherId?.toString() === teacherId).length;
        },
      };
      installMockRepo();

      const result = await classService.listClasses(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.classes.length, 1);
      assert.equal(result.classes[0].teacherId, "507f1f77bcf86cd799439011");
    });

    it("should respect pagination", async () => {
      const result = await classService.listClasses(
        { page: 1, limit: 10 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
    });

    it("should reject STUDENT role", async () => {
      try {
        await classService.listClasses({ page: 1, limit: 20 }, "507f1f77bcf86cd799439044");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `Expected AppError but got: ${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should filter by courseId", async () => {
      const result = await classService.listClasses(
        { page: 1, limit: 20, courseId: "707f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.classes.length, 2);
    });

    it("should support search", async () => {
      classMockOverrides = {
        findAllPaginated: async (filter?: Record<string, unknown>) => {
          const or = (filter?.["$or"] as Array<{ [k: string]: { $regex: string; $options: string } }> | undefined);
          const regexMatch = (field: string): IClass[] => {
            const pattern = or?.[0]?.[field]?.$regex;
            const opts = or?.[0]?.[field]?.$options;
            if (!pattern || !opts) return [];
            const re = new RegExp(pattern, opts);
            return mockClasses.filter((c) => re.test(c.name ?? "") || re.test(c.code ?? "")) as IClass[];
          };
          return regexMatch("name");
        },
        totalCount: async (filter?: Record<string, unknown>) => {
          const or = (filter?.["$or"] as Array<{ [k: string]: { $regex: string; $options: string } }> | undefined);
          const pattern = or?.[0]?.name?.$regex;
          const opts = or?.[0]?.name?.$options;
          if (!pattern || !opts) return mockClasses.length;
          const re = new RegExp(pattern, opts);
          return mockClasses.filter((c) => re.test(c.name ?? "") || re.test(c.code ?? "")).length;
        },
      };
      installMockRepo();

      const result = await classService.listClasses(
        { page: 1, limit: 20, search: "Physics" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.classes.length, 1);
      assert.equal(result.classes[0].name, "Physics Class B");
    });
  });
});
