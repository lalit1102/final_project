import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { IGrade } from "@/types/grade.types";
import { IAssignment, AssignmentStatus, SubmissionType } from "@/types/assignment.types";
import { IClass } from "@/types/class.types";
import { IUser, UserRole } from "@/types/user.types";
import { IEnrollment, EnrollmentStatus } from "@/types/enrollment.types";
import { ISubmission, SubmissionStatus } from "@/types/submission.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { gradeService } from "@/services/grade.service";
import { gradeRepository } from "@/repositories/grade.repository";
import { assignmentRepository } from "@/repositories/assignment.repository";
import { classRepository } from "@/repositories/class.repository";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { userRepository } from "@/repositories/user.repository";
import { submissionRepository } from "@/repositories/submission.repository";

const teacher = "507f1f77bcf86cd799439011";
const otherTeacher = "507f1f77bcf86cd799439022";
const adminId = "507f1f77bcf86cd799439033";
const student = "507f1f77bcf86cd799439044";
const student2 = "507f1f77bcf86cd799439066";
const parent = "507f1f77bcf86cd799439055";
const otherParent = "507f1f77bcf86cd799439077";
const noEnrollStudent = "507f1f77bcf86cd799439099";
const inactiveUser = "507f1f77bcf86cd799439088";
const nonexistentUser = "507f1f77bcf86cd79943abcd";

const classA = "807f1f77bcf86cd799439011";
const classB = "807f1f77bcf86cd799439012";
const courseA = "707f1f77bcf86cd799439011";
const courseB = "707f1f77bcf86cd799439012";

const VALID_ASSIGNMENT_ID = "a07f1f77bcf86cd799439011";
const OTHER_ASSIGNMENT_ID = "a07f1f77bcf86cd799439022";
const OTHER_TEACHER_ASSIGNMENT_ID = "a07f1f77bcf86cd799439033";
const VALID_SUBMISSION_ID = "b07f1f77bcf86cd799439011";
const OTHER_SUBMISSION_ID = "b07f1f77bcf86cd799439022";
const VALID_GRADE_ID = "c07f1f77bcf86cd799439011";

