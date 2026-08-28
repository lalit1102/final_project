import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IClass } from "@/types/class.types";
import { ICourse } from "@/types/course.types";
import { ISubject } from "@/types/subject.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { classService } from "@/services/class.service";
import { courseService } from "@/services/course.service";
import { subjectService } from "@/services/subject.service";
import { classRepository } from "@/repositories/class.repository";
import { courseRepository } from "@/repositories/course.repository";
import { subjectRepository } from "@/repositories/subject.repository";
import { userRepository } from "@/repositories/user.repository";

const teacherA = "507f1f77bcf86cd799439011";
const teacherB = "507f1f77bcf86cd799439022";
const admin = "507f1f77bcf86cd799439033";

const mockUsers: Record<string, Partial<IUser>> = {
  [teacherA]: { _id: teacherA as unknown as IUser["_id"], name: "Teacher A", email: "a@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true },
  [teacherB]: { _id: teacherB as unknown as IUser["_id"], name: "Teacher B", email: "b@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true },
  [admin]: { _id: admin as unknown as IUser["_id"], name: "Admin", email: "admin@example.com", role: UserRole.ADMIN, isActive: true, isVerified: true },
};

const mockSubjects: Partial<ISubject>[] = [
  { _id: "607f1f77bcf86cd799439011" as unknown as ISubject["_id"], name: "Mathematics", code: "MATH", teacherId: teacherA as unknown as ISubject["teacherId"], isActive: true },
  { _id: "607f1f77bcf86cd799439022" as unknown as ISubject["_id"], name: "Physics", code: "PHYS", teacherId: teacherB as unknown as ISubject["teacherId"], isActive: true },
];

const mockCourses: Partial<ICourse>[] = [
  { _id: "707f1f77bcf86cd799439011" as unknown as ICourse["_id"], name: "Math 101", code: "MATH101", subjectId: "607f1f77bcf86cd799439011" as unknown as ICourse["subjectId"], teacherId: teacherA as unknown as ICourse["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "707f1f77bcf86cd799439012" as unknown as ICourse["_id"], name: "Physics 101", code: "PHYS101", subjectId: "607f1f77bcf86cd799439022" as unknown as ICourse["subjectId"], teacherId: teacherB as unknown as ICourse["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockClasses: Partial<IClass>[] = [
  { _id: "807f1f77bcf86cd799439011" as unknown as IClass["_id"], name: "Class A", code: "CLA1", courseId: "707f1f77bcf86cd799439011" as unknown as IClass["courseId"], teacherId: teacherA as unknown as IClass["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "807f1f77bcf86cd799439012" as unknown as IClass["_id"], name: "Class B", code: "CLB1", courseId: "707f1f77bcf86cd799439012" as unknown as IClass["courseId"], teacherId: teacherB as unknown as IClass["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const defaultMockClassRepo = {
  create: async (data: Partial<IClass>) => ({ _id: "999999999999999999999999", isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data } as IClass),
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  update: async (_id: string, data: Partial<IClass>) => {
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    return { ...mockClasses[0], ...setObj } as IClass;
  },
  softDelete: (id: string) => {
    const c = mockClasses.find((cl) => cl._id?.toString() === id);
    return Promise.resolve(c ? ({ ...c, isActive: false } as IClass) : null);
  },
  exists: async (_f: unknown) => false,
  totalCount: async () => mockClasses.length,
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    const teacherId = filter?.teacherId as string | undefined;
    if (teacherId) return mockClasses.filter((c) => c.teacherId?.toString() === teacherId) as IClass[];
    return mockClasses as IClass[];
  },
};

const mockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

const mockUserRepo = {
  findByIdSafe: async (id: string) => mockUsers[id] ?? null,
};

let classOverrides: Partial<typeof defaultMockClassRepo>;

function installMock(): void {
  const classRepo = classRepository as unknown as Record<string, unknown>;
  const merged = { ...defaultMockClassRepo, ...classOverrides };
  classRepo.create = merged.create;
  classRepo.findById = merged.findById;
  classRepo.update = merged.update;
  classRepo.softDelete = merged.softDelete;
  classRepo.exists = merged.exists;
  classRepo.totalCount = merged.totalCount;
  classRepo.findAllPaginated = merged.findAllPaginated;

  const courseRepo = courseRepository as unknown as Record<string, unknown>;
  courseRepo.findById = mockCourseRepo.findById;

  const userRepo = userRepository as unknown as Record<string, unknown>;
  userRepo.findByIdSafe = mockUserRepo.findByIdSafe;

  const subjectRepo = subjectRepository as unknown as Record<string, unknown>;
  subjectRepo.findById = async (id: string) => mockSubjects.find((s) => s._id?.toString() === id) ?? null;
}

describe("Phase 2E Security — RBAC & Ownership Enforcement", () => {
  beforeEach(() => {
    classOverrides = {};
    installMock();
  });

  describe("Relationship chain security (Teacher A → Subject → Course → Class)", () => {
    it("Teacher A cannot access Teacher B's Class (IDOR)", async () => {
      try {
        await classService.getClassById("807f1f77bcf86cd799439012", teacherA);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("Teacher A cannot create a Class under Teacher B's Course (courseId spoof)", async () => {
      try {
        await classService.createClass(
          { name: "Hijack", code: "HIJACK1", courseId: "707f1f77bcf86cd799439012", teacherId: teacherA },
          teacherA,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("Teacher A cannot change Class's courseId to Teacher B's Course (PATCH)", async () => {
      try {
        await classService.patchClass("807f1f77bcf86cd799439011", { courseId: "707f1f77bcf86cd799439012" }, teacherA);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("Teacher A cannot change Course A's subjectId to Teacher B's Subject (Course PATCH)", async () => {
      try {
        await courseService.patchCourse("707f1f77bcf86cd799439011", { subjectId: "607f1f77bcf86cd799439022" }, teacherA);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("Teacher A cannot create a Course under Teacher B's Subject (Subject spoof)", async () => {
      try {
        await courseService.createCourse(
          { name: "Hijack", code: "HJ", subjectId: "607f1f77bcf86cd799439022", teacherId: teacherA },
          teacherA,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("Teacher A cannot access Teacher B's Subject (IDOR)", async () => {
      try {
        await subjectService.getSubjectById("607f1f77bcf86cd799439022", teacherA);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("Body parameter spoofing (teacherId)", () => {
    it("TEACHER cannot spoof teacherId on Subject create", async () => {
      const subjectRepositoryModule = await import("@/repositories/subject.repository");
      const subjectRepository = subjectRepositoryModule.subjectRepository as unknown as Record<string, unknown>;
      const origCreate = subjectRepository.create;
      subjectRepository.create = async (data: Partial<ISubject>) =>
        ({ _id: "607f1f77bcf86cd799439099", isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data } as ISubject);
      try {
        const result = await subjectService.createSubject(
          { name: "Math", code: "MATHX", teacherId: teacherB },
          teacherA,
        );
        assert.equal(result.teacherId, teacherA);
      } finally {
        subjectRepository.create = origCreate;
      }
    });

    it("TEACHER cannot spoof teacherId on Course create", async () => {
      const courseRepositoryModule = await import("@/repositories/course.repository");
      const courseRepository = courseRepositoryModule.courseRepository as unknown as Record<string, unknown>;
      const origCreate = courseRepository.create;
      courseRepository.create = async (data: Partial<ICourse>) =>
        ({ _id: "707f1f77bcf86cd799439099", isActive: true, createdAt: new Date(), updatedAt: new Date(), ...data } as ICourse);
      try {
        const result = await courseService.createCourse(
          { name: "Math 101", code: "M101X", subjectId: "607f1f77bcf86cd799439011", teacherId: teacherB },
          teacherA,
        );
        assert.equal(result.teacherId, teacherA);
      } finally {
        courseRepository.create = origCreate;
      }
    });

    it("TEACHER cannot spoof teacherId on Class create", async () => {
      const result = await classService.createClass(
        { name: "Class X", code: "CLX1", courseId: "707f1f77bcf86cd799439011", teacherId: teacherB },
        teacherA,
      );
      assert.equal(result.teacherId, teacherA);
      assert.equal(result.courseId, "707f1f77bcf86cd799439011");
    });

    it("PATCH with teacherId in body is rejected by validation (.strict())", async () => {
      const { patchClassSchema } = await import("@/validations/class.validation");
      assert.throws(
        () => patchClassSchema.parse({ teacherId: teacherB, name: "X" }),
        (e: { issues?: unknown[] }) => (e as { issues?: unknown[] }).issues !== undefined,
      );
    });
  });

  describe("RBAC blocking (STUDENT / PARENT / unauthenticated)", () => {
    const student = "507f1f77bcf86cd799439044";
    const parent = "507f1f77bcf86cd799439055";

    beforeEach(() => {
      mockUsers[student] = { _id: student as unknown as IUser["_id"], name: "Student", email: "s@e.com", role: UserRole.STUDENT, isActive: true, isVerified: true };
      mockUsers[parent] = { _id: parent as unknown as IUser["_id"], name: "Parent", email: "p@e.com", role: UserRole.PARENT, isActive: true, isVerified: true };
      installMock();
    });

    it("STUDENT cannot create Class", async () => {
      try {
        await classService.createClass(
          { name: "X", code: "X1", courseId: "707f1f77bcf86cd799439011" },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot list Classes", async () => {
      try {
        await classService.listClasses({ page: 1, limit: 20 }, parent);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("STUDENT cannot read another teacher's Class", async () => {
      try {
        await classService.getClassById("807f1f77bcf86cd799439011", student);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("nonexistent user is rejected (UNAUTHORIZED)", async () => {
      try {
        await classService.getClassById("807f1f77bcf86cd799439011", "507f1f77bcf86cd799439999");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });
  });

  describe("Query parameter bypass protection", () => {
    it("TEACHER list does not honor a spoofed teacherId query param", async () => {
      const result = await classService.listClasses(
        { page: 1, limit: 20, teacherId: teacherB } as unknown as Parameters<typeof classService.listClasses>[0],
        teacherA,
      );
      assert.ok(result.classes.every((c) => c.teacherId === teacherA));
      assert.equal(result.classes.length, 1);
      assert.equal(result.classes[0].teacherId, teacherA);
    });

    it("TEACHER list is scoped to own classes", async () => {
      const result = await classService.listClasses({ page: 1, limit: 20 }, teacherA);
      assert.equal(result.classes.length, 1);
      assert.equal(result.classes[0].teacherId, teacherA);
    });

    it("ADMIN list returns all classes (global)", async () => {
      const result = await classService.listClasses({ page: 1, limit: 20 }, admin);
      assert.equal(result.classes.length, 2);
    });
  });

  describe("Soft delete enforcement", () => {
    it("TEACHER cannot soft-delete another teacher's Class", async () => {
      try {
        await classService.deleteClass("807f1f77bcf86cd799439012", teacherA);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError, `${error}`);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("TEACHER soft-delete sets isActive=false (own class)", async () => {
      const result = await classService.deleteClass("807f1f77bcf86cd799439011", teacherA);
      assert.equal(result.isActive, false);
    });
  });
});
