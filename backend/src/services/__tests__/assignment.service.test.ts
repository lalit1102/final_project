import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IAssignment, AssignmentStatus, SubmissionType } from "@/types/assignment.types";
import { IClass } from "@/types/class.types";
import { IUser, UserRole } from "@/types/user.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { assignmentService } from "@/services/assignment.service";
import { assignmentRepository } from "@/repositories/assignment.repository";
import { classRepository } from "@/repositories/class.repository";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { userRepository } from "@/repositories/user.repository";

const teacher = "507f1f77bcf86cd799439011";
const otherTeacher = "507f1f77bcf86cd799439022";
const adminId = "507f1f77bcf86cd799439033";
const student = "507f1f77bcf86cd799439044";
const student2 = "507f1f77bcf86cd799439066";
const parent = "507f1f77bcf86cd799439055";
const otherParent = "507f1f77bcf86cd799439077";
const noEnrollStudent = "507f1f77bcf86cd799439099";

const classA = "807f1f77bcf86cd799439011";
const classB = "807f1f77bcf86cd799439012";
const courseA = "707f1f77bcf86cd799439011";
const courseB = "707f1f77bcf86cd799439012";

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const futureDateStr = futureDate.toISOString();

const mockUsers: Record<string, Partial<IUser>> = {
  [teacher]: { _id: teacher as unknown as IUser["_id"], name: "Teacher Alice", email: "alice@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [otherTeacher]: { _id: otherTeacher as unknown as IUser["_id"], name: "Teacher Bob", email: "bob@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [adminId]: { _id: adminId as unknown as IUser["_id"], name: "Admin Root", email: "admin@example.com", role: UserRole.ADMIN, isActive: true, isVerified: true, parentIds: [] },
  [student]: { _id: student as unknown as IUser["_id"], name: "Student Carol", email: "carol@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [parent as unknown as IUser["_id"]] },
  [student2]: { _id: student2 as unknown as IUser["_id"], name: "Student Eve", email: "eve@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [otherParent as unknown as IUser["_id"]] },
  [parent]: { _id: parent as unknown as IUser["_id"], name: "Parent Dave", email: "dave@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [otherParent]: { _id: otherParent as unknown as IUser["_id"], name: "Parent Frank", email: "frank@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [noEnrollStudent]: { _id: noEnrollStudent as unknown as IUser["_id"], name: "Student NoEnroll", email: "noenroll@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [] },
};

const mockClasses: Partial<IClass>[] = [
  { _id: classA as unknown as IClass["_id"], name: "Class A", code: "CLA1", description: "Math class A", courseId: courseA as unknown as IClass["courseId"], teacherId: teacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: classB as unknown as IClass["_id"], name: "Class B", code: "CLB1", description: null, courseId: courseB as unknown as IClass["courseId"], teacherId: otherTeacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockAssignments: Partial<IAssignment>[] = [
  {
    _id: "a07f1f77bcf86cd799439011" as unknown as IAssignment["_id"],
    title: "HW1",
    description: "Homework 1",
    classId: classA as unknown as IAssignment["classId"],
    courseId: courseA as unknown as IAssignment["courseId"],
    dueDate: futureDate,
    maxPoints: 100,
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmissions: false,
    latePenaltyPercent: 0,
    submissionType: SubmissionType.TEXT,
    attachments: [],
    createdBy: teacher as unknown as IAssignment["createdBy"],
    publishedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "a07f1f77bcf86cd799439022" as unknown as IAssignment["_id"],
    title: "HW2",
    description: null,
    classId: classA as unknown as IAssignment["classId"],
    courseId: courseA as unknown as IAssignment["courseId"],
    dueDate: futureDate,
    maxPoints: 50,
    status: AssignmentStatus.DRAFT,
    allowLateSubmissions: true,
    latePenaltyPercent: 10,
    submissionType: SubmissionType.FILE,
    attachments: [],
    createdBy: teacher as unknown as IAssignment["createdBy"],
    publishedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "a07f1f77bcf86cd799439033" as unknown as IAssignment["_id"],
    title: "Exam",
    description: "Midterm",
    classId: classB as unknown as IAssignment["classId"],
    courseId: courseB as unknown as IAssignment["courseId"],
    dueDate: futureDate,
    maxPoints: 200,
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmissions: false,
    latePenaltyPercent: 0,
    submissionType: SubmissionType.NONE,
    attachments: ["https://example.com/exam.pdf"],
    createdBy: otherTeacher as unknown as IAssignment["createdBy"],
    publishedAt: new Date(),
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEnrollments = [
  {
    _id: "907f1f77bcf86cd799439011" as unknown,
    studentId: student as unknown,
    classId: classA as unknown,
    courseId: courseA as unknown,
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "907f1f77bcf86cd799439014" as unknown,
    studentId: student2 as unknown,
    classId: classA as unknown,
    courseId: courseA as unknown,
    status: "ACTIVE",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function makeAssignment(overrides: Partial<IAssignment> = {}): IAssignment {
  return {
    _id: "a07f1f77bcf86cd799439011" as unknown as IAssignment["_id"],
    title: "HW1",
    description: "Homework 1",
    classId: classA as unknown as IAssignment["classId"],
    courseId: courseA as unknown as IAssignment["courseId"],
    dueDate: futureDate,
    maxPoints: 100,
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmissions: false,
    latePenaltyPercent: 0,
    submissionType: SubmissionType.TEXT,
    attachments: [],
    createdBy: teacher as unknown as IAssignment["createdBy"],
    publishedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as IAssignment;
}

const defaultMockAssignmentRepo = {
  create: async (data: Partial<IAssignment>) => makeAssignment(data),
  findById: async (id: string) => mockAssignments.find((a) => a._id?.toString() === id) ?? null,
  update: async (id: string, data: Partial<IAssignment>) => {
    const found = mockAssignments.find((a) => a._id?.toString() === id);
    if (!found) return null;
    const setObj = (data as { $set?: Record<string, unknown> })?.["$set"] || {};
    return { ...found, ...setObj } as IAssignment;
  },
  softDelete: async (id: string) => {
    const found = mockAssignments.find((a) => a._id?.toString() === id);
    if (!found) return null;
    return { ...found, isActive: false } as IAssignment;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async (filter?: Record<string, unknown>) => {
    return mockAssignments.filter((a) => a.isActive !== false && (filter?.isActive === undefined || filter.isActive === a.isActive)).length;
  },
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    const result = mockAssignments.filter((a) => {
      if (filter?.isActive === true && a.isActive !== true) return false;
      if (filter?.isActive === false && a.isActive !== false) return false;
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.classId) {
        const classIdVal = filter.classId as unknown;
        if (typeof classIdVal === "object" && classIdVal !== null && "$in" in classIdVal) {
          return (classIdVal as { $in: unknown[] }).$in.some((id) => id?.toString() === a.classId?.toString());
        }
        return classIdVal?.toString() === a.classId?.toString();
      }
      if (filter?.courseId) {
        const courseIdVal = filter.courseId as unknown;
        if (typeof courseIdVal === "object" && courseIdVal !== null && "$in" in courseIdVal) {
          return (courseIdVal as { $in: unknown[] }).$in.some((id) => id?.toString() === a.courseId?.toString());
        }
        return courseIdVal?.toString() === a.courseId?.toString();
      }
      return true;
    });
    return result as IAssignment[];
  },
  findByClass: async (classId: string) => mockAssignments.filter((a) => a.classId?.toString() === classId && a.isActive).sort((a, b) => (a as IAssignment).dueDate.getTime() - (b as IAssignment).dueDate.getTime()) as IAssignment[],
  findByTeacher: async (teacherId: string) => mockAssignments.filter((a) => a.createdBy?.toString() === teacherId && a.isActive).sort((a, b) => (a as IAssignment).createdAt.getTime() - (b as IAssignment).createdAt.getTime()) as IAssignment[],
};

const defaultMockClassRepo = {
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  findActiveClassIdsByTeacher: async (teacherId: string) => {
    return mockClasses.filter((c) => c.teacherId?.toString() === teacherId && c.isActive).map((c) => c._id?.toString() ?? "");
  },
};

const defaultMockEnrollmentRepo = {
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    let result = mockEnrollments.filter((e) => {
      if (filter?.isActive !== undefined && e.isActive !== filter.isActive) return false;
      return true;
    });
    if (filter?.studentId) {
      if (typeof filter.studentId === "object" && filter.studentId !== null && "$in" in filter.studentId) {
        result = result.filter((e) => (filter.studentId as { $in: unknown[] }).$in.some((id) => id?.toString() === e.studentId?.toString()));
      } else {
        result = result.filter((e) => e.studentId?.toString() === filter.studentId?.toString());
      }
    }
    return result;
  },
  findByStudentAndClass: async (sid: string, cid: string) => mockEnrollments.find((e) => e.studentId?.toString() === sid && e.classId?.toString() === cid && e.isActive) ?? null,
};

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

type AssignmentMockOverrides = Partial<typeof defaultMockAssignmentRepo>;
type ClassMockOverrides = Partial<typeof defaultMockClassRepo>;
type EnrollmentMockOverrides = Partial<typeof defaultMockEnrollmentRepo>;

let assignmentOverrides: AssignmentMockOverrides;
let classOverrides: ClassMockOverrides;
let enrollmentOverrides: EnrollmentMockOverrides;

function installMockRepo(): void {
  const assignmentRepo = assignmentRepository as unknown as Record<string, unknown>;
  const merged = { ...defaultMockAssignmentRepo, ...assignmentOverrides };
  assignmentRepo.create = merged.create;
  assignmentRepo.findById = merged.findById;
  assignmentRepo.update = merged.update;
  assignmentRepo.softDelete = merged.softDelete;
  assignmentRepo.exists = merged.exists;
  assignmentRepo.totalCount = merged.totalCount;
  assignmentRepo.findAllPaginated = merged.findAllPaginated;
  assignmentRepo.findByClass = merged.findByClass;
  assignmentRepo.findByTeacher = merged.findByTeacher;

  const classRepo = classRepository as unknown as Record<string, unknown>;
  const classMerged = { ...defaultMockClassRepo, ...classOverrides };
  classRepo.findById = classMerged.findById;
  classRepo.findActiveClassIdsByTeacher = classMerged.findActiveClassIdsByTeacher;

  const enrollmentRepo = enrollmentRepository as unknown as Record<string, unknown>;
  const enrollmentMerged = { ...defaultMockEnrollmentRepo, ...enrollmentOverrides };
  enrollmentRepo.findAllPaginated = enrollmentMerged.findAllPaginated;
  enrollmentRepo.findByStudentAndClass = enrollmentMerged.findByStudentAndClass;

  setupMockUsers();
}

describe("AssignmentService", () => {
  beforeEach(() => {
    assignmentOverrides = {};
    classOverrides = {};
    enrollmentOverrides = {};
    installMockRepo();
  });

  describe("listAssignments", () => {
    it("ADMIN can list all assignments", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, adminId);
      assert.equal(result.assignments.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("TEACHER can list assignments for own classes", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, teacher);
      assert.equal(result.assignments.length, 2);
    });

    it("STUDENT can list assignments for enrolled classes (published only)", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, student);
      assert.equal(result.assignments.length, 1);
      assert.equal(result.assignments[0].status, AssignmentStatus.PUBLISHED);
    });

    it("PARENT can list assignments for children's enrolled classes", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, parent);
      assert.equal(result.assignments.length, 1);
    });

    it("STUDENT cannot see DRAFT assignments", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, student);
      assert.equal(result.assignments.every((a) => a.status !== AssignmentStatus.DRAFT), true);
    });

    it("ADMIN can filter by isActive=false", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20, isActive: false }, adminId);
      assert.equal(result.assignments.length, 1);
      assert.equal(result.assignments[0].isActive, false);
    });

    it("STUDENT isActive=false is ignored (stays active-only)", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20, isActive: false }, student);
      assert.equal(result.assignments.length, 1);
      assert.equal(result.assignments.every((a) => a.isActive === true), true);
    });

    it("ADMIN can filter by status", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20, status: AssignmentStatus.DRAFT }, adminId);
      assert.equal(result.assignments.length, 1);
      assert.equal(result.assignments[0].status, AssignmentStatus.DRAFT);
    });

    it("STUDENT cannot filter by classId (ignored — scoped to enrolled)", async () => {
      const result = await assignmentService.listAssignments(
        { page: 1, limit: 20, classId: classB },
        student,
      );
      assert.equal(result.assignments.length, 1);
      assert.equal(result.assignments[0].classId, classA);
    });

    it("ADMIN can filter by courseId", async () => {
      const result = await assignmentService.listAssignments(
        { page: 1, limit: 20, courseId: courseA },
        adminId,
      );
      assert.equal(result.assignments.length, 2);
    });

    it("nonexistent user is rejected (UNAUTHORIZED)", async () => {
      try {
        await assignmentService.listAssignments({ page: 1, limit: 20 }, "507f1f77bcf86cd799439999");
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.UNAUTHORIZED);
      }
    });

    it("STUDENT with no enrollments gets empty result", async () => {
      const result = await assignmentService.listAssignments({ page: 1, limit: 20 }, noEnrollStudent);
      assert.equal(result.assignments.length, 0);
      assert.equal(result.pagination.total, 0);
    });
  });

  describe("getAssignmentById", () => {
    it("ADMIN can get any assignment", async () => {
      const result = await assignmentService.getAssignmentById("a07f1f77bcf86cd799439011", adminId);
      assert.equal(result.id, "a07f1f77bcf86cd799439011");
    });

    it("TEACHER can get assignment in own class", async () => {
      const result = await assignmentService.getAssignmentById("a07f1f77bcf86cd799439011", teacher);
      assert.equal(result.id, "a07f1f77bcf86cd799439011");
    });

    it("TEACHER cannot get assignment in another teacher's class (IDOR)", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439033", teacher);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT can get published assignment for enrolled class", async () => {
      const result = await assignmentService.getAssignmentById("a07f1f77bcf86cd799439011", student);
      assert.equal(result.id, "a07f1f77bcf86cd799439011");
    });

    it("STUDENT cannot get DRAFT assignment (not published)", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439022", student);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot get assignment for non-enrolled class (IDOR)", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439033", student);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("PARENT can get assignment for child's enrolled class", async () => {
      const result = await assignmentService.getAssignmentById("a07f1f77bcf86cd799439011", parent);
      assert.equal(result.id, "a07f1f77bcf86cd799439011");
    });

    it("PARENT cannot get assignment for non-child's class (IDOR)", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439033", parent);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for nonexistent assignment", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439999", adminId);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should return 404 for inactive assignment", async () => {
      try {
        await assignmentService.getAssignmentById("a07f1f77bcf86cd799439033", adminId);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("createAssignment", () => {
    it("ADMIN can create assignment", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
        adminId,
      );
      assert.equal(result.title, "Test HW");
      assert.equal(result.classId, classA);
      assert.equal(result.courseId, courseA);
      assert.equal(result.createdBy, adminId);
      assert.equal(result.status, AssignmentStatus.DRAFT);
      assert.equal(result.isActive, true);
    });

    it("TEACHER can create assignment for own class", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
        teacher,
      );
      assert.equal(result.title, "Test HW");
      assert.equal(result.courseId, courseA);
      assert.equal(result.createdBy, teacher);
    });

    it("STUDENT cannot create assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.createAssignment(
          { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot create assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.createAssignment(
          { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
          parent,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("TEACHER cannot create assignment for another teacher's class (IDOR)", async () => {
      try {
        await assignmentService.createAssignment(
          { title: "Test HW", classId: classB, dueDate: futureDateStr, maxPoints: 100 },
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
        await assignmentService.createAssignment(
          { title: "Test HW", classId: "807f1f77bcf86cd799439999", dueDate: futureDateStr, maxPoints: 100 },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should derive courseId from classId (not from body)", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
        adminId,
      );
      assert.equal(result.courseId, courseA);
    });

    it("should set createdBy from JWT (not from body)", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
        adminId,
      );
      assert.equal(result.createdBy, adminId);
    });

    it("should set publishedAt when status is PUBLISHED", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100, status: AssignmentStatus.PUBLISHED },
        adminId,
      );
      assert.ok(result.publishedAt !== null);
    });

    it("should set publishedAt to null when status is DRAFT", async () => {
      const result = await assignmentService.createAssignment(
        { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100, status: AssignmentStatus.DRAFT },
        adminId,
      );
      assert.equal(result.publishedAt, null);
    });

    it("should reject duplicate-key race condition with ASSIGNMENT_EXISTS 409", async () => {
      assignmentOverrides = {
        create: async () => {
          const dupError = new Error("E11000 duplicate key") as Error & { code: number };
          dupError.code = 11000;
          dupError.name = "MongoServerError";
          throw dupError;
        },
      };
      installMockRepo();

      try {
        await assignmentService.createAssignment(
          { title: "Test HW", classId: classA, dueDate: futureDateStr, maxPoints: 100 },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("updateAssignment (PUT)", () => {
    it("ADMIN can update assignment", async () => {
      const result = await assignmentService.updateAssignment(
        "a07f1f77bcf86cd799439011",
        {
          title: "Updated",
          description: "Updated desc",
          classId: classA,
          courseId: courseA,
          dueDate: futureDateStr,
          maxPoints: 100,
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmissions: false,
          latePenaltyPercent: 0,
          submissionType: SubmissionType.TEXT,
          attachments: [],
        },
        adminId,
      );
      assert.equal(result.title, "Updated");
    });

    it("TEACHER can update assignment for own class", async () => {
      const result = await assignmentService.updateAssignment(
        "a07f1f77bcf86cd799439011",
        {
          title: "Updated",
          description: null,
          classId: classA,
          courseId: courseA,
          dueDate: futureDateStr,
          maxPoints: 100,
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmissions: false,
          latePenaltyPercent: 0,
          submissionType: SubmissionType.TEXT,
          attachments: [],
        },
        teacher,
      );
      assert.equal(result.title, "Updated");
    });

    it("TEACHER cannot update assignment in another teacher's class (IDOR)", async () => {
      try {
        await assignmentService.updateAssignment(
          "a07f1f77bcf86cd799439033",
          {
            title: "Updated",
            description: null,
            classId: classB,
            courseId: courseB,
            dueDate: futureDateStr,
            maxPoints: 100,
            status: AssignmentStatus.PUBLISHED,
            allowLateSubmissions: false,
            latePenaltyPercent: 0,
            submissionType: SubmissionType.TEXT,
            attachments: [],
          },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot update assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.updateAssignment(
          "a07f1f77bcf86cd799439011",
          {
            title: "Updated",
            description: null,
            classId: classA,
            courseId: courseA,
            dueDate: futureDateStr,
            maxPoints: 100,
            status: AssignmentStatus.PUBLISHED,
            allowLateSubmissions: false,
            latePenaltyPercent: 0,
            submissionType: SubmissionType.TEXT,
            attachments: [],
          },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should derive courseId from classId even if body has different courseId", async () => {
      const result = await assignmentService.updateAssignment(
        "a07f1f77bcf86cd799439011",
        {
          title: "Updated",
          description: null,
          classId: classA,
          courseId: courseB,
          dueDate: futureDateStr,
          maxPoints: 100,
          status: AssignmentStatus.PUBLISHED,
          allowLateSubmissions: false,
          latePenaltyPercent: 0,
          submissionType: SubmissionType.TEXT,
          attachments: [],
        },
        adminId,
      );
      assert.equal(result.courseId, courseA);
    });

    it("should return 404 for nonexistent assignment", async () => {
      try {
        await assignmentService.updateAssignment(
          "a07f1f77bcf86cd799439999",
          {
            title: "Updated",
            description: null,
            classId: classA,
            courseId: courseA,
            dueDate: futureDateStr,
            maxPoints: 100,
            status: AssignmentStatus.PUBLISHED,
            allowLateSubmissions: false,
            latePenaltyPercent: 0,
            submissionType: SubmissionType.TEXT,
            attachments: [],
          },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });
  });

  describe("patchAssignment (PATCH)", () => {
    it("ADMIN can patch assignment status", async () => {
      const result = await assignmentService.patchAssignment(
        "a07f1f77bcf86cd799439011",
        { status: AssignmentStatus.ARCHIVED },
        adminId,
      );
      assert.equal(result.status, AssignmentStatus.ARCHIVED);
    });

    it("TEACHER can patch assignment for own class", async () => {
      const result = await assignmentService.patchAssignment(
        "a07f1f77bcf86cd799439011",
        { title: "Patched Title" },
        teacher,
      );
      assert.equal(result.title, "Patched Title");
    });

    it("TEACHER cannot patch assignment in another teacher's class (IDOR)", async () => {
      try {
        await assignmentService.patchAssignment(
          "a07f1f77bcf86cd799439033",
          { title: "Patched" },
          teacher,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot patch assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.patchAssignment(
          "a07f1f77bcf86cd799439011",
          { title: "Patched" },
          student,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should set publishedAt when transitioning to PUBLISHED", async () => {
      const result = await assignmentService.patchAssignment(
        "a07f1f77bcf86cd799439022",
        { status: AssignmentStatus.PUBLISHED },
        adminId,
      );
      assert.ok(result.publishedAt !== null);
    });

    it("should return same assignment if no fields provided in patch", async () => {
      const result = await assignmentService.patchAssignment(
        "a07f1f77bcf86cd799439011",
        {},
        adminId,
      );
      assert.equal(result.id, "a07f1f77bcf86cd799439011");
    });

    it("should reject duplicate-key race condition with ASSIGNMENT_EXISTS 409", async () => {
      assignmentOverrides = {
        update: async () => {
          const dupError = new Error("E11000 duplicate key") as Error & { code: number };
          dupError.code = 11000;
          dupError.name = "MongoServerError";
          throw dupError;
        },
      };
      installMockRepo();

      try {
        await assignmentService.patchAssignment(
          "a07f1f77bcf86cd799439022",
          { title: "Duplicate Title" },
          adminId,
        );
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.CONFLICT);
      }
    });
  });

  describe("deleteAssignment", () => {
    it("ADMIN can soft-delete assignment", async () => {
      const result = await assignmentService.deleteAssignment("a07f1f77bcf86cd799439022", adminId);
      assert.equal(result.isActive, false);
    });

    it("TEACHER can soft-delete assignment in own class", async () => {
      const result = await assignmentService.deleteAssignment("a07f1f77bcf86cd799439011", teacher);
      assert.equal(result.isActive, false);
    });

    it("TEACHER cannot soft-delete assignment in another teacher's class (IDOR)", async () => {
      try {
        await assignmentService.deleteAssignment("a07f1f77bcf86cd799439033", teacher);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("STUDENT cannot delete assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.deleteAssignment("a07f1f77bcf86cd799439011", student);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("PARENT cannot delete assignment (FORBIDDEN)", async () => {
      try {
        await assignmentService.deleteAssignment("a07f1f77bcf86cd799439011", parent);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.FORBIDDEN);
      }
    });

    it("should return 404 for nonexistent assignment", async () => {
      try {
        await assignmentService.deleteAssignment("a07f1f77bcf86cd799439999", adminId);
        assert.fail("Should have thrown");
      } catch (error) {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, STATUS_CODES.NOT_FOUND);
      }
    });

    it("should be idempotent (repeated soft-delete returns same result)", async () => {
      assignmentOverrides = {
        findById: async (id: string) => {
          const a = mockAssignments.find((as) => as._id?.toString() === id);
          if (!a) return null;
          return { ...a, isActive: false } as IAssignment;
        },
        softDelete: async (id: string) => {
          const a = mockAssignments.find((as) => as._id?.toString() === id);
          if (!a) return null;
          return { ...a, isActive: false } as IAssignment;
        },
      };
      installMockRepo();

      const result = await assignmentService.deleteAssignment("a07f1f77bcf86cd799439022", adminId);
      assert.equal(result.isActive, false);
    });
  });
});
