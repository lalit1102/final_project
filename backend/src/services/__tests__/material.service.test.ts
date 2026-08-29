import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IMaterial, MaterialType } from "@/types/material.types";
import { ILesson, LessonContentType } from "@/types/lesson.types";
import { IModule } from "@/types/module.types";
import { ICourse } from "@/types/course.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { materialService } from "@/services/material.service";
import { materialRepository } from "@/repositories/material.repository";
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
    teacherId: "507f1f77bcf86cd799439011" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "707f1f77bcf86cd799439012" as unknown as ICourse["_id"],
    name: "Physics 101",
    teacherId: "507f1f77bcf86cd799439033" as unknown as ICourse["teacherId"],
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockModules: Partial<IModule>[] = [
  {
    _id: "807f1f77bcf86cd799439011" as unknown as IModule["_id"],
    title: "Math Module",
    courseId: "707f1f77bcf86cd799439011" as unknown as IModule["courseId"],
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "807f1f77bcf86cd799439012" as unknown as IModule["_id"],
    title: "Physics Module",
    courseId: "707f1f77bcf86cd799439012" as unknown as IModule["courseId"],
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockLessons: Partial<ILesson>[] = [
  {
    _id: "907f1f77bcf86cd799439011" as unknown as ILesson["_id"],
    title: "Math Lesson",
    moduleId: "807f1f77bcf86cd799439011" as unknown as ILesson["moduleId"],
    contentType: LessonContentType.VIDEO,
    content: "https://example.com/v.mp4",
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "907f1f77bcf86cd799439012" as unknown as ILesson["_id"],
    title: "Physics Lesson",
    moduleId: "807f1f77bcf86cd799439012" as unknown as ILesson["moduleId"],
    contentType: LessonContentType.TEXT,
    content: "text content",
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const mockMaterials: Partial<IMaterial>[] = [
  {
    _id: "107f1f77bcf86cd799439011" as unknown as IMaterial["_id"],
    title: "Math Worksheet",
    description: "Algebra worksheet",
    lessonId: "907f1f77bcf86cd799439011" as unknown as IMaterial["lessonId"],
    materialType: MaterialType.DOCUMENT,
    fileUrl: "https://example.com/worksheet.pdf",
    fileSize: 1024,
    thumbnailUrl: "https://example.com/thumb.jpg",
    externalUrl: null,
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    _id: "107f1f77bcf86cd799439012" as unknown as IMaterial["_id"],
    title: "Physics Link",
    description: null,
    lessonId: "907f1f77bcf86cd799439012" as unknown as IMaterial["lessonId"],
    materialType: MaterialType.LINK,
    fileUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    externalUrl: "https://example.com/physics-intro",
    order: 0,
    isActive: true,
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const lessonId = "907f1f77bcf86cd799439011";
const otherLessonId = "907f1f77bcf86cd799439012";

const defaultMockMaterialRepo = {
  create: async (data: Partial<IMaterial>) => ({ ...mockMaterials[0], ...data } as IMaterial),
  findById: async (id: string) => mockMaterials.find((m) => m._id?.toString() === id) ?? null,
  update: async (id: string, data: { $set?: Record<string, unknown> }) => {
    const setObj = data?.["$set"] || {};
    const found = mockMaterials.find((m) => m._id?.toString() === id);
    if (!found) return null;
    return { ...found, ...setObj } as IMaterial;
  },
  softDelete: async (id: string) => {
    const material = mockMaterials.find((m) => m._id?.toString() === id);
    if (!material) return null;
    return { ...material, isActive: false } as IMaterial;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (_filter?: Record<string, unknown>) => mockMaterials.length,
  findAllPaginated: async (
    _filter?: Record<string, unknown>,
    _page?: number,
    _limit?: number,
    _sortBy?: string,
    _sortOrder?: 1 | -1,
  ) => [...mockMaterials] as IMaterial[],
};

const defaultMockLessonRepo = {
  findById: async (id: string) => mockLessons.find((l) => l._id?.toString() === id) ?? null,
};

const defaultMockModuleRepo = {
  findById: async (id: string) => mockModules.find((m) => m._id?.toString() === id) ?? null,
};

const defaultMockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

type MaterialMockOverrides = Partial<typeof defaultMockMaterialRepo>;
type LessonMockOverrides = Partial<typeof defaultMockLessonRepo>;
type ModuleMockOverrides = Partial<typeof defaultMockModuleRepo>;
type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;

let materialMockOverrides: MaterialMockOverrides;
let lessonMockOverrides: LessonMockOverrides;
let moduleMockOverrides: ModuleMockOverrides;
let courseMockOverrides: CourseMockOverrides;
let userMockOverrides: { findByIdSafe: (id: string) => Promise<Partial<IUser> | null> };

function installMockRepo(): void {
  const materialRepo = materialRepository as unknown as Record<string, unknown>;
  const materialSource = { ...defaultMockMaterialRepo, ...materialMockOverrides };
  materialRepo.create = materialSource.create;
  materialRepo.findById = materialSource.findById;
  materialRepo.update = materialSource.update;
  materialRepo.softDelete = materialSource.softDelete;
  materialRepo.exists = materialSource.exists;
  materialRepo.totalCount = materialSource.totalCount;
  materialRepo.findAllPaginated = materialSource.findAllPaginated;

  const lessonRepo = lessonRepository as unknown as Record<string, unknown>;
  const lessonSource = { ...defaultMockLessonRepo, ...lessonMockOverrides };
  lessonRepo.findById = lessonSource.findById;

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

describe("MaterialService", () => {
  beforeEach(() => {
    materialMockOverrides = {};
    lessonMockOverrides = {};
    moduleMockOverrides = {};
    courseMockOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("createMaterial", () => {
    it("should allow TEACHER to create a material for own course lesson", async () => {
      const result = await materialService.createMaterial(
        lessonId,
        {
          title: "New Worksheet",
          materialType: MaterialType.DOCUMENT,
          fileUrl: "https://example.com/ws.pdf",
          fileSize: 2048,
          thumbnailUrl: "https://example.com/thumb.jpg",
          externalUrl: null,
          order: 0,
        },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "New Worksheet");
      assert.equal(result.lessonId, lessonId);
      assert.equal(result.materialType, MaterialType.DOCUMENT);
    });

    it("should allow ADMIN to create a material for any lesson", async () => {
      const result = await materialService.createMaterial(
        otherLessonId,
        { title: "Physics Link", materialType: MaterialType.LINK, externalUrl: "https://example.com/physics", order: 0 },
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.title, "Physics Link");
      assert.equal(result.materialType, MaterialType.LINK);
    });

    it("should reject STUDENT role", async () => {
      try {
        await materialService.createMaterial(
          lessonId,
          { title: "New Material", materialType: MaterialType.FILE, fileUrl: "https://example.com/f.txt", order: 0 },
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
        await materialService.createMaterial(
          lessonId,
          { title: "New Material", materialType: MaterialType.FILE, fileUrl: "https://example.com/f.txt", order: 0 },
          "507f1f77bcf86cd799439999",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("should reject nonexistent lesson", async () => {
      try {
        await materialService.createMaterial(
          "907f1f77bcf86cd799439999",
          { title: "New Material", materialType: MaterialType.FILE, fileUrl: "https://example.com/f.txt", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject TEACHER creating material for another teacher's lesson", async () => {
      try {
        await materialService.createMaterial(
          otherLessonId,
          { title: "New Material", materialType: MaterialType.FILE, fileUrl: "https://example.com/f.txt", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject duplicate lesson+order (11000)", async () => {
      materialMockOverrides = {
        create: async () => {
          throw { code: 11000, keyPattern: { lessonId: 1, order: 1 } };
        },
      };
      installMockRepo();

      try {
        await materialService.createMaterial(
          lessonId,
          { title: "New Material", materialType: MaterialType.FILE, fileUrl: "https://example.com/f.txt", order: 0 },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("getMaterialById", () => {
    it("should allow TEACHER to get own material", async () => {
      const result = await materialService.getMaterialById("107f1f77bcf86cd799439011", lessonId, "507f1f77bcf86cd799439011");
      assert.equal(result.title, "Math Worksheet");
    });

    it("should allow ADMIN to get any material", async () => {
      const result = await materialService.getMaterialById("107f1f77bcf86cd799439011", lessonId, "507f1f77bcf86cd799439033");
      assert.equal(result.title, "Math Worksheet");
    });

    it("should return 404 for TEACHER accessing another teacher's material lesson", async () => {
      try {
        await materialService.getMaterialById("107f1f77bcf86cd799439011", otherLessonId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent material", async () => {
      try {
        await materialService.getMaterialById("107f1f77bcf86cd799439999", lessonId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive material", async () => {
      materialMockOverrides = {
        findById: async () => ({ ...mockMaterials[0], isActive: false } as IMaterial),
      };
      installMockRepo();

      try {
        await materialService.getMaterialById("107f1f77bcf86cd799439011", lessonId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("updateMaterial (PUT)", () => {
    it("should allow TEACHER to update own material", async () => {
      const result = await materialService.updateMaterial(
        "107f1f77bcf86cd799439011",
        lessonId,
        {
          title: "Updated Worksheet",
          materialType: MaterialType.DOCUMENT,
          fileUrl: "https://example.com/new-ws.pdf",
          fileSize: 4096,
          thumbnailUrl: "https://example.com/new-thumb.jpg",
          externalUrl: null,
          order: 1,
        },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Updated Worksheet");
      assert.equal(result.order, 1);
    });

    it("should reject TEACHER updating another teacher's material", async () => {
      try {
        await materialService.updateMaterial(
          "107f1f77bcf86cd799439011",
          otherLessonId,
          {
            title: "Hacked",
            materialType: MaterialType.FILE,
            fileUrl: "https://example.com/f.txt",
            fileSize: 0,
            thumbnailUrl: null,
            externalUrl: null,
            order: 0,
          },
          "507f1f77bcf86cd799439011",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("patchMaterial (PATCH)", () => {
    it("should allow TEACHER to partially update own material", async () => {
      const result = await materialService.patchMaterial(
        "107f1f77bcf86cd799439011",
        lessonId,
        { title: "Worksheet Updated" },
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Worksheet Updated");
    });

    it("should return same material if no updates provided", async () => {
      const result = await materialService.patchMaterial(
        "107f1f77bcf86cd799439011",
        lessonId,
        {},
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.title, "Math Worksheet");
    });

    it("should reject TEACHER patching another teacher's material", async () => {
      try {
        await materialService.patchMaterial(
          "107f1f77bcf86cd799439011",
          otherLessonId,
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

  describe("deleteMaterial (soft-delete)", () => {
    it("should allow TEACHER to soft-delete own material", async () => {
      const result = await materialService.deleteMaterial("107f1f77bcf86cd799439011", lessonId, "507f1f77bcf86cd799439011");
      assert.equal(result.isActive, false);
    });

    it("should reject TEACHER deleting another teacher's material", async () => {
      try {
        await materialService.deleteMaterial("107f1f77bcf86cd799439011", otherLessonId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should allow ADMIN to soft-delete any material", async () => {
      const result = await materialService.deleteMaterial("107f1f77bcf86cd799439012", otherLessonId, "507f1f77bcf86cd799439033");
      assert.equal(result.isActive, false);
    });

    it("should return 404 for nonexistent material", async () => {
      try {
        await materialService.deleteMaterial("107f1f77bcf86cd799439999", lessonId, "507f1f77bcf86cd799439011");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("listMaterials", () => {
    it("should return materials for TEACHER of own course lesson", async () => {
      const result = await materialService.listMaterials(
        { page: 1, limit: 20 },
        lessonId,
        "507f1f77bcf86cd799439011",
      );
      assert.equal(result.materials.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("should allow ADMIN to list any lesson's materials", async () => {
      const result = await materialService.listMaterials(
        { page: 1, limit: 10 },
        lessonId,
        "507f1f77bcf86cd799439033",
      );
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(result.pagination.total, 2);
    });

    it("should reject STUDENT role", async () => {
      try {
        await materialService.listMaterials(
          { page: 1, limit: 20 },
          lessonId,
          "507f1f77bcf86cd799439044",
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject TEACHER listing another teacher's lesson materials", async () => {
      try {
        await materialService.listMaterials(
          { page: 1, limit: 20 },
          otherLessonId,
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