const mockUsers: Record<string, Partial<IUser>> = {
  [teacher]: { _id: teacher as unknown as IUser["_id"], name: "Teacher Alice", email: "alice@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [otherTeacher]: { _id: otherTeacher as unknown as IUser["_id"], name: "Teacher Bob", email: "bob@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [adminId]: { _id: adminId as unknown as IUser["_id"], name: "Admin Root", email: "admin@example.com", role: UserRole.ADMIN, isActive: true, isVerified: true, parentIds: [] },
  [student]: { _id: student as unknown as IUser["_id"], name: "Student Carol", email: "carol@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [parent as unknown as IUser["_id"]] },
  [student2]: { _id: student2 as unknown as IUser["_id"], name: "Student Eve", email: "eve@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [otherParent as unknown as IUser["_id"]] },
  [parent]: { _id: parent as unknown as IUser["_id"], name: "Parent Dave", email: "dave@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [otherParent]: { _id: otherParent as unknown as IUser["_id"], name: "Parent Frank", email: "frank@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [noEnrollStudent]: { _id: noEnrollStudent as unknown as IUser["_id"], name: "Student NoEnroll", email: "noenroll@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [] },
  [inactiveUser]: { _id: inactiveUser as unknown as IUser["_id"], name: "Inactive User", email: "inactive@example.com", role: UserRole.STUDENT, isActive: false, isVerified: true, parentIds: [] },
};

const mockClasses: Partial<IClass>[] = [
  { _id: classA as unknown as IClass["_id"], name: "Class A", code: "CLA1", description: null, courseId: courseA as unknown as IClass["courseId"], teacherId: teacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: classB as unknown as IClass["_id"], name: "Class B", code: "CLB1", description: null, courseId: courseB as unknown as IClass["courseId"], teacherId: otherTeacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockAssignments: Partial<IAssignment>[] = [
  { _id: VALID_ASSIGNMENT_ID as unknown as IAssignment["_id"], title: "HW1", description: null, classId: classA as unknown as IAssignment["classId"], courseId: courseA as unknown as IAssignment["courseId"], dueDate: new Date(), maxPoints: 100, status: AssignmentStatus.PUBLISHED, allowLateSubmissions: false, latePenaltyPercent: 0, submissionType: SubmissionType.TEXT, attachments: [], createdBy: teacher as unknown as IAssignment["createdBy"], publishedAt: new Date(), isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: OTHER_ASSIGNMENT_ID as unknown as IAssignment["_id"], title: "HW2", description: null, classId: classA as unknown as IClass["_id"] as unknown as IAssignment["classId"], courseId: courseA as unknown as IAssignment["courseId"], dueDate: new Date(), maxPoints: 50, status: AssignmentStatus.DRAFT, allowLateSubmissions: true, latePenaltyPercent: 10, submissionType: SubmissionType.FILE, attachments: [], createdBy: teacher as unknown as IAssignment["createdBy"], publishedAt: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: OTHER_TEACHER_ASSIGNMENT_ID as unknown as IAssignment["_id"], title: "HW3", description: null, classId: classB as unknown as IClass["_id"] as unknown as IAssignment["classId"], courseId: courseB as unknown as IAssignment["courseId"], dueDate: new Date(), maxPoints: 75, status: AssignmentStatus.PUBLISHED, allowLateSubmissions: false, latePenaltyPercent: 0, submissionType: SubmissionType.TEXT, attachments: [], createdBy: otherTeacher as unknown as IAssignment["createdBy"], publishedAt: new Date(), isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "a07f1f77bcf86cd799439055" as unknown as IAssignment["_id"], title: "Inactive", description: null, classId: classA as unknown as IClass["_id"] as unknown as IAssignment["classId"], courseId: courseA as unknown as IAssignment["courseId"], dueDate: new Date(), maxPoints: 100, status: AssignmentStatus.PUBLISHED, allowLateSubmissions: false, latePenaltyPercent: 0, submissionType: SubmissionType.TEXT, attachments: [], createdBy: teacher as unknown as IAssignment["createdBy"], publishedAt: new Date(), isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

const mockEnrollments: Partial<IEnrollment>[] = [
  { _id: "907f1f77bcf86cd799439011" as unknown as IEnrollment["_id"], studentId: student as unknown as IEnrollment["studentId"], classId: classA as unknown as IEnrollment["classId"], courseId: courseA as unknown as IEnrollment["courseId"], status: EnrollmentStatus.ACTIVE, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "907f1f77bcf86cd799439022" as unknown as IEnrollment["_id"], studentId: student2 as unknown as IEnrollment["studentId"], classId: classA as unknown as IEnrollment["classId"], courseId: courseA as unknown as IEnrollment["courseId"], status: EnrollmentStatus.ACTIVE, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: "907f1f77bcf86cd799439033" as unknown as IEnrollment["_id"], studentId: student2 as unknown as IEnrollment["studentId"], classId: classB as unknown as IEnrollment["classId"], courseId: courseB as unknown as IEnrollment["courseId"], status: EnrollmentStatus.ACTIVE, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

function makeSubmission(overrides: Partial<ISubmission> = {}): ISubmission {
  return {
    _id: VALID_SUBMISSION_ID as unknown as ISubmission["_id"],
    assignmentId: VALID_ASSIGNMENT_ID as unknown as ISubmission["assignmentId"],
    studentId: student as unknown as ISubmission["studentId"],
    classId: classA as unknown as ISubmission["classId"],
    content: "My homework answer",
    attachments: [],
    submittedAt: new Date(),
    status: SubmissionStatus.SUBMITTED,
    isLate: false,
    gradedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ISubmission;
}

function makeGrade(overrides: Partial<IGrade> = {}): IGrade {
  return {
    _id: VALID_GRADE_ID as unknown as IGrade["_id"],
    studentId: student as unknown as IGrade["studentId"],
    assignmentId: VALID_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
    submissionId: VALID_SUBMISSION_ID as unknown as IGrade["submissionId"],
    classId: classA as unknown as IGrade["classId"],
    points: 85,
    maxPoints: 100,
    percentage: 85,
    feedback: "Good job",
    gradedBy: teacher as unknown as IGrade["gradedBy"],
    gradedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as IGrade;
}

let mockGrades: Partial<IGrade>[] = [];
let mockSubmissions: Partial<ISubmission>[] = [];

const defaultMockGradeRepo = {
  create: async (data: Partial<IGrade>): Promise<IGrade> => {
    const grade = makeGrade(data as Partial<IGrade>);
    mockGrades.push(grade);
    return grade;
  },
  findById: async (id: string): Promise<IGrade | null> => (mockGrades.find((g) => g._id?.toString() === id) ?? null) as IGrade | null,
  update: async (id: string, updateData: { $set?: Record<string, unknown> }): Promise<IGrade | null> => {
    const found = mockGrades.find((g) => g._id?.toString() === id);
    if (!found) return null;
    const setObj = updateData?.["$set"] || {};
    const updated = { ...found, ...setObj };
    const idx = mockGrades.findIndex((g) => g._id?.toString() === id);
    if (idx !== -1) mockGrades[idx] = updated;
    return updated as IGrade;
  },
  softDelete: async (id: string): Promise<IGrade | null> => {
    const found = mockGrades.find((g) => g._id?.toString() === id);
    if (!found) return null;
    const deactivated = { ...found, isActive: false };
    const idx = mockGrades.findIndex((g) => g._id?.toString() === id);
    if (idx !== -1) mockGrades[idx] = deactivated;
    return deactivated as IGrade;
  },
  exists: async (_filter: unknown): Promise<boolean> => false,
  totalCount: async (filter?: Record<string, unknown>): Promise<number> => {
    return mockGrades.filter((g) => {
      if (filter?.isActive !== undefined && g.isActive !== filter.isActive) return false;
      if (filter?.studentId) {
        if (typeof filter.studentId === "object" && filter.studentId !== null && "$in" in filter.studentId) {
          return (filter.studentId as { $in: unknown[] }).$in.some(
            (id) => id?.toString() === g.studentId?.toString(),
          );
        }
        return filter.studentId?.toString() === g.studentId?.toString();
      }
      if (filter?.assignmentId) {
        return filter.assignmentId?.toString() === g.assignmentId?.toString();
      }
      if (filter?.classId) {
        if (typeof filter.classId === "object" && filter.classId !== null && "$in" in filter.classId) {
          return (filter.classId as { $in: unknown[] }).$in.some(
            (id) => id?.toString() === g.classId?.toString(),
          );
        }
        return filter.classId?.toString() === g.classId?.toString();
      }
      return true;
    }).length;
  },
  findAllPaginated: async (
    filter?: Record<string, unknown>,
  ): Promise<IGrade[]> => {
    return mockGrades
      .filter((g) => {
        if (filter?.isActive !== undefined && g.isActive !== filter.isActive) return false;
        if (filter?.studentId) {
          if (typeof filter.studentId === "object" && filter.studentId !== null && "$in" in filter.studentId) {
            return (filter.studentId as { $in: unknown[] }).$in.some(
              (id) => id?.toString() === g.studentId?.toString(),
            );
          }
          return filter.studentId?.toString() === g.studentId?.toString();
        }
        if (filter?.assignmentId) {
          return filter.assignmentId?.toString() === g.assignmentId?.toString();
        }
        if (filter?.classId) {
          if (typeof filter.classId === "object" && filter.classId !== null && "$in" in filter.classId) {
            return (filter.classId as { $in: unknown[] }).$in.some(
              (id) => id?.toString() === g.classId?.toString(),
            );
          }
          return filter.classId?.toString() === g.classId?.toString();
        }
        if (filter?.submissionId) {
          return filter.submissionId?.toString() === g.submissionId?.toString();
        }
        if (filter?.["$or"]) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b as IGrade).createdAt.getTime() - (a as IGrade).createdAt.getTime()) as IGrade[];
  },
  findByStudent: async (sid: string): Promise<IGrade[]> =>
    mockGrades.filter((g) => g.studentId?.toString() === sid && g.isActive).sort((a, b) => (b as IGrade).createdAt.getTime() - (a as IGrade).createdAt.getTime()) as IGrade[],
  findByAssignment: async (aid: string): Promise<IGrade[]> =>
    mockGrades.filter((g) => g.assignmentId?.toString() === aid && g.isActive).sort((a, b) => (b as IGrade).createdAt.getTime() - (a as IGrade).createdAt.getTime()) as IGrade[],
  findBySubmission: async (sid: string): Promise<IGrade | null> =>
    (mockGrades.find((g) => g.submissionId?.toString() === sid && g.isActive) ?? null) as IGrade | null,
  findByStudentAndAssignment: async (studentId: string, assignmentId: string): Promise<IGrade | null> =>
    (mockGrades.find((g) => g.studentId?.toString() === studentId && g.assignmentId?.toString() === assignmentId && g.isActive) ?? null) as IGrade | null,
  findByClass: async (cid: string): Promise<IGrade[]> =>
    mockGrades.filter((g) => g.classId?.toString() === cid && g.isActive).sort((a, b) => (b as IGrade).createdAt.getTime() - (a as IGrade).createdAt.getTime()) as IGrade[],
  findByGradedBy: async (gid: string): Promise<IGrade[]> =>
    mockGrades.filter((g) => g.gradedBy?.toString() === gid && g.isActive).sort((a, b) => (b as IGrade).createdAt.getTime() - (a as IGrade).createdAt.getTime()) as IGrade[],
};

const defaultMockAssignmentRepo = {
  findById: async (id: string) => mockAssignments.find((a) => a._id?.toString() === id) ?? null,
  findAllPaginated: async () => mockAssignments,
  findActiveClassIdsByTeacher: async (_teacherId: string) => [],
};

const defaultMockClassRepo = {
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  findActiveClassIdsByTeacher: async (teacherId: string) =>
    mockClasses.filter((c) => c.teacherId?.toString() === teacherId && c.isActive).map((c) => c._id?.toString() ?? ""),
};

const defaultMockEnrollmentRepo = {
  findByStudentAndClass: async (sid: string, cid: string) =>
    mockEnrollments.find((e) => e.studentId?.toString() === sid && e.classId?.toString() === cid && e.isActive) ?? null,
  findAllPaginated: async () => mockEnrollments,
};

let mockSubmissionRepoOverride: Record<string, unknown> = {};

const defaultMockSubmissionRepo = {
  create: async (data: Partial<ISubmission>) => makeSubmission(data as Partial<ISubmission>),
  findById: async (id: string) => mockSubmissions.find((s) => s._id?.toString() === id) ?? null,
  update: async (id: string, data: { $set?: Record<string, unknown> }) => {
    const found = mockSubmissions.find((s) => s._id?.toString() === id);
    if (!found) return null;
    const setObj = data?.["$set"] || {};
    return { ...found, ...setObj } as ISubmission;
  },
  softDelete: async (id: string) => {
    const found = mockSubmissions.find((s) => s._id?.toString() === id);
    if (!found) return null;
    return { ...found, isActive: false } as ISubmission;
  },
  exists: async (_filter: unknown) => false,
  totalCount: async () => mockSubmissions.length,
  findAllPaginated: async () => mockSubmissions as ISubmission[],
  findByAssignment: async () => [],
  findByStudent: async () => [],
  findByAssignmentAndStudent: async () => null,
};

function setupMockUsers(): void {
  const userRepo = userRepository as unknown as Record<string, unknown>;
  userRepo.findByIdSafe = async (id: string) => mockUsers[id] ?? null;
  userRepo.findById = async (id: string) => mockUsers[id] ?? null;
  userRepo.findStudentsByParentId = async (parentId: string) => {
    return Object.values(mockUsers).filter(
      (u) =>
        u &&
        u.role === UserRole.STUDENT &&
        u.isActive &&
        (u.parentIds ?? []).some((pid) => pid?.toString() === parentId),
    ) as Partial<IUser>[];
  };
}

function installMockRepos(): void {
  const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
  Object.assign(gradeRepo, defaultMockGradeRepo);

  const assignmentRepo = assignmentRepository as unknown as Record<string, unknown>;
  Object.assign(assignmentRepo, defaultMockAssignmentRepo);

  const classRepo = classRepository as unknown as Record<string, unknown>;
  Object.assign(classRepo, defaultMockClassRepo);

  const enrollmentRepo = enrollmentRepository as unknown as Record<string, unknown>;
  Object.assign(enrollmentRepo, defaultMockEnrollmentRepo);

  const submissionRepo = submissionRepository as unknown as Record<string, unknown>;
  Object.assign(submissionRepo, { ...defaultMockSubmissionRepo, ...mockSubmissionRepoOverride });

  setupMockUsers();
}

describe("GradeService", () => {
  beforeEach(() => {
    mockGrades = [];
    mockSubmissions = [
      makeSubmission({ _id: VALID_SUBMISSION_ID as unknown as ISubmission["_id"], status: SubmissionStatus.SUBMITTED, studentId: student as unknown as ISubmission["studentId"] }),
      makeSubmission({ _id: OTHER_SUBMISSION_ID as unknown as ISubmission["_id"], status: SubmissionStatus.SUBMITTED, studentId: student2 as unknown as ISubmission["studentId"], assignmentId: OTHER_ASSIGNMENT_ID as unknown as ISubmission["assignmentId"] }),
    ];
    mockSubmissionRepoOverride = {};
    installMockRepos();
  });

  describe("createGrade", () => {
    it("TEACHER creates grade with submissionId", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, submissionId: VALID_SUBMISSION_ID, points: 85, feedback: "Good" },
        teacher,
      );
      assert.equal(result.points, 85);
      assert.equal(result.maxPoints, 100);
      assert.equal(result.percentage, 85);
      assert.equal(result.studentId, student);
      assert.equal(result.assignmentId, VALID_ASSIGNMENT_ID);
      assert.equal(result.submissionId, VALID_SUBMISSION_ID);
      assert.equal(result.classId, classA);
      assert.equal(result.feedback, "Good");
      assert.equal(result.gradedBy, teacher);
      assert.equal(result.isActive, true);
    });

    it("TEACHER creates grade without submissionId (manual grading)", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50, feedback: null },
        teacher,
      );
      assert.equal(result.points, 50);
      assert.equal(result.percentage, 50);
      assert.equal(result.submissionId, null);
    });

    it("ADMIN creates grade without enrollment check", async () => {
      const result = await gradeService.createGrade(
        { studentId: noEnrollStudent, assignmentId: VALID_ASSIGNMENT_ID, points: 90, feedback: "Admin override" },
        adminId,
      );
      assert.equal(result.points, 90);
      assert.equal(result.percentage, 90);
      assert.equal(result.studentId, noEnrollStudent);
    });

    it("ADMIN creates grade for student not enrolled in class", async () => {
      const result = await gradeService.createGrade(
        { studentId: student2, assignmentId: VALID_ASSIGNMENT_ID, points: 75, feedback: "OK" },
        adminId,
      );
      assert.equal(result.points, 75);
      assert.equal(result.studentId, student2);
    });

    it("TEACHER cannot create grade for student not enrolled in class (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: noEnrollStudent, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("TEACHER cannot create grade for another teacher's assignment (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: OTHER_TEACHER_ASSIGNMENT_ID, points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot create grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot create grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("should reject points > maxPoints (400)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 101 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.BAD_REQUEST,
      );
    });

    it("should accept points == maxPoints", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 100, feedback: null },
        teacher,
      );
      assert.equal(result.percentage, 100);
    });

    it("should accept points = 0", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 0, feedback: "Zero" },
        teacher,
      );
      assert.equal(result.percentage, 0);
    });

    it("should reject negative points via service (400)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: -5 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.BAD_REQUEST,
      );
    });

    it("should reject invalid/nonexistent assignment (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: "nonexistent1234567", points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject nonexistent student (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: "nonexistent1234567", assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject nonexistent submission (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, submissionId: "nonexistentsub123", points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject submission belonging to different student (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student2, assignmentId: VALID_ASSIGNMENT_ID, submissionId: VALID_SUBMISSION_ID, points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject submission belonging to different assignment (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, submissionId: OTHER_SUBMISSION_ID, points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject inactive assignment (404)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: "a07f1f77bcf86cd799439055", points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("inactive user cannot create grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, inactiveUser),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("nonexistent user cannot create grade (401)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, nonexistentUser),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.UNAUTHORIZED,
      );
    });

    it("ADMIN can override maxPoints (101 > 100 rejected even for admin)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 101 }, adminId),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.BAD_REQUEST,
      );
    });

    it("should snapshot maxPoints from assignment", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
        teacher,
      );
      assert.equal(result.maxPoints, 100);
    });

    it("should calculate percentage for 50/100", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
        teacher,
      );
      assert.equal(result.percentage, 50);
    });

    it("should calculate percentage for 1/3 (2 decimal precision)", async () => {
      const result = await gradeService.createGrade(
        { studentId: student, assignmentId: OTHER_ASSIGNMENT_ID, points: 1 },
        teacher,
      );
      assert.equal(result.percentage, 2);
    });

    it("should handle duplicate race (11000) as 409 CONFLICT", async () => {
      const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
      const originalCreate = gradeRepo.create;
      gradeRepo.create = async (): Promise<IGrade> => {
        const err: Error & { code?: number } = new Error("E11000 duplicate key");
        err.code = 11000;
        throw err;
      };

      try {
        await assert.rejects(
          async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, teacher),
          (err: Error) => {
            return err instanceof AppError && err.statusCode === STATUS_CODES.CONFLICT && err.message === ERROR_MESSAGES.GRADE_EXISTS;
          },
        );
      } finally {
        gradeRepo.create = originalCreate;
      }
    });

    it("should handle existing grade before create as 409", async () => {
      mockGrades.push(makeGrade({ _id: "c07f1f77bcf86cd79943aaa" as unknown as IGrade["_id"] }));

      const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
      const originalFind = gradeRepo.findByStudentAndAssignment;
      gradeRepo.findByStudentAndAssignment = async (sid: string, aid: string): Promise<IGrade | null> => {
        if (sid === student && aid === VALID_ASSIGNMENT_ID) {
          return makeGrade({ _id: "c07f1f77bcf86cd79943aaa" as unknown as IGrade["_id"] });
        }
        return null;
      };

      try {
        await assert.rejects(
          async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, teacher),
          (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.CONFLICT && err.message === ERROR_MESSAGES.GRADE_EXISTS,
        );
      } finally {
        gradeRepo.findByStudentAndAssignment = originalFind;
      }
    });
  });

  describe("getGradeById", () => {
    beforeEach(() => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] })];
    });

    it("TEACHER can get grade for own assignment", async () => {
      const result = await gradeService.getGradeById(VALID_GRADE_ID, teacher);
      assert.equal(result.points, 85);
    });

    it("ADMIN can get any grade", async () => {
      const result = await gradeService.getGradeById(VALID_GRADE_ID, adminId);
      assert.equal(result.points, 85);
    });

    it("STUDENT can get own grade", async () => {
      const result = await gradeService.getGradeById(VALID_GRADE_ID, student);
      assert.equal(result.studentId, student);
    });

    it("STUDENT cannot get another student's grade (404)", async () => {
      await assert.rejects(
        async () => gradeService.getGradeById(VALID_GRADE_ID, student2),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("TEACHER cannot get grade for another teacher's assignment (404)", async () => {
      const grade = makeGrade({
        _id: "c07f1f77bcf86cd799439022" as unknown as IGrade["_id"],
        assignmentId: OTHER_TEACHER_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
        studentId: student2 as unknown as IGrade["studentId"],
      });
      mockGrades = [grade];
      await assert.rejects(
        async () => gradeService.getGradeById("c07f1f77bcf86cd799439022", teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("PARENT can get grade for own child", async () => {
      const result = await gradeService.getGradeById(VALID_GRADE_ID, parent);
      assert.equal(result.studentId, student);
    });

    it("PARENT cannot get grade for another student's child (404)", async () => {
      const grade = makeGrade({
        _id: "c07f1f77bcf86cd799439033" as unknown as IGrade["_id"],
        studentId: student2 as unknown as IGrade["studentId"],
      });
      mockGrades = [grade];
      await assert.rejects(
        async () => gradeService.getGradeById("c07f1f77bcf86cd799439033", parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot get grade for inactive grade (404)", async () => {
      const grade = makeGrade({ _id: "c07f1f77bcf86cd799439044" as unknown as IGrade["_id"], isActive: false });
      mockGrades = [grade];
      await assert.rejects(
        async () => gradeService.getGradeById("c07f1f77bcf86cd799439044", student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("nonexistent grade returns 404", async () => {
      await assert.rejects(
        async () => gradeService.getGradeById("nonexistentgrade123", teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot create/get as STUDENT role for creating (covered by RBAC)", async () => {
      await assert.rejects(
        async () => gradeService.createGrade({ studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });
  });

  describe("updateGrade (PUT)", () => {
    beforeEach(() => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] })];
    });

    it("TEACHER updates own grade", async () => {
      const result = await gradeService.updateGrade(
        VALID_GRADE_ID,
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 90, feedback: "Updated" },
        teacher,
      );
      assert.equal(result.points, 90);
      assert.equal(result.percentage, 90);
      assert.equal(result.feedback, "Updated");
    });

    it("ADMIN updates any grade", async () => {
      const result = await gradeService.updateGrade(
        VALID_GRADE_ID,
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 95 },
        adminId,
      );
      assert.equal(result.points, 95);
      assert.equal(result.percentage, 95);
    });

    it("TEACHER cannot update grade for another teacher's assignment (404)", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: student2, assignmentId: OTHER_TEACHER_ASSIGNMENT_ID, points: 50 },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot update grade (403)", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
            student,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot update grade (403)", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
            parent,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("should reject PUT with points > maxPoints (400)", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 101 },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.BAD_REQUEST,
      );
    });

    it("should recompute percentage on points change", async () => {
      const result = await gradeService.updateGrade(
        VALID_GRADE_ID,
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 30 },
        teacher,
      );
      assert.equal(result.percentage, 30);
    });

    it("should update gradedBy and gradedAt on PUT", async () => {
      const result = await gradeService.updateGrade(
        VALID_GRADE_ID,
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 70 },
        teacher,
      );
      assert.equal(result.gradedBy, teacher);
      assert.ok(result.gradedAt);
    });

    it("should reject nonexistent grade (404)", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            "nonexistentgrade123",
            { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject grade for inactive grade (404)", async () => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], isActive: false })];
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("TEACHER re-validates enrollment when changing studentId", async () => {
      await assert.rejects(
        async () =>
          gradeService.updateGrade(
            VALID_GRADE_ID,
            { studentId: noEnrollStudent, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should reject PUT that creates duplicate student/assignment (409)", async () => {
      const otherGrade = makeGrade({
        _id: "c07f1f77bcf86cd79943bbb" as unknown as IGrade["_id"],
        studentId: student as unknown as IGrade["studentId"],
        assignmentId: VALID_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
      });
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] }), otherGrade];

      const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
      const originalFind = gradeRepo.findByStudentAndAssignment;
      gradeRepo.findByStudentAndAssignment = async (sid: string, aid: string): Promise<IGrade | null> => {
        if (sid === student && aid === VALID_ASSIGNMENT_ID) {
          return otherGrade;
        }
        return null;
      };

      try {
        await assert.rejects(
          async () =>
            gradeService.updateGrade(
              VALID_GRADE_ID,
              { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 50 },
              teacher,
            ),
          (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.CONFLICT,
        );
      } finally {
        gradeRepo.findByStudentAndAssignment = originalFind;
      }
    });
  });

  describe("patchGrade (PATCH)", () => {
    beforeEach(() => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] })];
    });

    it("TEACHER patches points", async () => {
      const result = await gradeService.patchGrade(VALID_GRADE_ID, { points: 70, feedback: "Patched" }, teacher);
      assert.equal(result.points, 70);
      assert.equal(result.percentage, 70);
      assert.equal(result.feedback, "Patched");
    });

    it("TEACHER patches feedback only", async () => {
      const result = await gradeService.patchGrade(VALID_GRADE_ID, { feedback: "New feedback" }, teacher);
      assert.equal(result.feedback, "New feedback");
      assert.equal(result.points, 85);
    });

    it("ADMIN patches points", async () => {
      const result = await gradeService.patchGrade(VALID_GRADE_ID, { points: 95 }, adminId);
      assert.equal(result.points, 95);
      assert.equal(result.percentage, 95);
    });

    it("STUDENT cannot patch grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.patchGrade(VALID_GRADE_ID, { points: 50 }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot patch grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.patchGrade(VALID_GRADE_ID, { points: 50 }, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("TEACHER cannot patch grade for another teacher's assignment (404)", async () => {
      const grade = makeGrade({
        _id: "c07f1f77bcf86cd799439022" as unknown as IGrade["_id"],
        assignmentId: OTHER_TEACHER_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
      });
      mockGrades = [grade];
      await assert.rejects(
        async () => gradeService.patchGrade("c07f1f77bcf86cd799439022", { points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("recalculates percentage when points change via PATCH", async () => {
      const result = await gradeService.patchGrade(VALID_GRADE_ID, { points: 50 }, teacher);
      assert.equal(result.percentage, 50);
    });

    it("rejects PATCH with points > maxPoints (400)", async () => {
      await assert.rejects(
        async () => gradeService.patchGrade(VALID_GRADE_ID, { points: 101 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.BAD_REQUEST,
      );
    });

    it("rejects PATCH with null points (Zod handles before service, but test anyway)", async () => {
      const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
      const originalUpdate = gradeRepo.update;
      gradeRepo.update = async () => null;

      try {
        await gradeService.patchGrade(VALID_GRADE_ID, { points: 50 }, teacher);
      } catch (error) {
        assert.ok(error instanceof AppError);
      } finally {
        gradeRepo.update = originalUpdate;
      }
    });

    it("no-op patch returns current grade", async () => {
      const result = await gradeService.patchGrade(VALID_GRADE_ID, {}, teacher);
      assert.equal(result.points, 85);
      assert.equal(result.feedback, "Good job");
    });

    it("nonexistent grade PATCH (404)", async () => {
      await assert.rejects(
        async () => gradeService.patchGrade("nonexistentgrade123", { points: 50 }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });
  });

  describe("deleteGrade", () => {
    beforeEach(() => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] })];
    });

    it("TEACHER can deactivate own grade", async () => {
      const result = await gradeService.deleteGrade(VALID_GRADE_ID, teacher);
      assert.equal(result.isActive, false);
    });

    it("ADMIN can delete any grade", async () => {
      const result = await gradeService.deleteGrade(VALID_GRADE_ID, adminId);
      assert.equal(result.isActive, false);
    });

    it("STUDENT cannot delete grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.deleteGrade(VALID_GRADE_ID, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot delete grade (403)", async () => {
      await assert.rejects(
        async () => gradeService.deleteGrade(VALID_GRADE_ID, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("TEACHER cannot delete grade for another teacher's assignment (404)", async () => {
      const grade = makeGrade({
        _id: "c07f1f77bcf86cd799439022" as unknown as IGrade["_id"],
        assignmentId: OTHER_TEACHER_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
      });
      mockGrades = [grade];
      await assert.rejects(
        async () => gradeService.deleteGrade("c07f1f77bcf86cd799439022", teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("nonexistent grade returns 404", async () => {
      await assert.rejects(
        async () => gradeService.deleteGrade("nonexistentgrade123", teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("should clear Submission.gradedAt on soft-delete (best-effort)", async () => {
      let gradedAtClearCalled = false;
      mockSubmissionRepoOverride = {
        ...mockSubmissionRepoOverride,
        findById: async (id: string) =>
          mockSubmissions.find((s) => s._id?.toString() === id) ?? null,
        update: async (id: string, data: { $set?: Record<string, unknown> }) => {
          const setObj = data?.["$set"] || {};
          if (id === VALID_SUBMISSION_ID) {
            if ("gradedAt" in setObj && setObj.gradedAt === null) {
              gradedAtClearCalled = true;
            }
          }
          const found = mockSubmissions.find((s) => s._id?.toString() === id);
          if (!found) return null;
          return { ...found, ...setObj } as ISubmission;
        },
      };
      installMockRepos();

      await gradeService.deleteGrade(VALID_GRADE_ID, teacher);
      assert.ok(gradedAtClearCalled, "Submission.gradedAt should have been cleared");
    });

    it("should allow re-create after soft-delete", async () => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], isActive: false })];

      const gradeRepo = gradeRepository as unknown as Record<string, unknown>;
      const originalFindByStudentAndAssignment = gradeRepo.findByStudentAndAssignment;
      gradeRepo.findByStudentAndAssignment = async (): Promise<IGrade | null> => null;

      try {
        const result = await gradeService.createGrade(
          { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 60 },
          teacher,
        );
        assert.equal(result.points, 60);
      } finally {
        gradeRepo.findByStudentAndAssignment = originalFindByStudentAndAssignment;
      }
    });

    it("deleting already-inactive grade returns the grade (idempotent)", async () => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], isActive: false })];
      const result = await gradeService.deleteGrade(VALID_GRADE_ID, teacher);
      assert.equal(result.isActive, false);
    });
  });

  describe("listGrades", () => {
    beforeEach(() => {
      mockGrades = [
        makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] }),
        makeGrade({
          _id: "c07f1f77bcf86cd799439022" as unknown as IGrade["_id"],
          studentId: student2 as unknown as IGrade["studentId"],
          assignmentId: OTHER_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
          points: 40,
        }),
      ];
    });

    it("ADMIN can list all grades", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20 }, adminId);
      assert.equal(result.grades.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("ADMIN can filter by studentId", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20, studentId: student }, adminId);
      assert.equal(result.grades.length, 1);
      assert.equal(result.grades[0].studentId, student);
    });

    it("ADMIN can filter by assignmentId", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20, assignmentId: VALID_ASSIGNMENT_ID }, adminId);
      assert.equal(result.grades.length, 1);
    });

    it("STUDENT can only list own grades (query param override ignored)", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20, studentId: student2 }, student);
      assert.equal(result.grades.length, 1);
      assert.equal(result.grades[0].studentId, student);
    });

    it("STUDENT cannot list grades for another student via query param (IDOR blocked)", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20, studentId: student2 }, student);
      assert.equal(result.grades.length, 1);
      assert.equal(result.grades[0].studentId, student);
    });

    it("TEACHER can only list grades for own classes", async () => {
      mockGrades = [
        makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"] }),
        makeGrade({
          _id: "c07f1f77bcf86cd799439022" as unknown as IGrade["_id"],
          studentId: student2 as unknown as IGrade["studentId"],
          assignmentId: OTHER_ASSIGNMENT_ID as unknown as IGrade["assignmentId"],
          classId: classB as unknown as IGrade["classId"],
          points: 40,
        }),
      ];
      const result = await gradeService.listGrades({ page: 1, limit: 20 }, teacher);
      assert.equal(result.grades.length, 1);
    });

    it("TEACHER cannot list grades for another teacher's assignment via query param (IDOR blocked)", async () => {
      await assert.rejects(
        async () =>
          gradeService.listGrades(
            { page: 1, limit: 20, assignmentId: OTHER_TEACHER_ASSIGNMENT_ID },
            teacher,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("PARENT can list grades for own children", async () => {
      const result = await gradeService.listGrades({ page: 1, limit: 20 }, parent);
      assert.equal(result.grades.length, 1);
      assert.equal(result.grades[0].studentId, student);
    });

    it("PARENT cannot list grades for unrelated students (query param override)", async () => {
      mockGrades = [
        makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], studentId: student as unknown as IGrade["studentId"] }),
      ];
      const result = await gradeService.listGrades({ page: 1, limit: 20, studentId: student }, otherParent);
      assert.equal(result.grades.length, 0);
    });

    it("STUDENT cannot use assignmentId for another class as query param bypass (IDOR blocked)", async () => {
      await assert.rejects(
        async () =>
          gradeService.listGrades(
            { page: 1, limit: 20, assignmentId: OTHER_TEACHER_ASSIGNMENT_ID },
            student,
          ),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });
  });

  describe("re-grading", () => {
    it("re-grading updates points, percentage, and gradedAt", async () => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], points: 50, percentage: 50 })];
      const result = await gradeService.patchGrade(VALID_GRADE_ID, { points: 75 }, teacher);
      assert.equal(result.points, 75);
      assert.equal(result.percentage, 75);
    });

    it("re-grading via PUT updates maxPoints snapshot from assignment", async () => {
      mockGrades = [makeGrade({ _id: VALID_GRADE_ID as unknown as IGrade["_id"], maxPoints: 100 })];
      const result = await gradeService.updateGrade(
        VALID_GRADE_ID,
        { studentId: student, assignmentId: VALID_ASSIGNMENT_ID, points: 25 },
        teacher,
      );
      assert.equal(result.maxPoints, 100);
      assert.equal(result.percentage, 25);
    });
  });
});
