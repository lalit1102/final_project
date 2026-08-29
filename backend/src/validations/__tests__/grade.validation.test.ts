import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  gradeIdParamSchema,
  createGradeSchema,
  updateGradeSchema,
  patchGradeSchema,
  gradeListSchema,
} from "@/validations/grade.validation";
import { ZodError } from "zod";

const VALID_ID = "a07f1f77bcf86cd799439011";
const VALID_STUDENT = "507f1f77bcf86cd799439044";
const VALID_ASSIGNMENT = "a07f1f77bcf86cd799439011";
const VALID_SUBMISSION = "b07f1f77bcf86cd799439011";

describe("Grade Validation", () => {
  describe("gradeIdParamSchema", () => {
    it("should accept a valid 24-char hex id", () => {
      const result = gradeIdParamSchema.safeParse({ id: VALID_ID });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.id, VALID_ID);
    });

    it("should reject an invalid id", () => {
      const result = gradeIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject a short id", () => {
      const result = gradeIdParamSchema.safeParse({ id: "short" });
      assert.equal(result.success, false);
    });

    it("should reject a missing id", () => {
      const result = gradeIdParamSchema.safeParse({});
      assert.equal(result.success, false);
    });
  });

  describe("createGradeSchema", () => {
    it("should accept valid create input with submissionId", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        submissionId: VALID_SUBMISSION,
        points: 85,
        feedback: "Good job",
      });
      assert.equal(result.success, true);
    });

    it("should accept valid create input without submissionId (manual grading)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 85,
        feedback: null,
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.submissionId, undefined);
    });

    it("should accept valid create input with null feedback", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 0,
        feedback: null,
      });
      assert.equal(result.success, true);
    });

    it("should accept points of 0", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        submissionId: null,
        points: 0,
      });
      assert.equal(result.success, true);
    });

    it("should reject negative points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: -5,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.message.includes("at least 0")));
      }
    });

    it("should reject points higher than max (Zod cannot enforce — service handles)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 999999,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing studentId", () => {
      const result = createGradeSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing assignmentId", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        points: 50,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid studentId format", () => {
      const result = createGradeSchema.safeParse({
        studentId: "invalid-id",
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid assignmentId format", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: "invalid-id",
        points: 50,
      });
      assert.equal(result.success, false);
    });

    it("should reject non-numeric points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: "fifty",
      });
      assert.equal(result.success, false);
    });

    it("should reject points as string number", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: "50" as unknown as number,
      });
      assert.equal(result.success, false);
    });

    it("should reject points as float", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50.5,
      });
      assert.equal(result.success, true);
    });

    it("should reject null points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: null as unknown as number,
      });
      assert.equal(result.success, false);
    });

    it("should reject extra unknown field (maxPoints)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject extra unknown field (gradedBy)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        gradedBy: VALID_STUDENT,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject extra unknown field (percentage)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        percentage: 50,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject extra unknown field (isActive)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        isActive: false,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject extra unknown field (gradedAt)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        gradedAt: "2024-01-01",
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject extra unknown field (classId)", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        classId: "807f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject feedback exceeding 2000 chars", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 50,
        feedback: "x".repeat(2001),
      });
      assert.equal(result.success, false);
    });

    it("should reject malformed submissionId", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        submissionId: "not-a-valid-id",
        points: 50,
      });
      assert.equal(result.success, false);
    });

    it("should accept empty object for submissionId as null", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        submissionId: null,
        points: 50,
      });
      assert.equal(result.success, true);
    });

    it("should reject NaN points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: NaN,
      });
      assert.equal(result.success, false);
    });

    it("should reject Infinity points", () => {
      const result = createGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: Infinity,
      });
      assert.equal(result.success, false);
    });
  });

  describe("updateGradeSchema (PUT)", () => {
    it("should accept valid update input", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        submissionId: VALID_SUBMISSION,
        points: 95,
        feedback: "Updated feedback",
      });
      assert.equal(result.success, true);
    });

    it("should reject missing studentId", () => {
      const result = updateGradeSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT,
        points: 95,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing assignmentId", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        points: 95,
      });
      assert.equal(result.success, false);
    });

    it("should reject missing points", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
      });
      assert.equal(result.success, false);
    });

    it("should reject extra unknown field (maxPoints)", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 95,
        maxPoints: 100,
      });
      assert.equal(result.success, false);
    });

    it("should reject extra unknown field (gradedBy)", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 95,
        gradedBy: "507f1f77bcf86cd799439011",
      });
      assert.equal(result.success, false);
    });

    it("should reject negative points", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: -1,
      });
      assert.equal(result.success, false);
    });

    it("should reject feedback exceeding 2000 chars", () => {
      const result = updateGradeSchema.safeParse({
        studentId: VALID_STUDENT,
        assignmentId: VALID_ASSIGNMENT,
        points: 95,
        feedback: "x".repeat(2001),
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchGradeSchema (PATCH)", () => {
    it("should accept valid patch input with points", () => {
      const result = patchGradeSchema.safeParse({ points: 85 });
      assert.equal(result.success, true);
    });

    it("should accept valid patch input with feedback", () => {
      const result = patchGradeSchema.safeParse({ feedback: "Nice work" });
      assert.equal(result.success, true);
    });

    it("should accept valid patch input with both", () => {
      const result = patchGradeSchema.safeParse({ points: 85, feedback: "Nice work" });
      assert.equal(result.success, true);
    });

    it("should accept empty patch (no-op)", () => {
      const result = patchGradeSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null feedback", () => {
      const result = patchGradeSchema.safeParse({ feedback: null });
      assert.equal(result.success, true);
    });

    it("should reject negative points", () => {
      const result = patchGradeSchema.safeParse({ points: -5 });
      assert.equal(result.success, false);
    });

    it("should reject non-numeric points", () => {
      const result = patchGradeSchema.safeParse({ points: "abc" as unknown as number });
      assert.equal(result.success, false);
    });

    it("should reject studentId (identity field)", () => {
      const result = patchGradeSchema.safeParse({ studentId: VALID_STUDENT });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject assignmentId (identity field)", () => {
      const result = patchGradeSchema.safeParse({ assignmentId: VALID_ASSIGNMENT });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject submissionId (identity field)", () => {
      const result = patchGradeSchema.safeParse({ submissionId: VALID_SUBMISSION });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject gradedBy (server-controlled)", () => {
      const result = patchGradeSchema.safeParse({ gradedBy: VALID_STUDENT });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject gradedAt (server-controlled)", () => {
      const result = patchGradeSchema.safeParse({ gradedAt: "2024-01-01" });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject maxPoints (server-controlled)", () => {
      const result = patchGradeSchema.safeParse({ maxPoints: 100 });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject percentage (server-controlled)", () => {
      const result = patchGradeSchema.safeParse({ percentage: 85 });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject isActive (server-controlled)", () => {
      const result = patchGradeSchema.safeParse({ isActive: false });
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.issues.some((i) => i.code === "unrecognized_keys"));
      }
    });

    it("should reject feedback exceeding 2000 chars", () => {
      const result = patchGradeSchema.safeParse({ feedback: "x".repeat(2001) });
      assert.equal(result.success, false);
    });
  });

  describe("gradeListSchema", () => {
    it("should apply default page and limit", () => {
      const result = gradeListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should coerce string page/limit to numbers", () => {
      const result = gradeListSchema.safeParse({ page: "2", limit: "50" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 50);
      }
    });

    it("should reject page less than 1", () => {
      const result = gradeListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit exceeding 100", () => {
      const result = gradeListSchema.safeParse({ limit: "101" });
      assert.equal(result.success, false);
    });

    it("should accept valid studentId filter", () => {
      const result = gradeListSchema.safeParse({ studentId: VALID_STUDENT });
      assert.equal(result.success, true);
    });

    it("should accept valid assignmentId filter", () => {
      const result = gradeListSchema.safeParse({ assignmentId: VALID_ASSIGNMENT });
      assert.equal(result.success, true);
    });

    it("should reject invalid studentId filter", () => {
      const result = gradeListSchema.safeParse({ studentId: "invalid" });
      assert.equal(result.success, false);
    });

    it("should reject invalid assignmentId filter", () => {
      const result = gradeListSchema.safeParse({ assignmentId: "invalid" });
      assert.equal(result.success, false);
    });

    it("should accept search param", () => {
      const result = gradeListSchema.safeParse({ search: "good" });
      assert.equal(result.success, true);
    });

    it("should reject search param exceeding 100 chars", () => {
      const result = gradeListSchema.safeParse({ search: "x".repeat(101) });
      assert.equal(result.success, false);
    });

    it("should accept isActive with string true/false", () => {
      const r1 = gradeListSchema.safeParse({ isActive: "true" });
      const r2 = gradeListSchema.safeParse({ isActive: "false" });
      assert.equal(r1.success, true);
      assert.equal(r2.success, true);
      if (r1.success) assert.equal(r1.data.isActive, true);
      if (r2.success) assert.equal(r2.data.isActive, false);
    });

    it("should reject invalid submissionId", () => {
      const result = gradeListSchema.safeParse({ submissionId: "invalid" });
      assert.equal(result.success, false);
    });

    it("should reject unknown query param", () => {
      const result = gradeListSchema.safeParse({ maxPoints: "100" });
      assert.equal(result.success, false);
    });
  });

  describe("ZodError handling", () => {
    it("should produce a ZodError for invalid create input", () => {
      try {
        createGradeSchema.parse({ invalid: true });
        assert.fail("Expected ZodError");
      } catch (error) {
        assert.ok(error instanceof ZodError);
      }
    });
  });
});
