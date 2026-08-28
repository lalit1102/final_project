import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { EnrollmentStatus } from "@/types/enrollment.types";
import {
  enrollmentIdParamSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  patchEnrollmentSchema,
  enrollmentListSchema,
} from "@/validations/enrollment.validation";

const VALID_STUDENT_ID = "507f1f77bcf86cd799439011";
const VALID_CLASS_ID = "807f1f77bcf86cd799439011";
const VALID_COURSE_ID = "707f1f77bcf86cd799439011";

describe("enrollment.validation schemas", () => {
  describe("enrollmentIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = enrollmentIdParamSchema.safeParse({ id: VALID_STUDENT_ID });
      assert.equal(result.success, true);
    });

    it("should reject a non-ObjectId string", () => {
      const result = enrollmentIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = enrollmentIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createEnrollmentSchema", () => {
    it("should accept a valid enrollment with required fields", () => {
      const result = createEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID, classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.studentId, VALID_STUDENT_ID);
        assert.equal(result.data.classId, VALID_CLASS_ID);
        assert.equal(result.data.status, EnrollmentStatus.ACTIVE);
      }
    });

    it("should accept an optional status field", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: EnrollmentStatus.DROPPED,
      });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.status, EnrollmentStatus.DROPPED);
    });

    it("should default status to ACTIVE when omitted", () => {
      const result = createEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID, classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.status, EnrollmentStatus.ACTIVE);
    });

    it("should reject missing studentId", () => {
      const result = createEnrollmentSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, false);
    });

    it("should reject missing classId", () => {
      const result = createEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID });
      assert.equal(result.success, false);
    });

    it("should reject invalid studentId format", () => {
      const result = createEnrollmentSchema.safeParse({ studentId: "not-valid", classId: VALID_CLASS_ID });
      assert.equal(result.success, false);
    });

    it("should reject invalid classId format", () => {
      const result = createEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID, classId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should reject courseId in body (mass assignment)", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        courseId: VALID_COURSE_ID,
      });
      assert.equal(result.success, false);
    });

    it("should reject enrolledAt in body (server-controlled)", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        enrolledAt: "2025-01-01T00:00:00Z",
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        maliciousField: "injected",
      });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum value", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: "INVALID",
      });
      assert.equal(result.success, false);
    });

    it("should reject lowercase status (nativeEnum is case-sensitive)", () => {
      const result = createEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: "active",
      });
      assert.equal(result.success, false);
    });
  });

  describe("updateEnrollmentSchema (PUT)", () => {
    it("should accept all required fields", () => {
      const result = updateEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: EnrollmentStatus.COMPLETED,
      });
      assert.equal(result.success, true);
    });

    it("should reject missing studentId", () => {
      const result = updateEnrollmentSchema.safeParse({ classId: VALID_CLASS_ID, status: EnrollmentStatus.ACTIVE });
      assert.equal(result.success, false);
    });

    it("should reject missing classId", () => {
      const result = updateEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID, status: EnrollmentStatus.ACTIVE });
      assert.equal(result.success, false);
    });

    it("should reject missing status", () => {
      const result = updateEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID, classId: VALID_CLASS_ID });
      assert.equal(result.success, false);
    });

    it("should reject courseId in body (server-controlled)", () => {
      const result = updateEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: EnrollmentStatus.ACTIVE,
        courseId: VALID_COURSE_ID,
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (mass assignment)", () => {
      const result = updateEnrollmentSchema.safeParse({
        studentId: VALID_STUDENT_ID,
        classId: VALID_CLASS_ID,
        status: EnrollmentStatus.ACTIVE,
        extra: "field",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchEnrollmentSchema (PATCH)", () => {
    it("should accept partial status update", () => {
      const result = patchEnrollmentSchema.safeParse({ status: EnrollmentStatus.DROPPED });
      assert.equal(result.success, true);
      if (result.success) assert.equal(result.data.status, EnrollmentStatus.DROPPED);
    });

    it("should accept empty object", () => {
      const result = patchEnrollmentSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should reject studentId in PATCH (not in patch schema)", () => {
      const result = patchEnrollmentSchema.safeParse({ studentId: VALID_STUDENT_ID });
      assert.equal(result.success, false);
    });

    it("should reject classId in PATCH (not in patch schema)", () => {
      const result = patchEnrollmentSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, false);
    });

    it("should reject courseId in PATCH", () => {
      const result = patchEnrollmentSchema.safeParse({ courseId: VALID_COURSE_ID });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields", () => {
      const result = patchEnrollmentSchema.safeParse({ status: EnrollmentStatus.ACTIVE, extra: "field" });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum", () => {
      const result = patchEnrollmentSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });
  });

  describe("enrollmentListSchema", () => {
    it("should parse with defaults for page and limit", () => {
      const result = enrollmentListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept valid pagination params", () => {
      const result = enrollmentListSchema.safeParse({ page: "2", limit: "10" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 2);
        assert.equal(result.data.limit, 10);
      }
    });

    it("should reject page < 1", () => {
      const result = enrollmentListSchema.safeParse({ page: "0" });
      assert.equal(result.success, false);
    });

    it("should reject limit > 100", () => {
      const result = enrollmentListSchema.safeParse({ limit: "200" });
      assert.equal(result.success, false);
    });

    it("should accept valid studentId filter", () => {
      const result = enrollmentListSchema.safeParse({ studentId: VALID_STUDENT_ID });
      assert.equal(result.success, true);
    });

    it("should accept valid classId filter", () => {
      const result = enrollmentListSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
    });

    it("should accept valid courseId filter", () => {
      const result = enrollmentListSchema.safeParse({ courseId: VALID_COURSE_ID });
      assert.equal(result.success, true);
    });

    it("should reject invalid courseId filter", () => {
      const result = enrollmentListSchema.safeParse({ courseId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should reject invalid studentId filter", () => {
      const result = enrollmentListSchema.safeParse({ studentId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should accept valid status filter", () => {
      const result = enrollmentListSchema.safeParse({ status: EnrollmentStatus.ACTIVE });
      assert.equal(result.success, true);
    });

    it("should reject invalid status filter", () => {
      const result = enrollmentListSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should accept isActive true/false strings", () => {
      const r1 = enrollmentListSchema.safeParse({ isActive: "true" });
      assert.equal(r1.success, true);
      if (r1.success) assert.equal(r1.data.isActive, true);

      const r2 = enrollmentListSchema.safeParse({ isActive: "false" });
      assert.equal(r2.success, true);
      if (r2.success) assert.equal(r2.data.isActive, false);
    });
  });
});
