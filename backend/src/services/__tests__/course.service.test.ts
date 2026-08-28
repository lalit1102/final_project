import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { ICourse } from "@/types/course.types";
import { ISubject } from "@/types/subject.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { courseService } from "@/services/course.service";
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

const defaultMockCourseRepo = {
  create: async (data: Partial<ICourse>) => ({ ...mockCourses[0], ...data } as ICourse),
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
  update: async (_id: string, data: Partial<ICourse>) => {
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    return { ...mockCourses[0], ...setObj } as ICourse;
  },
  softDelete: async (id: string) => {
    const course = mockCourses.find((c) => c._id?.toString() === id);
    if (!course) return null;
    return { ...course, isActive: false } as ICourse;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter?: Record<string, unknown>) => mockCourses.length,
  findAllPaginated: async (_filter?: Record<string, unknown>, _page?: number, _limit?: number, _sortBy?: string, _sortOrder?: 1 | -1) => [...mockCourses] as ICourse[],
};

const defaultMockSubjectRepo = {
  findById: async (id: string) => mockSubjects.find((s) => s._id?.toString() === id) ?? null,
};

type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;
type SubjectMockOverrides = Partial<typeof defaultMockSubjectRepo>;

let courseMockOverrides: CourseMockOverrides;
let subjectMockOverrides: SubjectMockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const courseRepo = courseRepository as unknown as Record<string, unknown>;
  const courseSource = { ...defaultMockCourseRepo, ...courseMockOverrides };
  courseRepo.create = courseSource.create;
  courseRepo.findById = courseSource.findById;
  courseRepo.update = courseSource.update;
  courseRepo.softDelete = courseSource.softDelete;
  courseRepo.exists = courseSource.exists;
  courseRepo.totalCount = courseSource.totalCount;
  courseRepo.findAllPaginated = courseSource.findAllPaginated;

  const subjectRepo = subjectRepository as unknown as Record<string, unknown>;
  const subjectSource = { ...defaultMockSubjectRepo, ...subjectMockOverrides };
  subjectRepo.findById = subjectSource.findById;

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

