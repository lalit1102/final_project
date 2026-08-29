import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { SubmissionStatus } from "@/types/submission.types";
import {
  submissionIdParamSchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  patchSubmissionSchema,
  submissionListSchema,
} from "@/validations/submission.validation";

const VALID_ASSIGNMENT_ID = "a07f1f77bcf86cd799439011";
const VALID_STUDENT_ID = "507f1f77bcf86cd799439044";
const VALID_CLASS_ID = "807f1f77bcf86cd799439011";
const VALID_SUBMISSION_ID = "b07f1f77bcf86cd799439011";

describe("submission.validation schemas", () => {
  describe("submissionIdParamSchema", () => {
    it("should accept a valid 24-char hex ObjectId", () => {
      const result = submissionIdParamSchema.safeParse({ id: VALID_SUBMISSION_ID });
      assert.equal(result.success, true);
    });

    it("should reject a non-ObjectId string", () => {
      const result = submissionIdParamSchema.safeParse({ id: "not-a-valid-id" });
      assert.equal(result.success, false);
    });

    it("should reject an empty string", () => {
      const result = submissionIdParamSchema.safeParse({ id: "" });
      assert.equal(result.success, false);
    });
  });

  describe("createSubmissionSchema", () => {
    it("should accept a valid submission with required fields only", () => {
      const result = createSubmissionSchema.safeParse({ assignmentId: VALID_ASSIGNMENT_ID });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.assignmentId, VALID_ASSIGNMENT_ID);
        assert.equal(result.data.content, undefined);
        assert.equal(result.data.attachments, undefined);
      }
    });

    it("should accept content and attachments when provided", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        content: "My answer text",
        attachments: ["https://example.com/file.pdf"],
      });
      assert.equal(result.success, true);
    });

    it("should reject missing assignmentId", () => {
      const result = createSubmissionSchema.safeParse({ content: "answer" });
      assert.equal(result.success, false);
    });

    it("should reject invalid assignmentId format", () => {
      const result = createSubmissionSchema.safeParse({ assignmentId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should reject studentId in body (mass assignment — server-controlled)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        studentId: VALID_STUDENT_ID,
      });
      assert.equal(result.success, false);
    });

    it("should reject classId in body (mass assignment — server-derived)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        classId: VALID_CLASS_ID,
      });
      assert.equal(result.success, false);
    });

    it("should reject submittedAt in body (mass assignment — server-controlled)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        submittedAt: "2025-01-01T00:00:00Z",
      });
      assert.equal(result.success, false);
    });

    it("should reject status in body (mass assignment — server-controlled)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        status: "SUBMITTED",
      });
      assert.equal(result.success, false);
    });

    it("should reject isLate in body (mass assignment — calculated)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        isLate: true,
      });
      assert.equal(result.success, false);
    });

    it("should reject isActive in body (mass assignment — server-controlled)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        isActive: false,
      });
      assert.equal(result.success, false);
    });

    it("should reject gradedAt in body (mass assignment — Phase 4C)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        gradedAt: "2025-01-01T00:00:00Z",
      });
      assert.equal(result.success, false);
    });

    it("should reject createdAt in body (server-controlled)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        createdAt: "2025-01-01T00:00:00Z",
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        maliciousField: "injected",
      });
      assert.equal(result.success, false);
    });

    it("should accept null content", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        content: null,
      });
      assert.equal(result.success, true);
    });

    it("should reject content exceeding 50000 characters", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        content: "x".repeat(50001),
      });
      assert.equal(result.success, false);
    });

    it("should reject more than 20 attachments", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        attachments: Array.from({ length: 21 }, (_, i) => `file${i}.pdf`),
      });
      assert.equal(result.success, false);
    });

    it("should accept empty attachments array", () => {
      const result = createSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        attachments: [],
      });
      assert.equal(result.success, true);
    });
  });

  describe("updateSubmissionSchema (PUT — strict)", () => {
    it("should accept all required fields", () => {
      const result = updateSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        attachments: [],
      });
      assert.equal(result.success, true);
    });

    it("should accept content and attachments", () => {
      const result = updateSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        content: "Updated answer",
        attachments: ["https://example.com/file.pdf"],
      });
      assert.equal(result.success, true);
    });

    it("should reject missing assignmentId (required for PUT)", () => {
      const result = updateSubmissionSchema.safeParse({ content: "answer" });
      assert.equal(result.success, false);
    });

    it("should reject studentId (server-controlled)", () => {
      const result = updateSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        studentId: VALID_STUDENT_ID,
        attachments: [],
      });
      assert.equal(result.success, false);
    });

    it("should reject status (server-controlled on PUT)", () => {
      const result = updateSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        status: "SUBMITTED",
        attachments: [],
      });
      assert.equal(result.success, false);
    });

    it("should reject unknown fields (strict)", () => {
      const result = updateSubmissionSchema.safeParse({
        assignmentId: VALID_ASSIGNMENT_ID,
        attachments: [],
        malicious: "data",
      });
      assert.equal(result.success, false);
    });
  });

  describe("patchSubmissionSchema (PATCH — strict)", () => {
    it("should accept content only", () => {
      const result = patchSubmissionSchema.safeParse({ content: "Patched" });
      assert.equal(result.success, true);
    });

    it("should accept attachments only", () => {
      const result = patchSubmissionSchema.safeParse({ attachments: ["file.pdf"] });
      assert.equal(result.success, true);
    });

    it("should accept status only", () => {
      const result = patchSubmissionSchema.safeParse({ status: SubmissionStatus.SUBMITTED });
      assert.equal(result.success, true);
    });

    it("should accept content, attachments, and status together", () => {
      const result = patchSubmissionSchema.safeParse({
        content: "Updated",
        attachments: ["file.pdf"],
        status: SubmissionStatus.SUBMITTED,
      });
      assert.equal(result.success, true);
    });

    it("should accept empty object (no-op patch)", () => {
      const result = patchSubmissionSchema.safeParse({});
      assert.equal(result.success, true);
    });

    it("should accept null content", () => {
      const result = patchSubmissionSchema.safeParse({ content: null });
      assert.equal(result.success, true);
    });

    it("should reject assignmentId (not patchable)", () => {
      const result = patchSubmissionSchema.safeParse({ assignmentId: VALID_ASSIGNMENT_ID });
      assert.equal(result.success, false);
    });

    it("should reject studentId (not patchable)", () => {
      const result = patchSubmissionSchema.safeParse({ studentId: VALID_STUDENT_ID });
      assert.equal(result.success, false);
    });

    it("should reject submittedAt (not patchable)", () => {
      const result = patchSubmissionSchema.safeParse({ submittedAt: "2025-01-01" });
      assert.equal(result.success, false);
    });

    it("should reject isLate (not patchable — calculated)", () => {
      const result = patchSubmissionSchema.safeParse({ isLate: true });
      assert.equal(result.success, false);
    });

    it("should reject isActive (not patchable)", () => {
      const result = patchSubmissionSchema.safeParse({ isActive: false });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum value", () => {
      const result = patchSubmissionSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should reject lowercase status (nativeEnum is case-sensitive)", () => {
      const result = patchSubmissionSchema.safeParse({ status: "submitted" });
      assert.equal(result.success, false);
    });

    it("should accept all valid SubmissionStatus enum values", () => {
      for (const s of Object.values(SubmissionStatus)) {
        const result = patchSubmissionSchema.safeParse({ status: s });
        assert.equal(result.success, true, `Expected success for status=${s}`);
      }
    });

    it("should reject content exceeding 50000 characters", () => {
      const result = patchSubmissionSchema.safeParse({ content: "x".repeat(50001) });
      assert.equal(result.success, false);
    });

    it("should reject more than 20 attachments", () => {
      const result = patchSubmissionSchema.safeParse({
        attachments: Array.from({ length: 21 }, (_, i) => `file${i}.pdf`),
      });
      assert.equal(result.success, false);
    });
  });

  describe("submissionListSchema", () => {
    it("should accept default pagination", () => {
      const result = submissionListSchema.safeParse({});
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.page, 1);
        assert.equal(result.data.limit, 20);
      }
    });

    it("should accept assignmentId filter", () => {
      const result = submissionListSchema.safeParse({ assignmentId: VALID_ASSIGNMENT_ID });
      assert.equal(result.success, true);
    });

    it("should accept studentId filter", () => {
      const result = submissionListSchema.safeParse({ studentId: VALID_STUDENT_ID });
      assert.equal(result.success, true);
    });

    it("should accept classId filter", () => {
      const result = submissionListSchema.safeParse({ classId: VALID_CLASS_ID });
      assert.equal(result.success, true);
    });

    it("should accept status filter", () => {
      const result = submissionListSchema.safeParse({ status: SubmissionStatus.SUBMITTED });
      assert.equal(result.success, true);
    });

    it("should accept search filter", () => {
      const result = submissionListSchema.safeParse({ search: "homework" });
      assert.equal(result.success, true);
    });

    it("should reject invalid assignmentId format", () => {
      const result = submissionListSchema.safeParse({ assignmentId: "not-valid" });
      assert.equal(result.success, false);
    });

    it("should reject invalid status enum value", () => {
      const result = submissionListSchema.safeParse({ status: "INVALID" });
      assert.equal(result.success, false);
    });

    it("should preprocess isActive string 'true' to boolean true", () => {
      const result = submissionListSchema.safeParse({ isActive: "true" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.isActive, true);
      }
    });

    it("should preprocess isActive string 'false' to boolean false", () => {
      const result = submissionListSchema.safeParse({ isActive: "false" });
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.isActive, false);
      }
    });

    it("should cap limit at 100", () => {
      const result = submissionListSchema.safeParse({ limit: 200 });
      assert.equal(result.success, false);
    });

    it("should reject page below 1", () => {
      const result = submissionListSchema.safeParse({ page: 0 });
      assert.equal(result.success, false);
    });
  });
});
