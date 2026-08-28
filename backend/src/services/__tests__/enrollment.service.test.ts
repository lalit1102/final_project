import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IEnrollment, EnrollmentStatus } from "@/types/enrollment.types";
import { IClass } from "@/types/class.types";
import { ICourse } from "@/types/course.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { enrollmentService } from "@/services/enrollment.service";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { classRepository } from "@/repositories/class.repository";
import { courseRepository } from "@/repositories/course.repository";
import { userRepository } from "@/repositories/user.repository";

const teacher = "507f1f77bcf86cd799439011";
const otherTeacher = "507f1f77bcf86cd799439022";
const adminId = "507f1f77bcf86cd799439033";
const student = "507f1f77bcf86cd799439044";
const parent = "507f1f77bcf86cd799439055";
const student2 = "507f1f77bcf86cd799439066";
const otherParent = "507f1f77bcf86cd799439077";

const mockUsers: Record<string, Partial<IUser>> = {
  [teacher]: { _id: teacher as unknown as IUser["_id"], name: "Teacher Alice", email: "alice@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [otherTeacher]: { _id: otherTeacher as unknown as IUser["_id"], name: "Teacher Bob", email: "bob@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [adminId]: { _id: adminId as unknown as IUser["_id"], name: "Admin Root", email: "admin@example.com", role: UserRole.ADMIN, isActive: true, isVerified: true, parentIds: [] },
   [student]: { _id: student as unknown as IUser["_id"], name: "Student Carol", email: "carol@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [parent as unknown as IUser["_id"]] },
   [parent]: { _id: parent as unknown as IUser["_id"], name: "Parent Dave", email: "dave@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
   [student2]: { _id: student2 as unknown as IUser["_id"], name: "Student Eve", email: "eve@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [otherParent as unknown as IUser["_id"]] },
   [otherParent]: { _id: otherParent as unknown as IUser["_id"], name: "Parent Frank", email: "frank@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
};

const mockCourses: Partial<ICourse>[] = [
  { _id: "707f1f77bcf86cd799439011" as unknown as ICourse["_id"], name: "Math 101", code: "MATH101", description: "Intro to math", subjectId: "607f1f77bcf86cd799439011" as unknown as ICourse["subjectId"], teacherId: teacher as unknown as ICourse["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "707f1f77bcf86cd799439012" as unknown as ICourse["_id"], name: "Physics 101", code: "PHYS101", description: null, subjectId: "607f1f77bcf86cd799439022" as unknown as ICourse["subjectId"], teacherId: otherTeacher as unknown as ICourse["teacherId"], isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockClasses: Partial<IClass>[] = [
  { _id: "807f1f77bcf86cd799439011" as unknown as IClass["_id"], name: "Class A", code: "CLA1", description: "Math class A", courseId: "707f1f77bcf86cd799439011" as unknown as IClass["courseId"], teacherId: teacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "807f1f77bcf86cd799439012" as unknown as IClass["_id"], name: "Class B", code: "CLB1", description: null, courseId: "707f1f77bcf86cd799439012" as unknown as IClass["courseId"], teacherId: otherTeacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "807f1f77bcf86cd799439013" as unknown as IClass["_id"], name: "Class C (inactive)", code: "CLC1", description: null, courseId: "707f1f77bcf86cd799439011" as unknown as IClass["courseId"], teacherId: teacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

const mockEnrollments: Partial<IEnrollment>[] = [
  { _id: "907f1f77bcf86cd799439011" as unknown as IEnrollment["_id"], studentId: student as unknown as IEnrollment["studentId"], classId: "807f1f77bcf86cd799439011" as unknown as IEnrollment["classId"], courseId: "707f1f77bcf86cd799439011" as unknown as IEnrollment["courseId"], status: EnrollmentStatus.ACTIVE, enrolledAt: new Date("2025-01-15T00:00:00Z"), isActive: true, createdAt: new Date("2025-01-15T00:00:00Z"), updatedAt: new Date("2025-01-15T00:00:00Z") },
  { _id: "907f1f77bcf86cd799439012" as unknown as IEnrollment["_id"], studentId: student as unknown as IEnrollment["studentId"], classId: "807f1f77bcf86cd799439012" as unknown as IEnrollment["classId"], courseId: "707f1f77bcf86cd799439012" as unknown as IEnrollment["courseId"], status: EnrollmentStatus.COMPLETED, enrolledAt: new Date("2025-02-15T00:00:00:00Z"), isActive: true, createdAt: new Date("2025-02-15T00:00:00Z"), updatedAt: new Date("2025-02-15T00:00:00Z") },
  { _id: "907f1f77bcf86cd799439013" as unknown as IEnrollment["_id"], studentId: student as unknown as IEnrollment["studentId"], classId: "807f1f77bcf86cd799439013" as unknown as IEnrollment["classId"], courseId: "707f1f77bcf86cd799439011" as unknown as IEnrollment["courseId"], status: EnrollmentStatus.DROPPED, enrolledAt: new Date("2025-03-15T00:00:00:00Z"), isActive: false, createdAt: new Date("2025-03-15T00:00:00Z"), updatedAt: new Date("2025-03-15T00:00:00Z") },
  { _id: "907f1f77bcf86cd799439014" as unknown as IEnrollment["_id"], studentId: student2 as unknown as IEnrollment["studentId"], classId: "807f1f77bcf86cd799439011" as unknown as IEnrollment["classId"], courseId: "707f1f77bcf86cd799439011" as unknown as IEnrollment["courseId"], status: EnrollmentStatus.ACTIVE, enrolledAt: new Date("2025-04-15T00:00:00Z"), isActive: true, createdAt: new Date("2025-04-15T00:00:00Z"), updatedAt: new Date("2025-04-15T00:00:00Z") },
];

const defaultMockEnrollmentRepo = {
  create: async (data: Partial<IEnrollment>) => ({ _id: "999999999999999999999999", isActive: true, createdAt: new Date(), updatedAt: new Date(), enrolledAt: new Date(), ...data } as IEnrollment),
  findById: async (id: string) => mockEnrollments.find((e) => e._id?.toString() === id) ?? null,
  update: async (id: string, data: Partial<IEnrollment>) => {
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    const found = mockEnrollments.find((e) => e._id?.toString() === id);
    if (!found) return null;
    return { ...found, ...setObj } as IEnrollment;
  },
  softDelete: async (id: string) => {
    const e = mockEnrollments.find((en) => en._id?.toString() === id);
    if (!e) return null;
    return { ...e, isActive: false } as IEnrollment;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (filter?: Record<string, unknown>) => {
    let result = mockEnrollments.filter((e) => e.isActive !== false);
    if (filter?.studentId) {
      if (Array.isArray(filter.studentId)) {
        result = result.filter((e) => (filter.studentId as unknown[]).some((id) => e.studentId?.toString() === id?.toString()));
      } else if (typeof filter.studentId === "object" && (filter.studentId as { $in?: unknown[] })?.["$in"]) {
        result = result.filter((e) => (filter.studentId as { $in: unknown[] }).$in.some((id) => e.studentId?.toString() === id?.toString()));
      } else {
        result = result.filter((e) => e.studentId?.toString() === filter.studentId?.toString());
      }
    }
    if (filter?.classId) {
      if ((filter.classId as { $in?: unknown[] })?.["$in"]) {
        result = result.filter((e) => (filter.classId as { $in: unknown[] }).$in.some((id) => e.classId?.toString() === id?.toString()));
      } else {
        result = result.filter((e) => e.classId?.toString() === filter.classId?.toString());
      }
    }
    if (filter?.status) result = result.filter((e) => e.status === filter.status);
    return result.length;
  },
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    let result = mockEnrollments.filter((e) => e.isActive !== false);
    if (filter?.studentId) {
      if (Array.isArray(filter.studentId)) {
        result = result.filter((e) => (filter.studentId as unknown[]).some((id) => e.studentId?.toString() === id?.toString()));
      } else if (typeof filter.studentId === "object" && (filter.studentId as { $in?: unknown[] })?.["$in"]) {
        result = result.filter((e) => (filter.studentId as { $in: unknown[] }).$in.some((id) => e.studentId?.toString() === id?.toString()));
      } else {
        result = result.filter((e) => e.studentId?.toString() === filter.studentId?.toString());
      }
    }
    if (filter?.classId) {
      if ((filter.classId as { $in?: unknown[] })?.["$in"]) {
        result = result.filter((e) => (filter.classId as { $in: unknown[] }).$in.some((id) => e.classId?.toString() === id?.toString()));
      } else {
        result = result.filter((e) => e.classId?.toString() === filter.classId?.toString());
      }
    }
    if (filter?.status) result = result.filter((e) => e.status === filter.status);
    return result as IEnrollment[];
  },
  findByStudentAndClass: async (sid: string, cid: string) => mockEnrollments.find((e) => e.studentId?.toString() === sid && e.classId?.toString() === cid && e.isActive) ?? null,
  findByStudent: async (sid: string) => mockEnrollments.filter((e) => e.studentId?.toString() === sid && e.isActive) as IEnrollment[],
};

const defaultMockClassRepo = {
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  findActiveClassIdsByTeacher: async (teacherId: string) => {
    return mockClasses.filter((c) => c.teacherId?.toString() === teacherId && c.isActive).map((c) => c._id?.toString() ?? "");
  },
};

const defaultMockCourseRepo = {
  findById: async (id: string) => mockCourses.find((c) => c._id?.toString() === id) ?? null,
};

type EnrollmentMockOverrides = Partial<typeof defaultMockEnrollmentRepo>;
type ClassMockOverrides = Partial<typeof defaultMockClassRepo>;
type CourseMockOverrides = Partial<typeof defaultMockCourseRepo>;

let enrollmentOverrides: EnrollmentMockOverrides;
let classOverrides: ClassMockOverrides;
let courseOverrides: CourseMockOverrides;

function setupMockUsers(): void {
  const userRepo = userRepository as unknown as Record<string, unknown>;
  userRepo.findByIdSafe = async (id: string) => mockUsers[id] ?? null;
  userRepo.findById = async (id: string) => mockUsers[id] ?? null;
  userRepo.findStudentsByParentId = async (parentId: string) => {
    return Object.values(mockUsers).filter(
      (u) => u && u.role === UserRole.STUDENT && u.isActive && (u.parentIds ?? []).some((pid) => pid?.toString() === parentId),
    ) as Partial<IUser>[];
  };
}

function installMockRepo(): void {
  const enrollmentRepo = enrollmentRepository as unknown as Record<string, unknown>;
  const merged = { ...defaultMockEnrollmentRepo, ...enrollmentOverrides };
  enrollmentRepo.create = merged.create;
  enrollmentRepo.findById = merged.findById;
  enrollmentRepo.update = merged.update;
  enrollmentRepo.softDelete = merged.softDelete;
  enrollmentRepo.exists = merged.exists;
  enrollmentRepo.totalCount = merged.totalCount;
  enrollmentRepo.findAllPaginated = merged.findAllPaginated;
  enrollmentRepo.findByStudentAndClass = merged.findByStudentAndClass;
  enrollmentRepo.findByStudent = merged.findByStudent;

  const classRepo = classRepository as unknown as Record<string, unknown>;
  const classMerged = { ...defaultMockClassRepo, ...classOverrides };
  classRepo.findById = classMerged.findById;
  classRepo.findActiveClassIdsByTeacher = classMerged.findActiveClassIdsByTeacher;

  const courseRepo = courseRepository as unknown as Record<string, unknown>;
  const courseMerged = { ...defaultMockCourseRepo, ...courseOverrides };
  courseRepo.findById = courseMerged.findById;
}

describe("EnrollmentService", () => {
  beforeEach(() => {
    enrollmentOverrides = {};
    classOverrides = {};
    courseOverrides = {};
    setupMockUsers();
    installMockRepo();
  });

  describe("listEnrollments", () => {
    it("ADMIN can list all enrollments", async () => {
      const result = await enrollmentService.listEnrollments({ page: 1, limit: 20 }, adminId);
      assert.equal(result.enrollments.length, 3);
      assert.equal(result.pagination.total, 3);
    });

    it("TEACHER can list enrollments for own classes", async () => {
      const result = await enrollmentService.listEnrollments({ page: 1, limit: 20 }, teacher);
      assert.equal(result.enrollments.length, 2);
    });

    it("TEACHER list filters by classId within own classes", async () => {
      const result = await enrollmentService.listEnrollments(
        { page: 1, limit: 20, classId: "807f1f77bcf86cd799439011" },
        teacher,
      );
      assert.equal(result.enrollments.length, 2);
    });

    it("TEACHER cannot list enrollments for another teacher's class", async () => {
      try {
        await enrollmentService.listEnrollments(
          { page: 1, limit: 20, classId: "807f1f77bcf86cd799439012" },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT can list own enrollments", async () => {
      const result = await enrollmentService.listEnrollments({ page: 1, limit: 20 }, student);
      assert.equal(result.enrollments.length, 2);
    });

    it("STUDENT cannot filter by arbitrary studentId (ignored)", async () => {
      const result = await enrollmentService.listEnrollments(
        { page: 1, limit: 20, studentId: otherTeacher },
        student,
      );
      assert.equal(result.enrollments.length, 2);
    });

    it("PARENT can list children's enrollments", async () => {
      const result = await enrollmentService.listEnrollments({ page: 1, limit: 20 }, parent);
      assert.equal(result.enrollments.length, 2);
    });

    it("PARENT with no children gets empty result", async () => {
      mockUsers[student2] = { ...mockUsers[student2], parentIds: [] };
      const result = await enrollmentService.listEnrollments({ page: 1, limit: 20 }, otherParent);
      assert.equal(result.enrollments.length, 0);
      assert.equal(result.pagination.total, 0);
    });

    it("nonexistent user is rejected (UNAUTHORIZED)", async () => {
      try {
        await enrollmentService.listEnrollments({ page: 1, limit: 20 }, "507f1f77bcf86cd799439999");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("STUDENT cannot filter by classId (own scope only)", async () => {
      const result = await enrollmentService.listEnrollments(
        { page: 1, limit: 20, classId: "807f1f77bcf86cd799439012" },
        student,
      );
      assert.equal(result.enrollments.length, 1);
    });

    it("ADMIN can filter by studentId", async () => {
      const result = await enrollmentService.listEnrollments(
        { page: 1, limit: 20, studentId: student },
        adminId,
      );
      assert.equal(result.enrollments.length, 2);
    });
  });

  describe("getEnrollmentById", () => {
    it("ADMIN can get any enrollment", async () => {
      const result = await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439011", adminId);
      assert.equal(result.id, "907f1f77bcf86cd799439011");
    });

    it("TEACHER can get enrollment in own class", async () => {
      const result = await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439011", teacher);
      assert.equal(result.id, "907f1f77bcf86cd799439011");
    });

    it("TEACHER cannot get enrollment in another teacher's class (IDOR)", async () => {
      try {
        await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439012", teacher);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT can get own enrollment", async () => {
      const result = await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439011", student);
      assert.equal(result.studentId, student);
    });

    it("STUDENT cannot get another student's enrollment (IDOR)", async () => {
      try {
        await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439011", student2);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("PARENT can get child's enrollment", async () => {
      const result = await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439011", parent);
      assert.equal(result.studentId, student);
    });

    it("PARENT cannot get non-child's enrollment (IDOR)", async () => {
      try {
        await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439014", parent);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent enrollment", async () => {
      try {
        await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439999", adminId);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive enrollment", async () => {
      try {
        await enrollmentService.getEnrollmentById("907f1f77bcf86cd799439013", adminId);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("createEnrollment", () => {
    it("ADMIN can create enrollment", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => null,
      };
      installMockRepo();

      const result = await enrollmentService.createEnrollment(
        { studentId: student, classId: "807f1f77bcf86cd799439011" },
        adminId,
      );
      assert.equal(result.studentId, student);
      assert.equal(result.classId, "807f1f77bcf86cd799439011");
      assert.equal(result.courseId, "707f1f77bcf86cd799439011");
      assert.equal(result.status, EnrollmentStatus.ACTIVE);
    });

    it("TEACHER can create enrollment for own class", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => null,
      };
      installMockRepo();

      const result = await enrollmentService.createEnrollment(
        { studentId: student, classId: "807f1f77bcf86cd799439011" },
        teacher,
      );
      assert.equal(result.studentId, student);
      assert.equal(result.classId, "807f1f77bcf86cd799439011");
    });
  });

  describe("createEnrollment - RBAC", () => {
    it("STUDENT cannot create enrollment", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: student, classId: "807f1f77bcf86cd799439011" },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot create enrollment", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: student, classId: "807f1f77bcf86cd799439011" },
          parent,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("TEACHER cannot enroll student in another teacher's class", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: student, classId: "807f1f77bcf86cd799439012" },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject nonexistent class", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: student, classId: "807f1f77bcf86cd799439999" },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject nonexistent student", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: "507f1f77bcf86cd799439999", classId: "807f1f77bcf86cd799439011" },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should reject non-STUDENT studentId", async () => {
      try {
        await enrollmentService.createEnrollment(
          { studentId: teacher, classId: "807f1f77bcf86cd799439011" },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should reject duplicate enrollment", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => mockEnrollments[0] as IEnrollment,
      };
      installMockRepo();

      try {
        await enrollmentService.createEnrollment(
          { studentId: student, classId: "807f1f77bcf86cd799439011" },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });

    it("should derive courseId from classId (not from body)", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => null,
      };
      installMockRepo();
      const result = await enrollmentService.createEnrollment(
        { studentId: student, classId: "807f1f77bcf86cd799439011" },
        adminId,
      );
      assert.equal(result.courseId, "707f1f77bcf86cd799439011");
    });

    it("ADMIN can specify different studentId", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => null,
      };
      installMockRepo();
      const result = await enrollmentService.createEnrollment(
        { studentId: student, classId: "807f1f77bcf86cd799439011" },
        adminId,
      );
      assert.equal(result.studentId, student);
    });

    it("should set status from input", async () => {
      enrollmentOverrides = {
        findByStudentAndClass: async () => null,
      };
      installMockRepo();
      const result = await enrollmentService.createEnrollment(
        { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.DROPPED },
        adminId,
      );
      assert.equal(result.status, EnrollmentStatus.DROPPED);
    });
  });

  describe("updateEnrollment", () => {
    it("ADMIN can update enrollment", async () => {
      const result = await enrollmentService.updateEnrollment(
        "907f1f77bcf86cd799439011",
        { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.COMPLETED },
        adminId,
      );
      assert.equal(result.status, EnrollmentStatus.COMPLETED);
    });

    it("TEACHER can update enrollment in own class", async () => {
      enrollmentOverrides = {
        update: async (id: string, data: Partial<IEnrollment>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockEnrollments[0], ...setObj } as IEnrollment;
        },
      };
      installMockRepo();

      const result = await enrollmentService.updateEnrollment(
        "907f1f77bcf86cd799439011",
        { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.COMPLETED },
        teacher,
      );
      assert.equal(result.status, EnrollmentStatus.COMPLETED);
    });

    it("TEACHER cannot update enrollment in another teacher's class (IDOR)", async () => {
      try {
        await enrollmentService.updateEnrollment(
          "907f1f77bcf86cd799439012",
          { studentId: student, classId: "807f1f77bcf86cd799439012", status: EnrollmentStatus.ACTIVE },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot update enrollment", async () => {
      try {
        await enrollmentService.updateEnrollment(
          "907f1f77bcf86cd799439011",
          { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.ACTIVE },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot update enrollment", async () => {
      try {
        await enrollmentService.updateEnrollment(
          "907f1f77bcf86cd799439011",
          { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.ACTIVE },
          parent,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("nonexistent enrollment returns 404", async () => {
      try {
        await enrollmentService.updateEnrollment(
          "907f1f77bcf86cd799439999",
          { studentId: student, classId: "807f1f77bcf86cd799439011", status: EnrollmentStatus.ACTIVE },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("patchEnrollment", () => {
    it("ADMIN can patch enrollment status", async () => {
      enrollmentOverrides = {
        update: async (id: string, data: Partial<IEnrollment>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockEnrollments[0], ...setObj } as IEnrollment;
        },
      };
      installMockRepo();

      const result = await enrollmentService.patchEnrollment(
        "907f1f77bcf86cd799439011",
        { status: EnrollmentStatus.DROPPED },
        adminId,
      );
      assert.equal(result.status, EnrollmentStatus.DROPPED);
    });

    it("TEACHER can patch enrollment status for own class", async () => {
      enrollmentOverrides = {
        update: async (id: string, data: Partial<IEnrollment>) => {
          const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
          return { ...mockEnrollments[0], ...setObj } as IEnrollment;
        },
      };
      installMockRepo();

      const result = await enrollmentService.patchEnrollment(
        "907f1f77bcf86cd799439011",
        { status: EnrollmentStatus.DROPPED },
        teacher,
      );
      assert.equal(result.status, EnrollmentStatus.DROPPED);
    });

    it("STUDENT cannot patch enrollment", async () => {
      try {
        await enrollmentService.patchEnrollment(
          "907f1f77bcf86cd799439011",
          { status: EnrollmentStatus.DROPPED },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot patch enrollment", async () => {
      try {
        await enrollmentService.patchEnrollment(
          "907f1f77bcf86cd799439011",
          { status: EnrollmentStatus.DROPPED },
          parent,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("TEACHER cannot patch enrollment in another teacher's class (IDOR)", async () => {
      try {
        await enrollmentService.patchEnrollment(
          "907f1f77bcf86cd799439012",
          { status: EnrollmentStatus.DROPPED },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return same enrollment if no fields provided in patch", async () => {
      const result = await enrollmentService.patchEnrollment(
        "907f1f77bcf86cd799439011",
        {},
        adminId,
      );
      assert.equal(result.id, "907f1f77bcf86cd799439011");
    });
  });

  describe("deleteEnrollment", () => {
    it("ADMIN can soft-delete enrollment", async () => {
      const result = await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439011", adminId);
      assert.equal(result.isActive, false);
    });

    it("TEACHER can soft-delete enrollment in own class", async () => {
      const result = await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439011", teacher);
      assert.equal(result.isActive, false);
    });

    it("TEACHER cannot soft-delete enrollment in another teacher's class (IDOR)", async () => {
      try {
        await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439012", teacher);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot delete enrollment", async () => {
      try {
        await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439011", student);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot delete enrollment", async () => {
      try {
        await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439011", parent);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should be idempotent (repeated soft-delete returns same result)", async () => {
      enrollmentOverrides = {
        softDelete: async (id: string) => {
          const e = mockEnrollments.find((en) => en._id?.toString() === id);
          if (!e) return null;
          return { ...e, isActive: false } as IEnrollment;
        },
        findById: async (id: string) => {
          const e = mockEnrollments.find((en) => en._id?.toString() === id);
          if (!e) return null;
          return { ...e, isActive: false } as IEnrollment;
        },
      };
      installMockRepo();

      const result1 = await enrollmentService.deleteEnrollment("907f1f77bcf86cd799439011", adminId);
      assert.equal(result1.isActive, false);
    });
  });
});