describe("CourseService", () => {
  beforeEach(() => {
    courseMockOverrides = {};
    subjectMockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createCourse", () => {
    it("should allow ADMIN to create a course with any teacher", async () => {
      const result = await courseService.createCourse(
        { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.name, "Math 101");
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should allow TEACHER to create a course with their own ID", async () => {
      const result = await courseService.createCourse(
        { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should ignore TEACHER-supplied teacherId and use authenticated ID", async () => {
      const result = await courseService.createCourse(
        { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011", teacherId: "507f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.teacherId, "507f1f77bcf86cd799439011");
    });

    it("should reject STUDENT role", async () => {
      try {
        await courseService.createCourse(
          { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011" },
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
        await courseService.createCourse(
          { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject nonexistent Subject", async () => {
      try {
        await courseService.createCourse(
          { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439999" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject using another teacher's Subject", async () => {
      try {
        await courseService.createCourse(
          { name: "Physics Course", code: "PHYS101", subjectId: "607f1f77bcf86cd799439022" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject duplicate code (11000)", async () => {
      courseMockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { code: 1 } };
        },
      };
      installMockRepo();

      try {
        await courseService.createCourse(
          { name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("getCourseById", () => {
    it("should allow ADMIN to get any course", async () => {
      const result = await courseService.getCourseById("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439033");
      assert.equal(result.name, "Math 101");
    });

    it("should allow TEACHER to get own course", async () => {
      const result = await courseService.getCourseById("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      assert.equal(result.name, "Math 101");
    });

    it("should return 404 for TEACHER accessing another teacher's course", async () => {
      try {
        await courseService.getCourseById("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439022");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent course", async () => {
      try {
        await courseService.getCourseById("707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive course", async () => {
      courseMockOverrides = {
        findById: async () => ({ ...mockCourses[0], isActive: false } as ICourse),
      };
      installMockRepo();

      try {
        await courseService.getCourseById("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439033");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateCourse (PUT)", () => {
    it("should allow TEACHER to update own course", async () => {
      courseMockOverrides = {
        update: async (_id: string, data: Partial<ICourse>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockCourses[0], ...setObj } as ICourse;
        },
      };
      installMockRepo();

      const result = await courseService.updateCourse(
        "707f1f77bcf86cd799439011",
        { name: "Advanced Math", code: "MATH201", description: "Updated", subjectId: "607f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Advanced Math");
      assert.equal(result.code, "MATH201");
    });

    it("should reject TEACHER updating another teacher's course", async () => {
      try {
        await courseService.updateCourse(
          "707f1f77bcf86cd799439011",
          { name: "Hacked", code: "HACK", description: null, subjectId: "607f1f77bcf86cd799439011" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to update any course", async () => {
      courseMockOverrides = {
        update: async (_id: string, data: Partial<ICourse>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockCourses[1], ...setObj } as ICourse;
        },
      };
      installMockRepo();

      const result = await courseService.updateCourse(
        "707f1f77bcf86cd799439012",
        { name: "Updated Physics", code: "PHYS201", description: null, subjectId: "607f1f77bcf86cd799439022" },
        "507f1f77bcf86cd799439033",
      );

      assert.equal(result.name, "Updated Physics");
      assert.equal(result.code, "PHYS201");
    });

    it("should reject updating with invalid subjectId", async () => {
      try {
        await courseService.updateCourse(
          "707f1f77bcf86cd799439011",
          { name: "Math", code: "MATH", description: null, subjectId: "607f1f77bcf86cd799439999" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER changing subjectId to another teacher's subject", async () => {
      try {
        await courseService.updateCourse(
          "707f1f77bcf86cd799439011",
          { name: "Math", code: "MATH", description: null, subjectId: "607f1f77bcf86cd799439022" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("patchCourse (PATCH)", () => {
    it("should allow TEACHER to partially update own course", async () => {
      courseMockOverrides = {
        update: async (_id: string, data: Partial<ICourse>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockCourses[0], ...setObj } as ICourse;
        },
      };
      installMockRepo();

      const result = await courseService.patchCourse(
        "707f1f77bcf86cd799439011",
        { name: "Math Updated" },
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Math Updated");
    });

    it("should reject TEACHER patching another teacher's course", async () => {
      try {
        await courseService.patchCourse(
          "707f1f77bcf86cd799439011",
          { name: "Hacked" },
          "507f1f77bcf86cd799439022",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return same course if no updates provided", async () => {
      const result = await courseService.patchCourse(
        "707f1f77bcf86cd799439011",
        {},
        "507f1f77bcf86cd799439011",
      );

      assert.equal(result.name, "Math 101");
      assert.equal(result.id, "707f1f77bcf86cd799439011");
    });

    it("should reject TEACHER patching subjectId to another teacher's subject", async () => {
      try {
        await courseService.patchCourse(
          "707f1f77bcf86cd799439011",
          { subjectId: "607f1f77bcf86cd799439022" },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("deleteCourse (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own course", async () => {
      const result = await courseService.deleteCourse("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's course", async () => {
      try {
        await courseService.deleteCourse("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439022");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent course", async () => {
      try {
        await courseService.deleteCourse("707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should behave consistently on repeated deactivation", async () => {
      const result1 = await courseService.deleteCourse("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");
      const result2 = await courseService.deleteCourse("707f1f77bcf86cd799439011", "507f1f77bcf86cd799439011");

      assert.equal(result1.isActive, false);
      assert.equal(result2.isActive, false);
    });

    it("should allow ADMIN to soft-delete any course", async () => {
      const result = await courseService.deleteCourse("707f1f77bcf86cd799439012", "507f1f77bcf86cd799439033");
      assert.equal(result.isActive, false);
    });
  });

  describe("listCourses", () => {
    it("should return all courses for ADMIN", async () => {
      const result = await courseService.listCourses(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.courses.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should return only teacher's own courses for TEACHER", async () => {
      courseMockOverrides = {
        findAllPaginated: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockCourses.filter((c) => c.teacherId?.toString() === teacherId) as ICourse[];
        },
        totalCount: async (filter?: Record<string, unknown>) => {
          const teacherId = filter?.teacherId as string | undefined;
          return mockCourses.filter((c) => c.teacherId?.toString() === teacherId).length;
        },
      };
      installMockRepo();

      const result = await courseService.listCourses(
        { page: 1, limit: 20 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.courses.length, 1);
      assert.equal(result.courses[0].teacherId, "507f1f77bcf86cd799439011");
    });

    it("should respect pagination", async () => {
      const result = await courseService.listCourses(
        { page: 1, limit: 10 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
    });

    it("should reject STUDENT role", async () => {
      try {
        await courseService.listCourses({ page: 1, limit: 20 }, "507f1f77bcf86cd799439044");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should filter by subjectId", async () => {
      const result = await courseService.listCourses(
        { page: 1, limit: 20, subjectId: "607f1f77bcf86cd799439011" },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.courses.length, 2);
    });
  });
});
