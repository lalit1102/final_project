import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { AssignmentStatus, SubmissionType } from "@/types/assignment.types";
import {
  assignmentIdParamSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  patchAssignmentSchema,
  assignmentListSchema,
} from "@/validations/assignment.validation";

const VALID_CLASS_ID = "807f1f77bcf86cd799439011";
const VALID_COURSE_ID = "707f1f77bcf86cd799439011";
const VALID_ASSIGNMENT_ID = "a07f1f77bcf86cd799439011";
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

describe("assignment.validation schemas", () => {
  describe("assignmentIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = assignmentIdParamSchema.safeParse({ id: VALID_ASSIGNMENT_ID });
      assert.equal(result.success, true);
    });

    it("should reject a non-ObjectId string", () => {
      const result = assignmentIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = assignmentIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createAssignmentSchema", () => {
    it("should accept a valid assignment with required fields", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.title, "Homework 1");
        assert.equal(result.data.classId, VALID_CLASS_ID);
        assert.equal(result.data.maxPoints, 100);
        assert.equal(result.data.status, AssignmentStatus.DRAFT);
        assert.equal(result.data.allowLateSubmissions, false);
        assert.equal(result.data.latePenaltyPercent, 0);
        assert.equal(result.data.submissionType, SubmissionType.TEXT);
        assert.deepEqual(result.data.attachments, []);
      }
    });

    it("should accept optional fields when provided", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Project",
        description: "Final project",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 50,
        status: AssignmentStatus.PUBLISHED,
        allowLateSubmissions: true,
        latePenaltyPercent: 10,
        submissionType: SubmissionType.FILE,
        attachments: ["https://example.com/file.pdf"],
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = createAssignmentSchema.safeParse({
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing classId", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing dueDate", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing maxPoints", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid classId format", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: "not-valid",
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject courseId in body (mass assignment — server-controlled)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        courseId: VALID_COURSE_ID,
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject createdBy in body (mass assignment — server-controlled)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        createdBy: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject publishedAt in body (server-controlled)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        publishedAt: "2025-01-01T00:00:00Z",
      });
      assert.equal(result.success, false);
    });

    it("should reject isActive in body (server-controlled)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        isActive: false,
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        maliciousField: "injected",
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum value", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: "INVALID",
      });
      assert.equal(result.success, false);
    });

    it("should reject lowercase status (nativeEnum is case-sensitive)", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: "draft",
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid submissionType enum", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        submissionType: "EMAIL",
      });
      assert.equal(result.success, false);
    });

    it("should reject negative maxPoints", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: -1,
      });
      assert.equal(result.success, false);
    });

    it("should reject latePenaltyPercent > 100", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        latePenaltyPercent: 101,
      });
      assert.equal(result.success, false);
    });

    it("should reject more than 20 attachments", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        attachments: Array.from({ length: 21 }, (_, i) => `file${i}.pdf`),
      });
      assert.equal(result.success, false);
    });

    it("should accept null description", () => {
      const result = createAssignmentSchema.safeParse({
        title: "Homework 1",
        description: null,
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
      });
      assert.equal(result.success, true);
    });

    it("should accept all valid SubmissionType enum values", () => {
      for (const st of Object.values(SubmissionType)) {
        const result = createAssignmentSchema.safeParse({
          title: "Homework 1",
          classId: VALID_CLASS_ID,
          dueDate: futureDate,
          maxPoints: 100,
          submissionType: st,
        });
        assert.equal(result.success, true, `Expected success for submissionType=${st}`);
      }
    });

    it("should accept all valid AssignmentStatus enum values", () => {
      for (const s of Object.values(AssignmentStatus)) {
        const result = createAssignmentSchema.safeParse({
          title: "Homework 1",
          classId: VALID_CLASS_ID,
          dueDate: futureDate,
          maxPoints: 100,
          status: s,
        });
        assert.equal(result.success, true, `Expected success for status=${s}`);
      }
    });
  });

  describe("updateAssignmentSchema (PUT)", () => {
    it("should accept all required fields", () => {
      const result = updateAssignmentSchema.safeParse({
        title: "Updated HW",
        description: "Updated desc",
        classId: VALID_CLASS_ID,
        courseId: VALID_COURSE_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: AssignmentStatus.PUBLISHED,
        allowLateSubmissions: false,
        latePenaltyPercent: 0,
        submissionType: SubmissionType.TEXT,
        attachments: [],
      });
      assert.equal(result.success, true);
    });

    it("should reject missing title", () => {
      const result = updateAssignmentSchema.safeParse({
        classId: VALID_CLASS_ID,
        courseId: VALID_COURSE_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: AssignmentStatus.DRAFT,
        allowLateSubmissions: false,
        latePenaltyPercent: 0,
        submissionType: SubmissionType.TEXT,
        attachments: [],
      });
      assert.equal(result.success, false);
    });

    it("should reject missing courseId", () => {
      const result = updateAssignmentSchema.safeParse({
        title: "Updated HW",
        classId: VALID_CLASS_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: AssignmentStatus.DRAFT,
        allowLateSubmissions: false,
        latePenaltyPercent: 0,
        submissionType: SubmissionType.TEXT,
        attachments: [],
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = updateAssignmentSchema.safeParse({
        title: "Updated HW",
        classId: VALID_CLASS_ID,
        courseId: VALID_COURSE_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: AssignmentStatus.DRAFT,
        allowLateSubmissions: false,
        latePenaltyPercent: 0,
        submissionType: SubmissionType.TEXT,
        attachments: [],
        extra: "field",
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid ObjectId for classId", () => {
      const result = updateAssignmentSchema.safeParse({
        title: "Updated HW",
        classId: "bad-id",
        courseId: VALID_COURSE_ID,
        dueDate: futureDate,
        maxPoints: 100,
        status: AssignmentStatus.DRAFT,
        allowLateSubmissions: false,
        latePenaltyPercent: 0,
        submissionType: SubmissionType.TEXT,
        attachments: [],
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchAssignmentSchema (PATCH)", () => {
    it("should accept empty object", () => {
      const result = patchAssignmentSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept partial title update", () => {
      const result = patchAssignmentSchema.safeParse({ title: "New Title" });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.title, "New Title");
    });

    it("should accept partial description update", () => {
      const result = patchAssignmentSchema.safeParse({ description: "New desc" });
      assert.equal(result.success, true);
    });

    it("should accept partial maxPoints update", () => {
      const result = patchAssignmentSchema.safeParse({ maxPoints: 75 });
      assert.equal(result.success, true);
    });

    it("should accept partial status update", () => {
      const result = patchAssignmentSchema.safeParse({ status: AssignmentStatus.PUBLISHED });
      assert.equal(result.success, true);
    });

    it("should accept partial allowLateSubmissions", () => {
      const result = patchAssignmentSchema.safeParse({ allowLateSubmissions: true });
      assert.equal(result.success, true);
    });

    it("should accept partial latePenaltyPercent", () => {
      const result = patchAssignmentSchema.safeParse({ latePenaltyPercent: 15 });
      assert.equal(result.success, true);
    });

    it("should accept partial submissionType", () => {
      const result = patchAssignmentSchema.safeParse({ submissionType: SubmissionType.FILE });
      assert.equal(result.success, true);
    });

    it("should accept partial attachments", () => {
      const result = patchAssignmentSchema.safeParse({ attachments: ["https://example.com/f.pdf"] });
      assert.equal(result.success, true);
    });

    it("should reject courseId in PATCH (server-controlled, not in patch schema)", () => {
      const result = patchAssignmentSchema.safeParse({ courseId: VALID_COURSE_ID });
      assert.equal(result.success, false);
    });

    it("should reject createdBy in PATCH", () => {
      const result = patchAssignmentSchema.safeParse({ createdBy: "507f1f77bcf86cd799439011" });
      assert.equal(result.success, false);
    });

    it("should reject publishedAt in PATCH", () => {
      const result = patchAssignmentSchema.safeParse({ publishedAt: "2025-01-01T00:00:00Z" });
      assert.equal(result.success, false);
    });

    it("should reject isActive in PATCH", () => {
      const result = patchAssignmentSchema.safeParse({ isActive: false });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = patchAssignmentSchema.safeParse({ title: "New", bogus: "data" });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum", () => {
      const result = patchAssignmentSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject invalid submissionType enum", () => {
      const result = patchAssignmentSchema.safeParse({ submissionType: "EMAIL" });
      assert.equal(result.success, false);
    });

    it("should accept valid classId in PATCH", () => {
      const result = patchAssignmentSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
    });

    it("should reject invalid classId format", () => {
      const result = patchAssignmentSchema.safeParse({ classId: "bad" });
      assert.equal(result.success, false);
    });
  });

  describe("assignmentListSchema", () => {
    it("should parse with defaults for page and limit", () => {
      const result = assignmentListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid pagination params", () => {
      const result = assignmentListSchema.safeParse({ page: "2", limit: "10" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 10);
      }
    });

    it("should reject page < 1", () => {
      const result = assignmentListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = assignmentListSchema.safeParse({ limit: "200" });
      assert.equal(result.success, false);
    });

    it("should accept valid classId filter", () => {
      const result = assignmentListSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
    });

    it("should reject invalid classId filter", () => {
      const result = assignmentListSchema.safeParse({ classId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should accept valid courseId filter", () => {
      const result = assignmentListSchema.safeParse({ courseId: VALID_COURSE_ID });
      assert.equal(result.success, true);
    });

    it("should reject invalid courseId filter", () => {
      const result = assignmentListSchema.safeParse({ courseId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should accept valid status filter", () => {
      const result = assignmentListSchema.safeParse({ status: AssignmentStatus.PUBLISHED });
      assert.equal(result.success, true);
    });

    it("should reject invalid status filter", () => {
      const result = assignmentListSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should accept valid submissionType filter", () => {
      const result = assignmentListSchema.safeParse({ submissionType: SubmissionType.FILE });
      assert.equal(result.success, true);
    });

    it("should reject invalid submissionType filter", () => {
      const result = assignmentListSchema.safeParse({ submissionType: "EMAIL" });
      assert.equal(result.success, false);
    });

    it("should accept isActive true/false strings", () => {
      const r1 = assignmentListSchema.safeParse({ isActive: "true" });
      assert.equal(r1.success, true);
      if (r1.success) assert.equal(r1.data.isActive, true);

      const r2 = assignmentListSchema.safeParse({ isActive: "false" });
      assert.equal(r2.success, true);
      if (r2.success) assert.equal(r2.data.isActive, false);
    });

    it("should accept valid search", () => {
      const result = assignmentListSchema.safeParse({ search: "homework" });
      assert.equal(result.success, true);
    });
  });
});
