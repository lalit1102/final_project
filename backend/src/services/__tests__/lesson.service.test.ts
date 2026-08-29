import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { ILesson, LessonContentType } from "@/types/lesson.types";
import { IModule } from "@/types/module.types";
import { ICourse } from "@/types/course.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { lessonService } from "@/services/lesson.service";
import { lessonRepository } from "@/repositories/lesson.repository";
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
    courseId: "707f1f77bcf86cd799439011" as unknown as IModule["courseId"],
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "807f1f77bcf86cd799439012" as unknown as IModule["_id"],
    title: "Physics Module",
    courseId: "707f1f77bcf86cd799439012" as unknown as IModule["courseId"],
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockLessons: Partial<ILesson>[] = [
  {
    _id: "907f1f77bcf86cd799439011" as unknown as ILesson["_id"],
    title: "Variables and Expressions",
    description: "Algebraic basics",
    moduleId: "807f1f77bcf86cd799439011" as unknown as ILesson["moduleId"],
    contentType: LessonContentType.VIDEO,
    content: "https://example.com/video.mp4",
    durationMinutes: 15,
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "907f1f77bcf86cd799439012" as unknown as ILesson["_id"],
    title: "Quantum Basics",
    description: null,
    moduleId: "807f1f77bcf86cd799439012" as unknown as ILesson["moduleId"],
    contentType: LessonContentType.TEXT,
    content: "Text content here",
    durationMinutes: 10,
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const moduleId = "807f1f77bcf86cd799439011";
const otherModuleId = "807f1f77bcf86cd799439012";

const defaultMockLessonRepo = {
  create: async (data: Partial<ILesson>) => ({ ...mockLessons[0], ...data } as ILesson),
  findById: async (id: string) => mockLessons.find((l) => l._id?.toString() === id) ?? null,
  update: async (id: string, data: { $set?: Record<string, unknown> }) => {
    const setObj = data?.["$set"] || {};
    const found = mockLessons.find((l) => l._id?.toString() === id);
    if (!found) return null;
    return { ...found, ...setObj } as ILesson;
  },
  softDelete: async (id: string) => {
    const lesson = mockLessons.find((l) => l._id?.toString() === id);
    if (!lesson) return null;
    return { ...lesson, isActive: false } as ILesson;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter?: Record<string, unknown>) => mockLessons.length,
  findAllPaginated: async (
    _filter?: Record<string, unknown>,
    _page?: number,
    _limit?: number,
    _sortBy?: string,
    _sortOrder?: 1 | -1,
  ) => [...mockLessons] as ILesson[],
};

const defaultMockModuleRepo = {
  findById: async (id: string) => mockModules.find((m) => m._id?.toString() === id) ?? null,
};

const defaultMockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

type LessonMockOverrides = Partial<typeof defaultMockLessonRepo>;
type ModuleMockOverrides = Partial<typeof defaultMockModuleRepo>;
type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;

let lessonMockOverrides: LessonMockOverrides;
let moduleMockOverrides: ModuleMockOverrides;
let courseMockOverrides: CourseMockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const lessonRepo = lessonRepository as unknown as Record<string, unknown>;
  const lessonSource = { ...defaultMockLessonRepo, ...lessonMockOverrides };
  lessonRepo.create = lessonSource.create;
  lessonRepo.findById = lessonSource.findById;
  lessonRepo.update = lessonSource.update;
  lessonRepo.softDelete = lessonSource.softDelete;
  lessonRepo.exists = lessonSource.exists;
  lessonRepo.totalCount = lessonSource.totalCount;
  lessonRepo.findAllPaginated = lessonSource.findAllPaginated;

  const moduleRepo = moduleRepository as unknown as Record<string, unknown>;
  const moduleSource = { ...defaultMockModuleRepo, ...moduleMockOverrides };
  moduleRepo.findById = moduleSource.findById;

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

describe("LessonService", () => {
  beforeEach(() => {
    lessonMockOverrides = {};
    moduleMockOverrides = {};
    courseMockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createLesson", () => {
    it("should allow TEACHER to create a lesson for own course module", async () => {
      const result = await lessonService.createLesson(
        moduleId,
        { title: "New Lesson", contentType: LessonContentType.VIDEO, content: "https://example.com/v.mp4", durationMinutes: 10, order: 0 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "New Lesson");
      assert.equal(result.moduleId, moduleId);
      assert.equal(result.order, 0);
    });

    it("should allow ADMIN to create a lesson for any module", async () => {
      const result = await lessonService.createLesson(
        otherModuleId,
          { title: "Physics Lesson", contentType: LessonContentType.TEXT, content: "text content", durationMinutes: 0, order: 0 },
          "507f1f77bcf86cd799439033",
      );
      assert.equal(result.title, "Physics Lesson");
    });

    it("should reject STUDENT role", async () => {
      try {
        await lessonService.createLesson(
          moduleId,
          { title: "New Lesson", contentType: LessonContentType.VIDEO, content: "https://example.com/v.mp4", durationMinutes: 0, order: 0 },
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
        await lessonService.createLesson(
          moduleId,
          { title: "New Lesson", contentType: LessonContentType.VIDEO, content: "https://example.com/v.mp4", durationMinutes: 0, order: 0 },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject nonexistent module", async () => {
      try {
        await lessonService.createLesson(
          "807f1f77bcf86cd799439999",
          { title: "New Lesson", contentType: LessonContentType.VIDEO, content: "https://example.com/v.mp4", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER creating lesson for another teacher's module", async () => {
      try {
        await lessonService.createLesson(
          otherModuleId,
          { title: "New Lesson", contentType: LessonContentType.TEXT, content: "text", durationMinutes: 0, order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject duplicate module+order (11000)", async () => {
      lessonMockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { moduleId: 1, order: 1 } };
        },
      };
      installMockRepo();

      try {
        await lessonService.createLesson(
          moduleId,
          { title: "New Lesson", contentType: LessonContentType.TEXT, content: "text", durationMinutes: 0, order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("getLessonById", () => {
    it("should allow TEACHER to get own lesson", async () => {
      const result = await lessonService.getLessonById("907f1f77bcf86cd799439011", moduleId, "507f1f77bcf86cd799439011");
      assert.equal(result.title, "Variables and Expressions");
    });

    it("should allow ADMIN to get any lesson", async () => {
      const result = await lessonService.getLessonById("907f1f77bcf86cd799439011", moduleId, "507f1f77bcf86cd799439033");
      assert.equal(result.title, "Variables and Expressions");
    });

    it("should return 404 for TEACHER accessing another teacher's lesson module", async () => {
      try {
        await lessonService.getLessonById("907f1f77bcf86cd799439011", otherModuleId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent lesson", async () => {
      try {
        await lessonService.getLessonById("907f1f77bcf86cd799439999", moduleId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive lesson", async () => {
      lessonMockOverrides = {
        findById: async () => ({ ...mockLessons[0], isActive: false } as ILesson),
      };
      installMockRepo();

      try {
        await lessonService.getLessonById("907f1f77bcf86cd799439011", moduleId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateLesson (PUT)", () => {
    it("should allow TEACHER to update own lesson", async () => {
      const result = await lessonService.updateLesson(
        "907f1f77bcf86cd799439011",
        moduleId,
        { title: "Updated Lesson", contentType: LessonContentType.TEXT, content: "new content", durationMinutes: 5, order: 1 },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Updated Lesson");
      assert.equal(result.order, 1);
    });

    it("should reject TEACHER updating another teacher's lesson", async () => {
      try {
        await lessonService.updateLesson(
          "907f1f77bcf86cd799439011",
          otherModuleId,
          { title: "Hacked", contentType: LessonContentType.TEXT, content: "hacked", durationMinutes: 0, order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to update any lesson", async () => {
      const result = await lessonService.updateLesson(
        "907f1f77bcf86cd799439012",
        otherModuleId,
        { title: "Updated Physics", contentType: LessonContentType.VIDEO, content: "new video", durationMinutes: 20, order: 2 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.title, "Updated Physics");
    });
  });

  describe("patchLesson (PATCH)", () => {
    it("should allow TEACHER to partially update own lesson", async () => {
      const result = await lessonService.patchLesson(
        "907f1f77bcf86cd799439011",
        moduleId,
        { title: "Lesson Updated" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Lesson Updated");
    });

    it("should return same lesson if no updates provided", async () => {
      const result = await lessonService.patchLesson(
        "907f1f77bcf86cd799439011",
        moduleId,
        {},
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Variables and Expressions");
    });

    it("should reject TEACHER patching another teacher's lesson", async () => {
      try {
        await lessonService.patchLesson(
          "907f1f77bcf86cd799439011",
          otherModuleId,
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

  describe("deleteLesson (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own lesson", async () => {
      const result = await lessonService.deleteLesson("907f1f77bcf86cd799439011", moduleId, "507f1f77bcf86cd799439011");
      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's lesson", async () => {
      try {
        await lessonService.deleteLesson("907f1f77bcf86cd799439011", otherModuleId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to soft-delete any lesson", async () => {
      const result = await lessonService.deleteLesson("907f1f77bcf86cd799439012", otherModuleId, "507f1f77bcf86cd799439033");
      assert.equal(result.isActive, false);
    });

    it("should return 404 for nonexistent lesson", async () => {
      try {
        await lessonService.deleteLesson("907f1f77bcf86cd799439999", moduleId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("listLessons", () => {
    it("should return lessons for TEACHER of own course module", async () => {
      const result = await lessonService.listLessons(
        { page: 1, limit: 20 },
        moduleId,
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.lessons.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should allow ADMIN to list any module's lessons", async () => {
      const result = await lessonService.listLessons(
        { page: 1, limit: 10 },
        moduleId,
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
    });

    it("should reject STUDENT role", async () => {
      try {
        await lessonService.listLessons(
          { page: 1, limit: 20 },
          moduleId,
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject TEACHER listing another teacher's module lessons", async () => {
      try {
        await lessonService.listLessons(
          { page: 1, limit: 20 },
          otherModuleId,
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });
});

