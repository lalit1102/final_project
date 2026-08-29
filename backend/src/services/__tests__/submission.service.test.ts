import { describe, it, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { ISubmission, SubmissionStatus } from "@/types/submission.types";
import { IAssignment, AssignmentStatus, SubmissionType } from "@/types/assignment.types";
import { IClass } from "@/types/class.types";
import { IUser, UserRole } from "@/types/user.types";
import { IEnrollment, EnrollmentStatus } from "@/types/enrollment.types";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { submissionService } from "@/services/submission.service";
import { submissionRepository } from "@/repositories/submission.repository";
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
const inactiveStudent = "507f1f77bcf86cd799439088";

const classA = "807f1f77bcf86cd799439011";
const classB = "807f1f77bcf86cd799439012";
const courseA = "707f1f77bcf86cd799439011";
const courseB = "707f1f77bcf86cd799439012";

const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const VALID_ASSIGNMENT_ID = "a07f1f77bcf86cd799439011";
const VALID_SUBMISSION_ID = "b07f1f77bcf86cd799439011";

const mockUsers: Record<string, Partial<IUser>> = {
  [teacher]: { _id: teacher as unknown as IUser["_id"], name: "Teacher Alice", email: "alice@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [otherTeacher]: { _id: otherTeacher as unknown as IUser["_id"], name: "Teacher Bob", email: "bob@example.com", role: UserRole.TEACHER, isActive: true, isVerified: true, parentIds: [] },
  [adminId]: { _id: adminId as unknown as IUser["_id"], name: "Admin Root", email: "admin@example.com", role: UserRole.ADMIN, isActive: true, isVerified: true, parentIds: [] },
  [student]: { _id: student as unknown as IUser["_id"], name: "Student Carol", email: "carol@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [parent as unknown as IUser["_id"]] },
  [student2]: { _id: student2 as unknown as IUser["_id"], name: "Student Eve", email: "eve@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [otherParent as unknown as IUser["_id"]] },
  [parent]: { _id: parent as unknown as IUser["_id"], name: "Parent Dave", email: "dave@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [otherParent]: { _id: otherParent as unknown as IUser["_id"], name: "Parent Frank", email: "frank@example.com", role: UserRole.PARENT, isActive: true, isVerified: true, parentIds: [] },
  [noEnrollStudent]: { _id: noEnrollStudent as unknown as IUser["_id"], name: "Student NoEnroll", email: "noenroll@example.com", role: UserRole.STUDENT, isActive: true, isVerified: true, parentIds: [] },
  [inactiveStudent]: { _id: inactiveStudent as unknown as IUser["_id"], name: "Inactive Student", email: "inactive@example.com", role: UserRole.STUDENT, isActive: false, isVerified: true, parentIds: [] },
};

const mockClasses: Partial<IClass>[] = [
  { _id: classA as unknown as IClass["_id"], name: "Class A", code: "CLA1", description: "Math class A", courseId: courseA as unknown as IClass["courseId"], teacherId: teacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: classB as unknown as IClass["_id"], name: "Class B", code: "CLB1", description: null, courseId: courseB as unknown as IClass["courseId"], teacherId: otherTeacher as unknown as IClass["teacherId"], startDate: null, endDate: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const mockAssignments: Partial<IAssignment>[] = [
  {
    _id: VALID_ASSIGNMENT_ID as unknown as IAssignment["_id"],
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
    title: "Late HW",
    description: "Past due",
    classId: classB as unknown as IAssignment["classId"],
    courseId: courseB as unknown as IAssignment["courseId"],
    dueDate: pastDate,
    maxPoints: 50,
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmissions: false,
    latePenaltyPercent: 0,
    submissionType: SubmissionType.TEXT,
    attachments: [],
    createdBy: otherTeacher as unknown as IAssignment["createdBy"],
    publishedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "a07f1f77bcf86cd799439044" as unknown as IAssignment["_id"],
    title: "None Type",
    description: null,
    classId: classA as unknown as IAssignment["classId"],
    courseId: courseA as unknown as IAssignment["courseId"],
    dueDate: futureDate,
    maxPoints: 100,
    status: AssignmentStatus.PUBLISHED,
    allowLateSubmissions: false,
    latePenaltyPercent: 0,
    submissionType: SubmissionType.NONE,
    attachments: [],
    createdBy: teacher as unknown as IAssignment["createdBy"],
    publishedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "a07f1f77bcf86cd799439055" as unknown as IAssignment["_id"],
    title: "Inactive Assignment",
    description: null,
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
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEnrollments: Partial<IEnrollment>[] = [
  {
    _id: "907f1f77bcf86cd799439011" as unknown as IEnrollment["_id"],
    studentId: student as unknown as IEnrollment["studentId"],
    classId: classA as unknown as IEnrollment["classId"],
    courseId: courseA as unknown as IEnrollment["courseId"],
    status: EnrollmentStatus.ACTIVE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "907f1f77bcf86cd799439022" as unknown as IEnrollment["_id"],
    studentId: student2 as unknown as IEnrollment["studentId"],
    classId: classA as unknown as IEnrollment["classId"],
    courseId: courseA as unknown as IEnrollment["courseId"],
    status: EnrollmentStatus.ACTIVE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "907f1f77bcf86cd799439033" as unknown as IEnrollment["_id"],
    studentId: student2 as unknown as IEnrollment["studentId"],
    classId: classB as unknown as IEnrollment["classId"],
    courseId: courseB as unknown as IEnrollment["courseId"],
    status: EnrollmentStatus.ACTIVE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function makeSubmission(overrides: Partial<ISubmission> = {}): ISubmission {
  return {
    _id: VALID_SUBMISSION_ID as unknown as ISubmission["_id"],
    assignmentId: VALID_ASSIGNMENT_ID as unknown as ISubmission["assignmentId"],
    studentId: student as unknown as ISubmission["studentId"],
    classId: classA as unknown as ISubmission["classId"],
    content: "My homework answer",
    attachments: [],
    submittedAt: null,
    status: SubmissionStatus.DRAFT,
    isLate: false,
    gradedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ISubmission;
}

let mockSubmissions: Partial<ISubmission>[] = [];

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
  totalCount: async (filter?: Record<string, unknown>) => {
    return mockSubmissions.filter((s) => {
      if (filter?.isActive !== undefined && s.isActive !== filter.isActive) return false;
      if (filter?.status && s.status !== filter.status) return false;
      if (filter?.studentId) {
        if (typeof filter.studentId === "object" && filter.studentId !== null && "$in" in filter.studentId) {
          return (filter.studentId as { $in: unknown[] }).$in.some((id) => id?.toString() === s.studentId?.toString());
        }
        return filter.studentId?.toString() === s.studentId?.toString();
      }
      if (filter?.assignmentId) {
        if (typeof filter.assignmentId === "object" && filter.assignmentId !== null && "$in" in filter.assignmentId) {
          return (filter.assignmentId as { $in: unknown[] }).$in.some((id) => id?.toString() === s.assignmentId?.toString());
        }
        return filter.assignmentId?.toString() === s.assignmentId?.toString();
      }
      if (filter?.classId) {
        return filter.classId?.toString() === s.classId?.toString();
      }
      return true;
    }).length;
  },
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    return mockSubmissions.filter((s) => {
      if (filter?.isActive !== undefined && s.isActive !== filter.isActive) return false;
      if (filter?.status && s.status !== filter.status) return false;
      if (filter?.studentId) {
        if (typeof filter.studentId === "object" && filter.studentId !== null && "$in" in filter.studentId) {
          return (filter.studentId as { $in: unknown[] }).$in.some((id) => id?.toString() === s.studentId?.toString());
        }
        return filter.studentId?.toString() === s.studentId?.toString();
      }
      if (filter?.assignmentId) {
        if (typeof filter.assignmentId === "object" && filter.assignmentId !== null && "$in" in filter.assignmentId) {
          return (filter.assignmentId as { $in: unknown[] }).$in.some((id) => id?.toString() === s.assignmentId?.toString());
        }
        return filter.assignmentId?.toString() === s.assignmentId?.toString();
      }
      if (filter?.classId) {
        return filter.classId?.toString() === s.classId?.toString();
      }
      return true;
    }) as ISubmission[];
  },
  findByAssignment: async (assignmentId: string) => mockSubmissions.filter((s) => s.assignmentId?.toString() === assignmentId).sort((a, b) => (b as ISubmission).createdAt.getTime() - (a as ISubmission).createdAt.getTime()) as ISubmission[],
  findByStudent: async (sid: string) => mockSubmissions.filter((s) => s.studentId?.toString() === sid).sort((a, b) => (b as ISubmission).createdAt.getTime() - (a as ISubmission).createdAt.getTime()) as ISubmission[],
  findByAssignmentAndStudent: async (assignmentId: string, sid: string) => mockSubmissions.find((s) => s.assignmentId?.toString() === assignmentId && s.studentId?.toString() === sid && s.isActive) ?? null,
};

const defaultMockAssignmentRepo = {
  findById: async (id: string) => mockAssignments.find((a) => a._id?.toString() === id) ?? null,
  findAllPaginated: async (filter?: Record<string, unknown>) => {
    return mockAssignments.filter((a) => {
      if (filter?.isActive !== undefined && a.isActive !== filter.isActive) return false;
      if (filter?.classId) {
        if (typeof filter.classId === "object" && filter.classId !== null && "$in" in filter.classId) {
          return (filter.classId as { $in: unknown[] }).$in.some((id) => id?.toString() === a.classId?.toString());
        }
        return filter.classId?.toString() === a.classId?.toString();
      }
      if (filter?.createdBy) {
        return filter.createdBy?.toString() === a.createdBy?.toString();
      }
      return true;
    });
  },
  findActiveClassIdsByTeacher: async (_teacherId: string) => [],
};

const defaultMockClassRepo = {
  findById: async (id: string) => mockClasses.find((c) => c._id?.toString() === id) ?? null,
  findActiveClassIdsByTeacher: async (teacherId: string) => {
    return mockClasses.filter((c) => c.teacherId?.toString() === teacherId && c.isActive).map((c) => c._id?.toString() ?? "");
  },
};

const defaultMockEnrollmentRepo = {
  findByStudentAndClass: async (sid: string, cid: string) => mockEnrollments.find((e) => e.studentId?.toString() === sid && e.classId?.toString() === cid && e.isActive) ?? null,
  findAllPaginated: async () => mockEnrollments,
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

function installMockRepo(): void {
  const submissionRepo = submissionRepository as unknown as Record<string, unknown>;
  Object.assign(submissionRepo, defaultMockSubmissionRepo);

  const assignmentRepo = assignmentRepository as unknown as Record<string, unknown>;
  Object.assign(assignmentRepo, defaultMockAssignmentRepo);

  const classRepo = classRepository as unknown as Record<string, unknown>;
  Object.assign(classRepo, defaultMockClassRepo);

  const enrollmentRepo = enrollmentRepository as unknown as Record<string, unknown>;
  Object.assign(enrollmentRepo, defaultMockEnrollmentRepo);

  setupMockUsers();
}

describe("SubmissionService", () => {
  beforeEach(() => {
    mockSubmissions = [
      makeSubmission({ _id: VALID_SUBMISSION_ID as unknown as ISubmission["_id"], status: SubmissionStatus.DRAFT }),
      makeSubmission({
        _id: "b07f1f77bcf86cd799439022" as unknown as ISubmission["_id"],
        studentId: student2 as unknown as ISubmission["studentId"],
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        isLate: false,
      }),
      makeSubmission({
        _id: "b07f1f77bcf86cd799439033" as unknown as ISubmission["_id"],
        studentId: student2 as unknown as ISubmission["studentId"],
        assignmentId: "a07f1f77bcf86cd799439033" as unknown as ISubmission["assignmentId"],
        classId: classB as unknown as ISubmission["classId"],
        status: SubmissionStatus.LATE,
        submittedAt: pastDate,
        isLate: true,
      }),
      makeSubmission({
        _id: "b07f1f77bcf86cd799439034" as unknown as ISubmission["_id"],
        studentId: student2 as unknown as ISubmission["studentId"],
        assignmentId: "a07f1f77bcf86cd799439033" as unknown as ISubmission["assignmentId"],
        classId: classB as unknown as ISubmission["classId"],
        status: SubmissionStatus.DRAFT,
        submittedAt: null,
        isLate: false,
      }),
      makeSubmission({
        _id: "b07f1f77bcf86cd799439045" as unknown as ISubmission["_id"],
        studentId: student as unknown as ISubmission["studentId"],
        assignmentId: VALID_ASSIGNMENT_ID as unknown as ISubmission["assignmentId"],
        classId: classA as unknown as ISubmission["classId"],
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        isLate: false,
      }),
      makeSubmission({ _id: "b07f1f77bcf86cd799439044" as unknown as ISubmission["_id"], status: SubmissionStatus.DRAFT, isActive: false }),
    ];
    installMockRepo();
  });

  describe("listSubmissions", () => {
    it("ADMIN can list active submissions", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20 }, adminId);
      assert.equal(result.submissions.length, 5);
      assert.equal(result.pagination.total, 5);
    });

    it("ADMIN can filter by studentId in list", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, studentId: student }, adminId);
      assert.equal(result.submissions.length, 2);
      assert.equal(result.pagination.total, 2);
    });

    it("ADMIN can filter isActive=false", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, isActive: false }, adminId);
      assert.equal(result.submissions.length, 1);
      assert.equal(result.submissions[0].isActive, false);
    });

    it("STUDENT can only see own submissions", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20 }, student);
      assert.equal(result.submissions.length, 2);
      assert.equal(result.submissions.every((s) => s.studentId === student), true);
    });

    it("PARENT can see children's submissions", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20 }, parent);
      assert.equal(result.submissions.length, 2);
      assert.equal(result.submissions.every((s) => s.studentId === student), true);
    });

    it("STUDENT cannot filter by another studentId (query param bypass)", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, studentId: student2 }, student);
      assert.equal(result.submissions.length, 2);
      assert.equal(result.submissions.every((s) => s.studentId === student), true);
    });

    it("TEACHER can list submissions for own classes", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20 }, teacher);
      assert.ok(result.submissions.length > 0);
      assert.equal(result.submissions.every((s) => s.assignmentId === VALID_ASSIGNMENT_ID), true);
    });

    it("TEACHER cannot list submissions for assignment they don't own", async () => {
      await assert.rejects(
        async () => submissionService.listSubmissions({ page: 1, limit: 20, assignmentId: "a07f1f77bcf86cd799439033" }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT isActive=false is ignored (stays active-only)", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, isActive: false }, student);
      assert.equal(result.submissions.length, 2);
      assert.equal(result.submissions.every((s) => s.isActive === true), true);
    });

    it("TEACHER querying own assignment shows scoped results", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, assignmentId: VALID_ASSIGNMENT_ID }, teacher);
      assert.equal(result.submissions.length, 3);
    });

    it("STUDENT querying published assignment gets scoped results", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, assignmentId: VALID_ASSIGNMENT_ID }, student);
      assert.equal(result.submissions.length, 2);
    });

    it("STUDENT querying non-published assignment gets 404", async () => {
      await assert.rejects(
        async () => submissionService.listSubmissions({ page: 1, limit: 20, assignmentId: "a07f1f77bcf86cd799439022" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("PARENT querying published assignment child is enrolled in gets scoped results", async () => {
      const result = await submissionService.listSubmissions({ page: 1, limit: 20, assignmentId: VALID_ASSIGNMENT_ID }, parent);
      assert.equal(result.submissions.length, 2);
    });
  });

  describe("getSubmissionById", () => {
    it("ADMIN can get any submission by ID", async () => {
      const result = await submissionService.getSubmissionById(VALID_SUBMISSION_ID, adminId);
      assert.equal(result.id, VALID_SUBMISSION_ID);
    });

    it("STUDENT can get own submission by ID", async () => {
      const result = await submissionService.getSubmissionById(VALID_SUBMISSION_ID, student);
      assert.equal(result.id, VALID_SUBMISSION_ID);
      assert.equal(result.studentId, student);
    });

    it("STUDENT cannot get another student's submission (IDOR)", async () => {
      await assert.rejects(
        async () => submissionService.getSubmissionById("b07f1f77bcf86cd799439022", student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("PARENT can get child's submission by ID", async () => {
      const result = await submissionService.getSubmissionById(VALID_SUBMISSION_ID, parent);
      assert.equal(result.studentId, student);
    });

    it("PARENT cannot get unrelated student's submission (IDOR)", async () => {
      await assert.rejects(
        async () => submissionService.getSubmissionById(VALID_SUBMISSION_ID, otherParent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("TEACHER can get submission for own assignment", async () => {
      const result = await submissionService.getSubmissionById(VALID_SUBMISSION_ID, teacher);
      assert.equal(result.id, VALID_SUBMISSION_ID);
    });

    it("TEACHER cannot get submission for another teacher's assignment (IDOR)", async () => {
      await assert.rejects(
        async () => submissionService.getSubmissionById(VALID_SUBMISSION_ID, otherTeacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("returns 404 for nonexistent submission ID", async () => {
      await assert.rejects(
        async () => submissionService.getSubmissionById("b07f1f77bcf86cd799439999", adminId),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("returns 404 for inactive (soft-deleted) submission", async () => {
      await assert.rejects(
        async () => submissionService.getSubmissionById("b07f1f77bcf86cd799439044", adminId),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });
  });

  describe("createSubmission", () => {
    function clearStudentSubmissions(): void {
      mockSubmissions = mockSubmissions.filter((s) => s.studentId?.toString() !== student || s.assignmentId?.toString() !== VALID_ASSIGNMENT_ID);
    }

    beforeEach(() => {
      clearStudentSubmissions();
      installMockRepo();
    });

    it("STUDENT can create a DRAFT submission for published assignment", async () => {
      const result = await submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, student);
      assert.equal(result.studentId, student);
      assert.equal(result.status, SubmissionStatus.DRAFT);
      assert.equal(result.submittedAt, null);
      assert.equal(result.isLate, false);
      assert.equal(result.content, null);
    });

    it("TEACHER cannot create submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot create submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("STUDENT cannot create submission for DRAFT assignment (404)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: "a07f1f77bcf86cd799439022" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot create submission for inactive assignment (404)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: "a07f1f77bcf86cd799439055" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot create submission for nonexistent assignment (404)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: "nonexistent123456789012" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("studentId is set from JWT (not from body) — mass assignment protection", async () => {
      const result = await submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, student);
      assert.equal(result.studentId, student);
    });

    it("classId is derived from assignment (not from body)", async () => {
      const result = await submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, student);
      assert.equal(result.classId, classA);
    });

    it("duplicate active submission returns 409", async () => {
      const mockSubmissionRepo = submissionRepository as unknown as Record<string, unknown>;
      mockSubmissionRepo.findByAssignmentAndStudent = async () => makeSubmission();

      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.CONFLICT,
      );
    });

    it("duplicate-key 11000 is caught and returns 409", async () => {
      const mockSubmissionRepo = submissionRepository as unknown as Record<string, unknown>;
      mockSubmissionRepo.findByAssignmentAndStudent = async () => null;
      mockSubmissionRepo.create = async () => {
        const err: Error & { code?: number } = new Error("Duplicate");
        err.code = 11000;
        throw err;
      };

      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.CONFLICT,
      );
    });

    it("STUDENT not enrolled in assignment's class gets 404 (IDOR)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: "a07f1f77bcf86cd799439033" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT with DROPPED enrollment cannot submit", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: "a07f1f77bcf86cd799439033" }, noEnrollStudent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("inactive user cannot create submission (403)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, inactiveStudent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("nonexistent user cannot create submission (401)", async () => {
      await assert.rejects(
        async () => submissionService.createSubmission({ assignmentId: VALID_ASSIGNMENT_ID }, "nonexistent123456"),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.UNAUTHORIZED,
      );
    });
  });

  describe("updateSubmission (PUT)", () => {
    it("ADMIN can update any submission content (PUT)", async () => {
      const result = await submissionService.updateSubmission(VALID_SUBMISSION_ID, { assignmentId: VALID_ASSIGNMENT_ID, content: "New answer", attachments: [] }, adminId);
      assert.equal(result.content, "New answer");
    });

    it("TEACHER cannot update submissions (403 — PUT is student-only)", async () => {
      await assert.rejects(
        async () => submissionService.updateSubmission(VALID_SUBMISSION_ID, { assignmentId: VALID_ASSIGNMENT_ID, content: "x", attachments: [] }, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("STUDENT can update own DRAFT submission content", async () => {
      const result = await submissionService.updateSubmission(VALID_SUBMISSION_ID, { assignmentId: VALID_ASSIGNMENT_ID, content: "Updated answer", attachments: [] }, student);
      assert.equal(result.content, "Updated answer");
    });

    it("STUDENT cannot update another student's submission (IDOR → 404)", async () => {
      await assert.rejects(
        async () => submissionService.updateSubmission("b07f1f77bcf86cd799439022", { assignmentId: VALID_ASSIGNMENT_ID, content: "x", attachments: [] }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot update non-DRAFT submission (403)", async () => {
      await assert.rejects(
        async () => submissionService.updateSubmission("b07f1f77bcf86cd799439022", { assignmentId: "a07f1f77bcf86cd799439033", content: "x", attachments: [] }, student2),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot update submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.updateSubmission(VALID_SUBMISSION_ID, { assignmentId: VALID_ASSIGNMENT_ID, content: "x", attachments: [] }, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });
  });

  describe("patchSubmission (PATCH)", () => {
    it("STUDENT can patch own DRAFT content", async () => {
      const result = await submissionService.patchSubmission(VALID_SUBMISSION_ID, { content: "Patched answer" }, student);
      assert.equal(result.content, "Patched answer");
    });

    it("STUDENT can transition DRAFT → SUBMITTED", async () => {
      const result = await submissionService.patchSubmission(VALID_SUBMISSION_ID, { status: SubmissionStatus.SUBMITTED }, student);
      assert.equal(result.status, SubmissionStatus.SUBMITTED);
      assert.ok(result.submittedAt !== null);
    });

    it("STUDENT transitioning to SUBMITTED on past-due assignment sets isLate=true", async () => {
      const result = await submissionService.patchSubmission("b07f1f77bcf86cd799439034", { status: SubmissionStatus.SUBMITTED }, student2);
      assert.equal(result.isLate, true);
    });

    it("STUDENT cannot transition to MISSING (403)", async () => {
      await assert.rejects(
        async () => submissionService.patchSubmission(VALID_SUBMISSION_ID, { status: SubmissionStatus.MISSING }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("STUDENT cannot PATCH another student's submission (IDOR → 404)", async () => {
      await assert.rejects(
        async () => submissionService.patchSubmission("b07f1f77bcf86cd799439022", { content: "x" }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot submit non-DRAFT submission (403 — own submitted submission)", async () => {
      await assert.rejects(
        async () => submissionService.patchSubmission("b07f1f77bcf86cd799439045", { status: SubmissionStatus.SUBMITTED }, student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("TEACHER can set status to MISSING for own assignment", async () => {
      const result = await submissionService.patchSubmission(VALID_SUBMISSION_ID, { status: SubmissionStatus.MISSING }, teacher);
      assert.equal(result.status, SubmissionStatus.MISSING);
    });

    it("TEACHER cannot patch submission for another teacher's assignment (IDOR → 404)", async () => {
      await assert.rejects(
        async () => submissionService.patchSubmission("b07f1f77bcf86cd799439022", { status: SubmissionStatus.MISSING }, otherTeacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("PARENT cannot patch submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.patchSubmission(VALID_SUBMISSION_ID, { content: "x" }, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("ADMIN can patch any submission", async () => {
      const result = await submissionService.patchSubmission(VALID_SUBMISSION_ID, { content: "Admin edit" }, adminId);
      assert.equal(result.content, "Admin edit");
    });

    it("PATCH with no changes returns current submission", async () => {
      const result = await submissionService.patchSubmission(VALID_SUBMISSION_ID, {}, student);
      assert.equal(result.id, VALID_SUBMISSION_ID);
    });
  });

  describe("deleteSubmission", () => {
    it("STUDENT can soft-delete own DRAFT submission", async () => {
      const result = await submissionService.deleteSubmission(VALID_SUBMISSION_ID, student);
      assert.equal(result.isActive, false);
    });

    it("STUDENT cannot delete another student's submission (IDOR → 404)", async () => {
      await assert.rejects(
        async () => submissionService.deleteSubmission("b07f1f77bcf86cd799439022", student),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });

    it("STUDENT cannot delete non-DRAFT submission (403)", async () => {
      await assert.rejects(
        async () => submissionService.deleteSubmission("b07f1f77bcf86cd799439022", student2),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("TEACHER cannot delete submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.deleteSubmission(VALID_SUBMISSION_ID, teacher),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("PARENT cannot delete submissions (403)", async () => {
      await assert.rejects(
        async () => submissionService.deleteSubmission(VALID_SUBMISSION_ID, parent),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.FORBIDDEN,
      );
    });

    it("ADMIN can soft-delete any submission", async () => {
      const result = await submissionService.deleteSubmission(VALID_SUBMISSION_ID, adminId);
      assert.equal(result.isActive, false);
    });

    it("soft-delete is idempotent (re-delete returns same state)", async () => {
      await submissionService.deleteSubmission("b07f1f77bcf86cd799439044", adminId);
      const result = await submissionService.deleteSubmission("b07f1f77bcf86cd799439044", adminId);
      assert.equal(result.isActive, false);
    });

    it("deleting nonexistent submission returns 404", async () => {
      await assert.rejects(
        async () => submissionService.deleteSubmission("b07f1f77bcf86cd799439999", adminId),
        (err: Error) => err instanceof AppError && err.statusCode === STATUS_CODES.NOT_FOUND,
      );
    });
  });
});
