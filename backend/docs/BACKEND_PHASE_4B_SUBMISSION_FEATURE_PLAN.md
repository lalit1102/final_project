# LearnSphere Backend — Phase 4B Submission Feature Plan

## Planning-Only Document

**Status:** PLANNING ONLY — No production code, tests, or configuration files were modified.
**Branch:** `feature/backend-feature-planning`
**Audit date:** 2026-08-28
**Base commit:** `0595df2` — `feat(backend): implement Phase 4A - Assignment domain`
**Document type:** Implementation-ready plan (no code generated)

---

## 1. Current Repository State

| Check | Value |
|-------|-------|
| Git branch | `feature/backend-feature-planning` |
| HEAD commit | `0595df2` — `feat(backend): implement Phase 4A - Assignment domain` |
| Working tree | CLEAN (no uncommitted changes) |
| Test baseline | 614 pass, 0 fail, 0 skipped, 117 suites |
| TypeScript | `tsc --noEmit` → 0 errors (strict mode) |
| ESLint | ESLint 9 via `eslint.config.mjs` (flat config), 0 errors |
| Build | `next build` compiled successfully |
| Test runner | `node:test` via `npx tsx --test` (env: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) |
| Runtime | Next.js 16.2.11 App Router, Node.js, MongoDB/Mongoose 9.8.0 |

### Test count verification

```
$ npx tsx --test
ℹ suites 117
ℹ pass 614
ℹ fail 0
ℹ skipped 0
```

### Key infrastructure files (actual)

| Component | File | Notes |
|-----------|------|-------|
| Route wrapper | `src/utils/apiHandler.ts` | `apiHandler(handler)` wraps: `connectDB → rateLimit → handler → catch(500)` |
| Response helper | `src/utils/apiResponse.ts` | `sendResponse(data, message, errors)` → `{ success, message, data, errors, timestamp }` |
| Error class | `src/utils/AppError.ts` | `AppError(message, statusCode, errors[], isOperational)` + `handleMongoError(error)` |
| Status codes | `src/constants/statusCodes.ts` | `OK=200, CREATED=201, NO_CONTENT=204, BAD_REQUEST=400, UNAUTHIZED=401, FORBIDDEN=403, NOT_FOUND=404, CONFLICT=409, UNPROCESSABLE_ENTITY=422, TOO_MANY_REQUESTS=429, INTERNAL_SERVER_ERROR=500` |
| Error messages | `src/constants/errorMessages.ts` | `ASSIGNMENT_NOT_FOUND`, `ASSIGNMENT_EXISTS`, `INVALID_DUE_DATE` (added Phase 4A) — `SUBMISSION_NOT_FOUND`, `SUBMISSION_EXISTS` must be added |
| ObjectId schema | `src/validations/objectId.ts` | `objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/)`, `paginationSchema`, `searchSchema` |
| Rate limiter | `src/utils/rateLimiter.ts` | `rate-limiter-flexcible`, 100 req/60s/IP (Redis in prod, Memory in dev) |
| Logger | `src/utils/logger.ts` | Winston, JSON + console format |
| CSRF (edge-safe) | `src/lib/csrf.ts` | `validateCsrf(req)`, `setCsrfCookie`, `CSRF_COOKIE_NAME="csrfToken"`, `CSRF_HEADER_NAME="x-csrf-token"`, `safeCompareTokenEdge()` |
| CSRF (server) | `src/lib/csrf.server.ts` | `generateCsrfToken()`, `safeCompareToken()` (Node crypto) |
| JWT (server) | `src/lib/jwt.ts` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` — payload: `{ userId, role, type }` |
| JWT (edge) | `src/lib/edgeJwt.ts` | `verifyEdgeAccessToken(token)` via `jose` — same payload shape |
| DB connection | `src/lib/db.ts` | Mongoose cached singleton |
| Auth types | `src/types/auth.types.ts` | `JwtPayload { userId: string; role: string; type: 'access' \| 'refresh' \| 'reset' }` |
| User roles | `src/types/user.types.ts` | `UserRole { ADMIN, TEACHER, STUDENT, PARENT }` |
| Auth providers | `src/types/user.types.ts` | `AuthProvider { LOCAL, GOOGLE }` |

---

## 2. Phase 4A Dependency Summary (Verified)

Phase 4A Assignment is fully implemented and committed at `0595df2`. The following components exist and are production-ready:

### Files created for Assignment

| File | Purpose |
|------|---------|
| `src/types/assignment.types.ts` | `IAssignment` interface (14 fields), `AssignmentStatus` enum (DRAFT, PUBLISHED, ARCHIVED), `SubmissionType` enum (FILE, TEXT, LINK, NONE) |
| `src/models/assignment.model.ts` | Mongoose schema — compound index `{ classId: 1, courseId: 1 }`, `{ createdBy: 1 }`, `{ classId: 1, dueDate: -1 }`, `{ status: 1 }`, plus field-level indexes on `classId`, `courseId`, `dueDate`, `createdBy`, `publishedAt`, `isActive` |
| `src/validations/assignment.validation.ts` | `createAssignmentSchema` (strict), `updateAssignmentSchema` (PUT strict), `patchAssignmentSchema` (PATCH strict), `assignmentListSchema`, `assignmentIdParamSchema` — all use `.strict()`, `z.nativeEnum()`, `z.string().datetime()` for dates |
| `src/repositories/assignment.repository.ts` | `create`, `findById`, `update`, `softDelete`, `exists`, `totalCount`, `findAllPaginated`, `findByClass`, `findByTeacher` |
| `src/services/assignment.service.ts` | `AssignmentService` with `verifyAuthorized`, `verifyClass`, `verifyTeacherOwnsClass`, `isStudentEnrolledInClass`, `isChildEnrolledInClass`, `getAssignmentForUpdate`, `getAssignmentForDelete`; `listAssignments`, `getAssignmentById`, `createAssignment`, `updateAssignment`, `patchAssignment`, `deleteAssignment` |
| `src/controllers/assignment.controller.ts` | CRUD controller with `handleError` (ZodError→400, duplicate-key interception, AppError→statusCode, fallback→500) |
| `src/app/api/assignments/route.ts` | `GET` / `POST` via `apiHandler` |
| `src/app/api/assignments/[id]/route.ts` | `GET` / `PUT` / `PATCH` / `DELETE` via `apiHandler` with `assignmentIdParamSchema` |
| `src/services/__tests__/assignment.service.test.ts` | 49 service tests |
| `src/validations/__tests__/assignment.validation.test.ts` | 39 validation tests |
| `src/__tests__/phase4a.middleware.security.test.ts` | 26 middleware security tests |

### Phase 4A key patterns (actual, not doc-assumed)

1. **`courseId` derivation**: Never accepted in `createAssignmentSchema` body. Derived in service via `cls.courseId.toString()` lookup from `Class` repository. (The planning doc's `updateAssignmentSchema` includes `courseId` in the body — this is a **contradiction** with the actual service which derives it.)
2. **`createdBy`**: Server-controlled — set from `currentUserId` (JWT `x-user-id` header), never from request body.
3. **`publishedAt`**: Server-controlled — set to `new Date()` when `status` transitions to `PUBLISHED`, null otherwise.
4. **Duplicate-key handling**: Service intercepts MongoDB `code === 11000` before calling `handleMongoError`, returns `ASSIGNMENT_EXISTS` at 409.
5. **RBAC**: `verifyAuthorized` allows all 4 roles. STUDENT/PARENT filtered to `PUBLISHED` only. TEACHER scoped to own classes. ADMIN sees all.
6. **IDOR**: Returns 404 (not 403) for cross-tenant access.
7. **Soft-delete**: `getAssignmentForDelete` does NOT check `isActive` (allows idempotent re-delete); `getAssignmentForUpdate` DOES check `isActive`.
8. **Middleware**: `/api/assignments` added to `protectedRoutes`. CSRF enforced on POST/PUT/PATCH/DELETE, exempt on GET.

### Discrepancies in planning doc (actual code wins)

| Section | Planning doc claims | Actual code | Resolution |
|---------|-------------------|-------------|------------|
| Test baseline | "470 tests" | 614 tests (117 suites) | Doc was written when Phase 3 was at 470; Phase 4A added 114 |
| Assignment `updateAssignmentSchema` | Includes `courseId` in body | `courseId` is NOT in the actual schema; it's derived | Update plan must NOT accept `courseId` in PUT body |
| Submission model `courseId` | Planning doc lists `courseId` as field | N/A (Submission not yet implemented) | Submission should store `classId` (derived) but `courseId` is NOT needed — Assignment already has `classId` and `courseId` |
| Assignment partial unique index | Not applicable (no unique constraint on title+class) | No `{ title, classId }` unique index exists; 11000 interception is defensive | Document that the 409 handler is defensive; no actual unique index constrains duplicate titles |
| `handleMongoError` | Returns `USER_EXISTS` for all 11000 errors | Confirmed — but services intercept 11000 before calling it | Submission service must intercept 11000 before `handleMongoError` |

---

## 3. Submission Scope

### In Scope

- Submission type definitions (`ISubmission` interface, `SubmissionStatus` enum)
- Submission Mongoose model with indexes
- Submission repository (CRUD + query methods)
- Submission Zod validation schemas (strict)
- Submission service (RBAC, enrollment verification, server-controlled fields, duplicate handling)
- Submission controller (CRUD with `handleError`)
- Submission API routes (`GET`, `POST`, `GET/:id`, `PUT`, `PATCH`, `DELETE`)
- Middleware integration (`/api/submissions` in `protectedRoutes`)
- New error messages (`SUBMISSION_NOT_FOUND`, `SUBMISSION_EXISTS`)
- Test files (service, validation, middleware security)

### Out of Scope (Explicitly Deferred)

- Grade domain (Phase 4C)
- Exam domain
- Quiz domain
- Question domain
- Attendance domain
- Result domain
- Timetable domain
- Announcement domain
- Notification domain (LMS)
- Analytics
- File upload/storage infrastructure
- Settings domain
- Microservices
- Event buses / queues
- GraphQL
- WebSockets / real-time
- Jest (using `node:test` only)
- `mongodb-memory-server` (tests use mocks only)
- Permissions-based authorization (role-based only)
- Multi-device refresh-token redesign
- Frontend implementation

---

## 4. Relationship Graph (Actual)

Verified from actual source code:

```
User (role: STUDENT)
    studentId (String, unique sparse)
    parentIds ([ObjectId → User PARENT])
    ↓
Enrollment (studentId → User, classId → Class, courseId → Course)
    ↓
Class (classId → courseId → Course, teacherId → User TEACHER)
    ↓
Course (courseId → subjectId → Subject, teacherId → User TEACHER)
    ↓
Subject (teacherId → User TEACHER)

Assignment (classId → Class, courseId → Course, createdBy → User TEACHER)
    ↓
Class (same Class chain as above)

Submission
    assignmentId → Assignment
        ↓
    Class (via Assignment.classId)
        ↓
    Course (via Assignment.courseId)
        ↓
    Student (via Enrollment.studentId, verified at submission time)
        ↓
    Enrollment (studentId, classId, courseId) — verified but NOT stored on Submission
```

### Key relationships verified

| Relationship | Source field | Target | Verified in |
|---|---|---|---|
| Student ↔ Class | `Enrollment.studentId` → `User._id` | `Enrollment.classId` → `Class._id` | `enrollment.service.ts:101` (`findByStudentAndClass`) |
| Student ↔ Parent | `User.parentIds` → `[User._id]` | `User` where `role=STUDENT` | `user.model.ts:100`, `user.repository.ts:22-28` (`findStudentsByParentId`) |
| Class → Course | `Class.courseId` → `Course._id` | — stored, not derived | `class.types.ts:7`, `class.model.ts:30-34` |
| Assignment → Class | `Assignment.classId` → `Class._id` | — stored | `assignment.types.ts:19`, `assignment.service.ts:283` (`verifyTeacherOwnsClass`) |
| Assignment → Course | `Assignment.courseId` → `Course._id` | derived from `Class.courseId` in service | `assignment.service.ts:284` (`cls.courseId.toString()`) |
| Assignment → Teacher | `Assignment.createdBy` → `User._id` | from JWT, server-controlled | `assignment.service.ts:303` (`createdBy: requestorId`) |
| Teacher owns Class | `Class.teacherId` → `User._id` | — stored | `class.types.ts:8` |
| Teacher owns Course | `Course.teacherId` → `User._id` | — stored | `course.types.ts:8` |
| Teacher owns Subject | `Subject.teacherId` → `User._id` | — stored | `subject.types.ts:6` |

### Student identity fields (verified)

| Field | Location | Type | Purpose |
|-------|----------|------|---------|
| `User._id` | `user.model.ts` | ObjectId | Primary key, used as `studentId` in Submission |
| `User.studentId` | `user.model.ts:93-98` | String (unique, sparse) | Student ID number/code — NOT used as foreign key |
| `User.parentIds` | `user.model.ts:100-103` | `[ObjectId → User]` | Links Student → Parent |
| `User.role` | `user.model.ts:46-50` | enum | `STUDENT`, `PARENT`, `TEACHER`, `ADMIN` |
| `User.isActive` | `user.model.ts:57-60` | Boolean (default true, index) | Account active flag |

### Resolved dependency questions

| Question | Answer | Evidence |
|---|---|---|
| Submission needs direct `studentId`? | YES | Submission is created by the student; `studentId` must be stored to scope reads (own submissions) and enable teacher/parent views |
| Submission needs `enrollmentId`? | NO | Submission stores `studentId` and `assignmentId`; enrollment is verified at creation time (student must be enrolled in the assignment's class). Storing `enrollmentId` creates a coupling: if enrollment is soft-deleted, what happens to submissions? The Enrollment domain model does not have a reverse reference. |
| Submission needs `assignmentId`? | YES | Required to link submission to assignment, due date, submission type |
| `courseId` should be stored? | NO | Derive from `Assignment.courseId` (already stored on Assignment). No need to duplicate. |
| `classId` should be stored? | YES | Derive from `Assignment.classId` in service but store on Submission model for query efficiency (same pattern as Enrollment storing `classId` and `courseId`). Enables teacher-scoped queries: "all submissions for assignments in class X" without joining Assignment. |
| `teacherId`/`createdBy` required? | NO for Submission | Submission is student-created. Teacher access is derived via `Assignment.classId → Class.teacherId`. No `createdBy`/`teacherId` field needed on Submission. |
| `submittedAt` server-controlled? | YES | Must be set by service to `new Date()`. For DRAFT submissions, `submittedAt` is null (not yet submitted). For SUBMITTED status, `submittedAt` is set to submission time. |

---

## 5. Data Model: Submission

### Field inventory

| Field | Type | Client-supplied? | Server-derived? | Server-controlled? | Notes |
|-------|------|-------------------|--------------------|----------------------|-------|
| `_id` | ObjectId | No | Auto | Yes | Mongoose auto |
| `assignmentId` | ObjectId → Assignment | YES | — | — | Client supplies (must verify enrollment + assignment exists) |
| `studentId` | ObjectId → User (STUDENT) | NO | — | YES (from JWT) | **Server-controlled** — never from body |
| `classId` | ObjectId → Class | NO | YES (from Assignment.classId) | Yes | Derived at creation time, stored for query efficiency |
| `content` | String (max 50000) | YES (if TEXT type) | — | — | Nullable |
| `attachments` | `[String]` | YES | — | — | Default `[]` — URLs only (no upload infra) |
| `submittedAt` | Date | NO | — | YES | `new Date()` when status → SUBMITTED; null when DRAFT |
| `status` | String (enum) | Partial (PATCH only) | YES | Yes | Default DRAFT; SUBMITTED on first submit; LATE if past due; MISSING auto-assigned by teacher/cron |
| `isLate` | Boolean | NO | — | YES | Calculated: `submittedAt > assignment.dueDate` |
| `gradedAt` | Date | NO | — | YES | Only set by Grade domain (Phase 4C); null for Phase 4B |
| `isActive` | Boolean | NO | — | YES | Default true (soft-delete flag) |
| `createdAt` | Date | No | Auto | Yes | Mongoose timestamps |
| `updatedAt` | Date | No | Auto | Yes | Mongoose timestamps |

### SubmissionStatus enum

| Value | Meaning | Server transitions |
|-------|---------|-------------------|
| `DRAFT` | Student started but hasn't submitted | Default on create; → SUBMITTED on submit |
| `SUBMITTED` | Student formally submitted | Set by service when student submits |
| `LATE` | Submitted past due date | Set by service if `submittedAt > dueDate` |
| `MISSING` | Assignment past due, no submission | Set by teacher or system (deferred to Phase 4C or cron) — out of scope for Phase 4B |

**Note:** `MISSING` is included in the enum for forward compatibility with Grading, but Phase 4B will not auto-generate MISSING submissions. It may be set manually by a teacher in a future phase.

### Duplicate/resubmission strategy: **Option A — Single active submission per student per assignment**

**Decision:** One active Submission record per `assignmentId + studentId`. Re-submission updates the same record.

**Rationale:**
- Aligns with Enrollment's partial unique index pattern: `{ studentId: 1, classId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }`
- Simplifies grading: one grade per submission
- Submission history (draft edits before submit) is tracked via `updatedAt` timestamps, not separate records
- Soft-deleted submissions (for a withdrawn/resubmit scenario) create a new active record via the partial unique constraint

**Soft-delete + resubmit behavior:**
- If a student's active submission is soft-deleted (deactivated), they can create a new active submission (partial unique only applies to `isActive: true`)
- This mirrors Enrollment's re-enrollment-after-drop behavior

**Submission history:** OUT OF SCOPE for Phase 4B. Document explicitly. If submission history is needed later, the model can be extended or a separate `submission_history` collection introduced.

---

## 6. Type Definitions (Planned)

### `src/types/submission.types.ts`

```typescript
import { Document, Types } from "mongoose";

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  LATE = "LATE",
  MISSING = "MISSING",
}

export interface ISubmission extends Document {
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  content: string | null;
  attachments: string[];
  submittedAt: Date | null;
  status: SubmissionStatus;
  isLate: boolean;
  gradedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Validation Design (Planned)

All schemas use `.strict()` — unknown fields rejected with ZodError.

### Schemas to create in `src/validations/submission.validation.ts`

#### `submissionIdParamSchema`
```typescript
z.object({ id: objectIdSchema })
```

#### `createSubmissionSchema` (POST — strict)
| Field | Schema | Notes |
|-------|--------|-------|
| `assignmentId` | `objectIdSchema` (required) | Client supplies; verified in service |
| No other fields | — | `studentId`, `classId`, `submittedAt`, `status`, `isLate`, `gradedAt`, `isActive`, `createdAt`, `updatedAt` are ALL rejected by `.strict()` |

The create schema is intentionally minimal. The student supplies only `assignmentId` (for TEXT/LINK) or `assignmentId` + `content` (for TEXT submissions). `assignmentId` alone is valid for DRAFT creation.

**Mass-assignment rejection list** (all rejected by `.strict()`):
- `studentId` ← server from JWT
- `classId` ← derived from Assignment.classId
- `submittedAt` ← server on SUBMITTED transition
- `status` ← server-controlled (DRAFT on create)
- `isLate` ← server-calculated
- `gradedAt` ← Phase 4C
- `isActive` ← server default true
- `attachments` ← accepted (URL strings only, max 20)
- `content` ← accepted (max 50000 chars, nullable)

#### `updateSubmissionSchema` (PUT — strict)
Same fields as create: `assignmentId` (required), `content` (optional), `attachments` (optional). PUT replaces the entire submission content. `assignmentId` cannot be changed via PUT (would create a different resource). **Rejected:** `studentId`, `classId`, `submittedAt`, `status`, `isLate`, etc.

#### `patchSubmissionSchema` (PATCH — strict)
| Field | Schema | Notes |
|-------|--------|-------|
| `content` | `z.string().trim().max(50000).nullable().optional()` | Optional |
| `attachments` | `z.array(z.string()).max(20).optional()` | Optional |
| `status` | `z.nativeEnum(SubmissionStatus).optional()` | Only DRAFT → SUBMITTED transition allowed for STUDENT |

**Rejected by `.strict()`:** `assignmentId`, `studentId`, `classId`, `submittedAt`, `isLate`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`.

#### `submissionListSchema`
Extends `paginationSchema` with:
| Field | Schema | Role scoping |
|-------|--------|-------------|
| `search` | `searchSchema` | All (scoped to studentId in query) |
| `assignmentId` | `objectIdSchema.optional()` | TEACHER: verify owns; STUDENT: must be enrolled in assignment's class; PARENT: child must be enrolled |
| `studentId` | `objectIdSchema.optional()` | ADMIN/TEACHER only; STUDENT/PARENT ignored (hardcoded) |
| `classId` | `objectIdSchema.optional()` | TEACHER: must own class; STUDENT: must be enrolled; PARENT: child must be enrolled |
| `status` | `z.nativeEnum(SubmissionStatus).optional()` | All (scoped) |
| `isActive` | `z.preprocess(Boolean)` | ADMIN only; default true for all others |

### Exported types
```typescript
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
export type CreateSubmissionInput = Omit<z.infer<typeof createSubmissionSchema>, "status">;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type PatchSubmissionInput = z.infer<typeof patchSubmissionSchema>;
export type SubmissionListQuery = z.infer<typeof submissionListSchema>;
```

---

## 8. Repository Design (Planned)

**File:** `src/repositories/submission.repository.ts`

Follows the exact pattern of `assignment.repository.ts` / `enrollment.repository.ts`:

```typescript
export class SubmissionRepository {
  create(data: Partial<ISubmission>): Promise<ISubmission>
  findById(id: string): Promise<ISubmission | null>
  update(id: string, updateData: UpdateQuery<ISubmission>): Promise<ISubmission | null>
  softDelete(id: string): Promise<ISubmission | null>
  exists(filter: Record<string, unknown>): Promise<boolean>
  totalCount(filter: Record<string, unknown>): Promise<number>
  findAllPaginated(filter, page, limit, sortBy, sortOrder): Promise<ISubmission[]>
  findByAssignment(assignmentId: string): Promise<ISubmission[]>
  findByStudent(studentId: string): Promise<ISubmission[]>
  findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<ISubmission | null>
}
```

Key methods needed:
- `findByAssignmentAndStudent` — for duplicate detection (service-level check before create)
- `findByAssignment` — for teacher listing all submissions on an assignment
- `findByStudent` — for student listing own submissions

All `findAllPaginated` returns use `.lean()` (matches Enrollment/Assignment pattern).

---

## 9. Service Design (Planned)

**File:** `src/services/submission.service.ts`

### RBAC rules

| Role | Create | List (all) | Get by ID | PUT | PATCH | DELETE |
|------|--------|------------|-----------|-----|-------|--------|
| ADMIN | Yes | All | All | Yes | Yes | Yes (soft-delete) |
| TEACHER | No | Own classes' assignments | Own classes' | No | Yes (status only) | No |
| STUDENT | Yes (own) | Own only | Own only | Yes (own, while DRAFT) | Yes (own, DRAFT→SUBMITTED) | Yes (own, while DRAFT) |
| PARENT | No | Children's only | Children's only | No | No | No |

### Service methods

1. **`verifyAuthorized(currentUserId)`** — Same as Assignment/Enrollment. Returns `{ id, role }`. Allows all 4 roles.
2. **`verifyAssignment(id)`** — Fetch assignment + verify `isActive`. Return 404 if not found/inactive.
3. **`verifyStudent(studentId)`** — Verify user exists, is STUDENT role, is active. Reuse EnrollmentService pattern.
4. **`verifyTeacherOwnsAssignment(assignmentId, requestorId, role)`** — Fetch assignment, verify class's `teacherId === requestorId` for TEACHER role.
5. **`isStudentEnrolledInClass(studentId, classId, courseId)`** — Reuse EnrollmentService pattern.
6. **`isChildEnrolledInClass(parentId, classId, courseId)`** — Reuse EnrollmentService pattern (query parent's children, check enrollment).
7. **`getSubmissionForUpdate(id, requestorId, role)`** — Fetch submission + ownership check. Only TEACHER/ADMIN (not STUDENT — students use create/patch for their own).
8. **`getSubmissionForDelete(id, requestorId, role)`** — Fetch submission, no `isActive` check (idempotent soft-delete, same as Enrollment/Assignment.

### Core method signatures

```typescript
class SubmissionService {
  listSubmissions(query: SubmissionListQuery, currentUserId: string): Promise<{ submissions, pagination }>
  getSubmissionById(id: string, currentUserId: string): Promise<SubmissionResponse>
  createSubmission(data: CreateSubmissionInput, currentUserId: string): Promise<SubmissionResponse>
  updateSubmission(id: string, data: UpdateSubmissionInput, currentUserId: string): Promise<SubmissionResponse>
  patchSubmission(id: string, data: PatchSubmissionInput, currentUserId: string): Promise<SubmissionResponse>
  deleteSubmission(id: string, currentUserId: string): Promise<SubmissionResponse>
}
```

### `createSubmission` logic (detailed)

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. Role check: Only ADMIN and STUDENT can create. TEACHER/PARENT → 403.
3. `studentId` = `requestorId` (from JWT). For ADMIN creating on behalf of student, accept `studentId` from query param or allow ADMIN to specify.
   - **Design decision:** Only STUDENT can create submissions. ADMIN is included for admin-level creation (e.g., manual submission import). TEACHER cannot create submissions on behalf of students.
4. `verifyAssignment(data.assignmentId)` → fetches Assignment, verifies `isActive`
5. If assignment `status !== PUBLISHED` → return 404 (student can't see non-published)
6. If assignment `submissionType === NONE` → return 400 (no submissions allowed)
7. Verify student is enrolled in assignment's class: `isStudentEnrolledInClass(studentId, assignment.classId, assignment.courseId)` → If not enrolled → return 404 (IDOR: don't reveal assignment exists)
8. Check for existing active submission: `findByAssignmentAndStudent(assignmentId, studentId)` → If exists and `isActive: true` → return 409 (`SUBMISSION_EXISTS`)
9. Derive `classId` from `assignment.classId`
10. Set `submittedAt = null` (DRAFT by default)
11. Set `status = DRAFT`
12. Set `isLate = false` (not submitted yet)
13. Set `gradedAt = null`
14. Set `isActive = true`
15. Try `create()` → catch 11000 → return 409 (`SUBMISSION_EXISTS`)

### `patchSubmission` logic (detailed)

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. Fetch submission via `findById(id)`; if not found or `!isActive` → 404
3. **Role-based ownership:**
   - STUDENT: `submission.studentId !== requestorId` → 404
   - PARENT: verify `submission.studentId` belongs to a child → 404 if not
   - TEACHER: verify `assignment.classId` belongs to this teacher → 404 if not
   - ADMIN: allowed
4. **PATCH field rules:**
   - STUDENT/PARENT: Only `content` and `attachments` can be patched. `status` cannot be patched.
   - TEACHER/ADMIN: `status` can be patched (e.g., set MISSING). `content` can be patched (e.g., clear).
   - Actually: For STUDENT, PATCH `content`/`attachments` while in DRAFT. PATCH `status: SUBMITTED` transitions to submitted (sets `submittedAt`).
   - STUDENT can PATCH `status` only DRAFT→SUBMITTED (not to LATE, MISSING).
5. If `status` changes to SUBMITTED:
   - Set `submittedAt = new Date()`
   - Set `isLate = submittedAt > assignment.dueDate`
6. Update via repository `update(id, { $set: updates })`

### `deleteSubmission` logic (detailed)

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. Only ADMIN and STUDENT can delete (own submissions). TEACHER/PARENT → 403.
3. `getSubmissionForDelete(id, requestorId, role)`:
   - Fetch submission; if not found → 404
   - STUDENT: `submission.studentId !== requestorId` → 404
   - ADMIN: allowed
4. If `!isActive` → return current (idempotent, same as Assignment/Enrollment)
5. Soft-delete: `softDelete(id)` → set `isActive: false`

### `updateSubmission` (PUT) logic

PUT is restricted to TEACHER/ADMIN (for adding feedback notes) and STUDENT (while in DRAFT). The PUT body replaces `content` and `attachments` entirely. `content` defaults to null if omitted.

---

## 10. Controller Design (Planned)

**File:** `src/controllers/submission.controller.ts`

Follows `assignment.controller.ts` / `enrollment.controller.ts` pattern exactly:

- `list(req)` — extract query params, parse `submissionListSchema`, call `submissionService.listSubmissions`
- `getById(req, id)` — parse `submissionIdParamSchema`, call `submissionService.getSubmissionById`
- `create(req)` — parse `createSubmissionSchema`, call `submissionService.createSubmission`
- `update(req, id)` — parse `updateSubmissionSchema`, call `submissionService.updateSubmission`
- `patch(req, id)` — parse `patchSubmissionSchema`, call `submissionService.patchSubmission`
- `delete(req, id)` — call `submissionService.deleteSubmission`
- `handleError(error)` — same pattern: ZodError→400, 11000 interception, AppError→statusCode, handleMongoError fallback, logger.error + 500

**Response fields in `SubmissionResponse`:**
```typescript
interface SubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  classId: string;
  content: string | null;
  attachments: string[];
  submittedAt: Date | null;
  status: string;
  isLate: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Note: `gradedAt` is omitted from response (not set in Phase 4B). Add in Phase 4C.

---

## 11. API Routes (Planned)

Following the exact route pattern of `src/app/api/assignments/`:

### `src/app/api/submissions/route.ts`
```typescript
GET  → apiHandler → submissionController.list
POST → apiHandler → submissionController.create
```

### `src/app/api/submissions/[id]/route.ts`
```typescript
GET    → apiHandler → extractValidatedId → submissionController.getById
PUT    → apiHandler → extractValidatedId → submissionController.update
PATCH  → apiHandler → extractValidatedId → submissionController.patch
DELETE → apiHandler → extractValidatedId → submissionController.delete
```

`extractValidatedId` uses the same pattern:
```typescript
async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return submissionIdParamSchema.parse({ id }).id;
}
```

### No nested routes needed

Unlike the planning doc's suggestion, we do NOT add:
- `/api/assignments/:id/submissions` (submissions are queried via `assignmentId` query param on `/api/submissions`)
- `/api/students/:id/submissions` (submissions are queried via `studentId` query param, scoped server-side)

The existing list endpoint with `assignmentId` and `studentId` query filters covers all use cases. No unnecessary APIs.

---

## 12. RBAC Matrix

### Submission operations by role

| Role | Create | List (all) | Get by ID | PUT | PATCH | DELETE |
|------|--------|------------|-----------|-----|-------|--------|
| **ADMIN** | ✅ (any student) | ✅ all | ✅ all | ✅ | ✅ | ✅ (soft-delete) |
| **TEACHER** | ❌ | ✅ (own classes' assignments) | ✅ (own classes') | ❌ | ✅ (status: set MISSING; content: clear) | ❌ |
| **STUDENT** | ✅ (own only) | ✅ (own only) | ✅ (own only) | ✅ (own, while DRAFT) | ✅ (own, DRAFT→SUBMITTED; content edits while DRAFT) | ✅ (own, while DRAFT) |
| **PARENT** | ❌ | ✅ (children's only) | ✅ (children's only) | ❌ | ❌ | ❌ |

### Permission derivation

| Access type | How derived |
|---|---|
| Student → Assignment class | `Submission.assignmentId → Assignment.classId → Enrollment check` |
| Teacher → Assignment | `Assignment.classId → Class.teacherId === requestorId` |
| Parent → Student | `User.parentIds` contains requestorId (student's parentIds includes parent) |
| Student → own submission | `Submission.studentId === requestorId` |

---

## 13. Security / IDOR Rules

### Authentication

- All routes pass through `middleware.ts` which:
  1. Verifies `accessToken` cookie via `jose` (`verifyEdgeAccessToken`)
  2. Overwrites `x-user-id` and `x-user-role` headers from JWT payload (client-supplied headers are ignored)
  3. Enforces CSRF on POST/PUT/PATCH/DELETE

### IDOR protection (return 404, not 403)

- STUDENT accessing another student's submission → 404
- PARENT accessing unrelated student's submission → 404
- TEACHER accessing submissions for classes they don't own → 404
- STUDENT accessing assignment they're not enrolled in → 404 (assignment-level check)
- POST `/api/submissions/{otherStudentId}` → 404 (studentId from JWT, not body)

### Mass-assignment protection

- All schemas use `.strict()`
- Rejected from `createSubmissionSchema`: `studentId`, `classId`, `submittedAt`, `status`, `isLate`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`, `courseId`, `enrollmentId`
- Rejected from `patchSubmissionSchema`: `assignmentId`, `studentId`, `classId`, `submittedAt`, `isLate`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`
- `studentId` derived from JWT `x-user-id` header (server-controlled)
- `classId` derived from `Assignment.classId` (server-controlled)
- `submittedAt` set server-side on SUBMITTED transition
- `isLate` calculated server-side

### CSRF protection

- POST/PUT/PATCH/DELETE on `/api/submissions` and `/api/submissions/[id]` require CSRF token
- Double-submit cookie pattern: `csrfToken` cookie + `x-csrf-token` header, timing-safe compared
- GET exempt

### Forged header protection

- `x-user-id` and `x-user-role` are set by middleware from verified JWT payload
- Client-supplied values are overwritten (line 95-96 in `middleware.ts`)
- Controllers read from `req.headers.get("x-user-id")` — this is the middleware-set value, not user-supplied

### Enrollment verification at submission

- Every `createSubmission` verifies the student is enrolled in the assignment's class via `enrollmentRepository.findByStudentAndClass`
- Inactive enrollment (dropped/completed) → submission blocked
- This prevents a student from submitting for a class they're no longer enrolled in

### Inactive/invisible access rules

| Resource state | STUDENT | PARENT | TEACHER | ADMIN |
|---|---|---|---|---|
| Inactive assignment | ❌ 404 | ❌ 404 | ❌ 404 | ❌ 404 |
| DRAFT assignment | ❌ 404 | ❌ 404 | ✅ | ✅ |
| ARCHIVED assignment | ✅ read only | ✅ read | ✅ read | ✅ |
| Student inactive account | N/A (can't auth) | N/A | N/A | ✅ |
| Soft-deleted submission | ❌ 404 | ❌ 404 | ❌ 404 | ✅ |

### Query parameter bypass protection

- `studentId` query param on `/api/submissions` list:
  - STUDENT: ignored (hardcoded to `requestorId`)
  - PARENT: ignored (hardcoded to children's IDs)
  - ADMIN/TEACHER: honored
- `classId` query param:
  - TEACHER: verified against `findActiveClassIdsByTeacher`
  - STUDENT: verified enrollment
  - PARENT: verified children's enrollment
  - ADMIN: honored as-is

### Rate limiting

- All routes wrapped in `apiHandler` → 100 req/60s/IP via `rateLimiter`

---

## 14. Middleware / CSRF Integration (Planned)

### protectedRoutes entry (to be added)

In `src/middleware.ts`, `protectedRoutes` array (line 10), add `"/api/submissions"`:

```typescript
const protectedRoutes = [
  "/api/auth/change-password", "/api/auth/profile", "/api/auth/logout",
  "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments",
  "/api/assignments",
  "/api/submissions",  // NEW — Phase 4B
];
```

### Dynamic route handling

- `/api/submissions` — matches `matchesRoute("/api/submissions", protectedRoutes)` via `pathname.startsWith("/api/submissions/")`
- `/api/submissions/[id]` — covered by the prefix match
- No regex or special handling needed (same as `/api/assignments`)

### CSRF behavior

- GET: exempt
- POST: requires CSRF token (create submission)
- PUT: requires CSRF token
- PATCH: requires CSRF token
- DELETE: requires CSRF token

### JWT identity propagation

- Middleware verifies `accessToken` → extracts `{ userId, role }` from JWT
- Sets `x-user-id` = `decoded.userId` and `x-user-role` = `decoded.role` as request headers
- Controllers read `req.headers.get("x-user-id")` — this is the server-set value

### Forged-header protection (verified)

Middleware **overwrites** client-supplied headers:
```typescript
const requestHeaders = new Headers(req.headers);
requestHeaders.set("x-user-id", decoded.userId);   // overwrites client value
requestHeaders.set("x-user-role", decoded.role);    // overwrites client value
```
A client sending `x-user-id: <victim>` will have it overwritten. Confirmed in `middleware.ts:95-96`.

---

## 15. Database Indexes (Planned)

### Submission model indexes

Following the Enrollment partial-unique index pattern (`enrollment.model.ts:50`):

| Index | Type | Rationale |
|-------|------|----------|
| `{ assignmentId: 1, studentId: 1 }` | Partial unique | One active submission per assignment per student. Matches Enrollment's `{ studentId: 1, classId: 1 }` pattern |
| `{ studentId: 1, isActive: 1 }` | Non-unique | Student lists own submissions |
| `{ assignmentId: 1, isActive: 1 }` | Non-unique | Teacher lists all submissions for an assignment |
| `{ classId: 1, isActive: 1 }` | Non-unique | Teacher lists submissions by class (via assignment's class) |
| `{ status: 1 }` | Non-unique | Filter by status |
| `{ submittedAt: -1 }` | Non-unique | Sort by submission time |
| `{ assignmentId: 1, studentId: 1, isActive: 1 }` | Non-unique | Compound for lookups (find existing active submission) |

### Soft-delete + unique index resolution

The partial unique index `{ assignmentId: 1, studentId: 1, partialFilterExpression: { isActive: true } }` ensures:
- One active submission per (assignment, student)
- Soft-deleted submission → student can create a new one (no conflict)
- Service-level check (`findByAssignmentAndStudent`) provides immediate feedback before DB write
- DB-level 11000 → caught at service level → 409 `SUBMISSION_EXISTS`

This matches Enrollment's exact pattern:
```typescript
// enrollment.model.ts:50
enrollmentSchema.index(
  { studentId: 1, classId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
```

### Submission indexes (exact match to pattern)

```typescript
submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
submissionSchema.index({ studentId: 1, isActive: 1 });
submissionSchema.index({ assignmentId: 1, isActive: 1 });
submissionSchema.index({ classId: 1, isActive: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });
```

---

## 16. Duplicate / Resubmission Strategy

### Decision: **Option A — Single active submission per student per assignment**

**Rationale:**
1. Enrollment uses the same pattern (one active enrollment per student per class)
2. Simplifies grading (one grade per submission, not per submission attempt)
3. `updatedAt` tracks draft edits before formal submission
4. Soft-delete + resubmit works via partial unique index

**Behavior:**

| Scenario | Behavior |
|---|---|
| Student creates DRAFT submission | New record, `status=DRAFT`, `submittedAt=null` |
| Student PATCHes `status: SUBMITTED` | `submittedAt = new Date()`, `status = SUBMITTED` or `LATE` |
| Student PATCHes `content` while DRAFT | Updates `content`, `updatedAt` refreshed |
| Student PATCHes `status: SUBMITTED` again after already submitted | No-op or 400 (already submitted) |
| Student deletes DRAFT submission | Soft-delete (`isActive: false`) |
| Student creates new submission after soft-deleting DRAFT | New record allowed (partial unique only affects `isActive: true`) |
| Student tries to create while active submission exists | 409 `SUBMISSION_EXISTS` (service-level check + DB 11000) |
| Teacher soft-deletes student's submitted submission | Allowed (ADMIN only); student can recreate (new active record) |

**Submission history:** OUT OF SCOPE for Phase 4B. The `updatedAt` timestamp provides basic edit tracking. Full submission history (tracking each save/edit as a separate record) is deferred.

**Duplicate-key handling (exact pattern from Assignment/Enrollment service):**
```typescript
try {
  const created = await submissionRepository.create(submissionData);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
    throw new AppError(ERROR_MESSAGES.SUBMISSION_EXISTS, STATUS_CODES.CONFLICT, ["You have already submitted this assignment"]);
  }
  const mongoError = handleMongoError(error);
  if (mongoError) throw mongoError;
  throw error;
}
```

---

## 17. Error Handling

### New error messages (to add to `src/constants/errorMessages.ts`)

```typescript
SUBMISSION_NOT_FOUND: 'Submission not found.',
SUBMISSION_EXISTS: 'A submission for this assignment already exists.',
```

### Error scenarios

| Scenario | Error | Status |
|---|---|---|
| Submission ID not found | `SUBMISSION_NOT_FOUND` | 404 |
| Submission not owned by requestor (IDOR) | `SUBMISSION_NOT_FOUND` | 404 |
| Duplicate active submission | `SUBMISSION_EXISTS` | 409 |
| Student not enrolled in assignment's class | `SUBMISSION_NOT_FOUND` (hide assignment existence) | 404 |
| Assignment not published | `ASSIGNMENT_NOT_FOUND` | 404 |
| Assignment has `submissionType: NONE` | `INVALID_SUBMISSION_TYPE` (new message) | 400 |
| TEACHER/PARENT calling create | `FORBIDDEN` | 403 |
| STUDENT calling create (valid) but assignment is DRAFT | `ASSIGNMENT_NOT_FOUND` | 404 |
| Invalid `status` transition (e.g., STUDENT sets MISSING) | `FORBIDDEN` | 403 |
| Soft-delete already-deleted submission | Return current (idempotent) | 200 |

### Controller error handling pattern

Same as `assignment.controller.ts` `handleError`:
1. `z.ZodError` → 400 with issues array
2. Duplicate-key (11000) → 409 (intercepted at service level, but controller also checks)
3. `AppError` → use `error.statusCode` and `error.errors`
4. `handleMongoError(error)` → if returns non-null, use its status
5. Unknown error → 500 (logger.error)

---

## 18. Test Strategy

### Test infrastructure (actual)

- **Runner:** `node:test` via `npx tsx --test`
- **Assertions:** Node.js built-in `node:assert` with `strict` mode
- **Organization:** Co-located `__tests__` directories
- **Mocking:** Manual monkey-patching of repository singletons (no DI framework, no mongodb-memory-server)
- **Env vars:** `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` required even for mocked tests (they're in `env.ts` which throws at import time)
- **Test command:** `$env:MONGODB_URI="..."; $env:JWT_ACCESS_SECRET="..."; $env:JWT_REFRESH_SECRET="..."; npx tsx --test` (or `npm test`)

### Phase 4A test file naming conventions

| Test type | Location | Naming |
|-----------|----------|--------|
| Service tests | `src/services/__tests__/` | `<domain>.service.test.ts` |
| Validation tests | `src/validations/__tests__/` | `<domain>.validation.test.ts` |
| Middleware security | `src/__tests__/` | `phase<N><letter>.middleware.security.test.ts` |
| Service security | `src/__tests__/` | `phase<N><letter>.service.security.test.ts` (if needed) |

### Phase 4B test files to create

| File | Type |
|------|------|
| `src/services/__tests__/submission.service.test.ts` | Service (role-based CRUD, RBAC, IDOR, enrollment verification, duplicate handling, server-controlled fields) |
| `src/validations/__tests__/submission.validation.test.ts` | Validation (strict mode, ObjectId, enums, mass assignment rejection, PUT/PATCH semantics, pagination, isActive preprocessing) |
| `src/__tests__/phase4b.middleware.security.test.ts` | Middleware security (route protection, CSRF, RBAC at middleware level, header spoof) |

### Test categories (Phase 4B)

| Category | Count | Coverage |
|----------|-------|----------|
| Submission service — CRUD happy path | ~8 | Create DRAFT, submit, list own, list by assignment, get by ID, update, patch, soft-delete |
| Submission service — RBAC | ~12 | ADMIN full, TEACHER list-only + status patch, STUDENT own-only, PARENT children-only |
| Submission service — IDOR | ~8 | Student→other student, parent→other parent's child, teacher→other teacher's class, cross-role access |
| Submission service — Enrollment verification | ~5 | Not enrolled → 404, enrolled → allowed, dropped enrollment → 404, parent child not enrolled → 404 |
| Submission service — Assignment verification | ~4 | Non-published → 404, inactive → 404, submissionType NONE → 400, nonexistent assignment → 404 |
| Submission service — Duplicate/resubmission | ~5 | Existing active → 409, after soft-delete → can create new, late submission flag, re-submit after submit |
| Submission service — Server-controlled fields | ~6 | studentId always from JWT, classId derived from assignment, submittedAt set on submit, isLate calculated, status transitions |
| Submission service — Status lifecycle | ~5 | DRAFT→SUBMITTED, DRAFT→SUBMITTED late, can't set MISSING as student, idempotent soft-delete |
| Submission service — isActive scoping | ~3 | Soft-deleted → 404, list excludes inactive, ADMIN can't filter isActive |
| Submission service — PATCH ownership | ~5 | Student PATCH content while DRAFT, student can't PATCH after SUBMITTED, teacher can set MISSING status |
| Validation — strict mode | ~5 | Unknown fields rejected, client-supplied studentId rejected, classId rejected |
| Validation — ObjectId | ~3 | Valid format accepted, invalid format rejected, nonexistent (schema-level) |
| Validation — enums | ~3 | SubmissionStatus enum, isValid values, invalid values rejected |
| Validation — PUT/PATCH semantics | ~4 | PUT requires all fields, PATCH allows partial, missing required → error |
| Validation — pagination | ~3 | Defaults, max limit, page boundaries |
| Validation — content/attachment limits | ~3 | Content max length, attachments max count, null content accepted |
| Validation — list filters | ~3 | assignmentId, studentId, classId, status, isActive preprocessing |
| Middleware security — route protection | ~6 | Unauthenticated → 401 for all methods |
| Middleware security — CSRF | ~4 | GET exempt, POST/PUT/PATCH/DELETE require CSRF, missing → 403, mismatched → 403 |
| Middleware security — RBAC | ~3 | All roles can hit route (middleware doesn't role-filter), role enforcement in service |
| Middleware security — header spoof | ~3 | x-user-id overwrite, x-user-role overwrite, forged JWT → 401 |
| Middleware security — route matching | ~3 | `/api/submissions` matches, `/api/submissions/:id` matches, unrelated routes don't match |

### Projected test count

| Category | Projection |
|----------|-----------|
| Submission service tests | ~50 |
| Submission validation tests | ~30 |
| Phase 4B middleware security tests | ~25 |
| **Phase 4B subtotal** | **~105** |

**Label:** These are projections based on Phase 4A's actual count (49 service + 39 validation + 26 middleware = 114).

**Total projected after Phase 4B:** 614 (current) + ~105 = **~719 tests**

---

## 19. TypeScript / Lint / Build Validation (Planned)

### TypeScript (`npx tsc --noEmit`)
- Must pass with 0 errors under `strict: true`
- All new files use `import` (ESM), path alias `@/*` → `./src/*`
- All new types exported from `types/`
- All new validation inferred types from `z.infer`

### ESLint (`npm run lint`)
- ESLint 9 with flat config (`eslint.config.mjs`)
- Uses `eslint-config-next` (core-web-vitals + typescript)
- No new ESLint-disable comments expected
- Pre-existing warnings (unused vars, etc.) should not increase — match existing code style exactly

### Build (`npm run build`)
- `next build` must compile successfully
- New API routes must not break the build

### Validation before commit
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors
- `npm run build` → success
- `npx tsx --test` → all tests pass

---

## 20. Frontend Impact (Deferred — No Changes)

### APIs frontend will eventually consume (Phase 4B)

| Frontend need | Backend API |
|---|---|
| List student's submissions | `GET /api/submissions` (studentId hardcoded server-side) |
| Submit to assignment | `POST /api/submissions` (body: `assignmentId`, `content`, `attachments`) |
| Edit draft submission | `PATCH /api/submissions/[id]` (body: `content`, `attachments`) |
| Submit draft | `PATCH /api/submissions/[id]` (body: `status: "SUBMITTED"`) |
| View submission | `GET /api/submissions/[id]` |
| Delete draft | `DELETE /api/submissions/[id]` |
| Teacher views class submissions | `GET /api/submissions?assignmentId=...` or `?classId=...` |
| Teacher marks missing | `PATCH /api/submissions/[id]` (body: `status: "MISSING"`) |

### UI capabilities needed (deferred)

- `src/services/api/submissions.ts` — API client wrapper (copy pattern from `services/api/auth/index.ts`)
- `src/config/api/constants.ts` — add `API_ROUTES.submissions`
- `src/app/(dashboard)/submissions/` — list/create/detail pages
- `src/app/(dashboard)/assignments/[id]/submissions/` — teacher view

### Reusable frontend infrastructure (already exists)

- Axios `apiClient` with `withCredentials: true` — no changes needed
- 401→refresh→retry interceptor — no changes needed
- `DataTable` component — reusable for submission lists
- React Hook Form + Zod — reusable for submission forms
- Role-based navigation filtering (`filterNavItems()`) — exists but has no submission nav items yet

---

## 21. Implementation Sequence (Planned)

1. Add `SUBMISSION_NOT_FOUND`, `SUBMISSION_EXISTS` to `src/constants/errorMessages.ts`
2. Create `src/types/submission.types.ts` — `ISubmission`, `SubmissionStatus` enum
3. Create `src/models/submission.model.ts` — Mongoose schema with partial unique index
4. Create `src/repositories/submission.repository.ts` — CRUD + `findByAssignment` + `findByStudent` + `findByAssignmentAndStudent`
5. Create `src/validations/submission.validation.ts` — strict schemas (create, update, patch, list, id param)
6. Create `src/services/submission.service.ts` — `verifyAuthorized`, `verifyAssignment`, `verifyStudent`, `verifyTeacherOwnsAssignment`, enrollment checks, `listSubmissions`, `getSubmissionById`, `createSubmission`, `updateSubmission`, `patchSubmission`, `deleteSubmission`
7. Create `src/controllers/submission.controller.ts` — CRUD controller with `handleError`
8. Create `src/app/api/submissions/route.ts` — GET/POST via `apiHandler`
9. Create `src/app/api/submissions/[id]/route.ts` — GET/PUT/PATCH/DELETE via `apiHandler`
10. Add `/api/submissions` to `protectedRoutes` in `src/middleware.ts`
11. Create `src/services/__tests__/submission.service.test.ts`
12. Create `src/validations/__tests__/submission.validation.test.ts`
13. Create `src/__tests__/phase4b.middleware.security.test.ts`
14. Run `npx tsc --noEmit` → 0 errors
15. Run `npm run lint` → 0 errors
16. Run `npm run build` → success
17. Run `npx tsx --test` → all pass

---

## 22. Contradictions Discovered (Planning Doc vs. Actual Code)

| # | Section in planning doc | Planning doc claims | Actual code | Resolution for Phase 4B |
|---|---|---|---|---|
| 1 | §2 test baseline | "470 tests" | 614 tests (117 suites) | Phase 4B baseline is 614, not 470 |
| 2 | §2 git checkpoint | "1a8f4e1" | `0595df2` (Phase 4A commit) | Document reflects actual head commit |
| 3 | §4 Assignment model (§14 data model) | `updateAssignmentSchema` includes `courseId` | Actual `updateAssignmentSchema` does NOT include `courseId` — it's derived in service | Submission PUT/PATCH must NOT accept `classId` or `courseId` — both server-controlled |
| 4 | §14 Submission model | Lists `gradedAt` as a field | N/A (Submission not implemented) | `gradedAt` deferred to Phase 4C; null in Phase 4B |
| 5 | §4 Submission model | Lists `enrollmentId` as relationship | N/A | Enrollment NOT stored on Submission — verified at creation time only |
| 6 | §21 Risks — soft-delete cascade | "No soft-delete cascade" as risk | Confirmed: Enrollment/Enrollment soft-delete does not cascade | Document: Submissions reference assignments; deleting an assignment does not delete submissions — teacher should archive instead. Consider adding cascade logic in service layer (filter out submissions for inactive assignments) |
| 7 | §17 Test strategy | "470 tests" baseline | 614 tests baseline | Update all projections |
| 8 | §3 Planning doc says Submission model includes `courseId` | Implied by listing `courseId` in model table | Not in actual Assignment create schema; Assignment service derives courseId from Class | Submission does NOT need `courseId` — Assignment already has it; classId is needed for scoping |
| 9 | §14 RBAC table for Submission | "STUDENT can create" with `assignmentId` + `content` + `attachments` | Not implemented yet — this is the plan | Confirmed: createSubmissionSchema accepts only `assignmentId` for DRAFT; `content`/`attachments` for PUT/PATCH |

### Critical contradiction: SubmissionStatus states

The planning doc lists submission statuses as `DRAFT, SUBMITTED, LATE, MISSING`. However, it also mentions resubmission. **Resolved:** DRAFT is the initial state. Student PATCHes `status: SUBMITTED` to formally submit. `LATE` is set server-side when `submittedAt > dueDate`. `MISSING` is reserved for Phase 4C (teacher manual or system-assigned). No `GRADED` status on Submission — grading lives in the Grade domain.

---

## 23. Known Risks / Dependencies

| Risk | Impact | Mitigation |
|------|--------|-----------|
| No file upload infrastructure | High for FILE submission type | FILE submissions store URL strings only (pre-uploaded by teacher in Assignment `attachments`). Students cannot upload files. Document FILE as `attachments` URL-only. Actual file upload is out of scope. |
| Duplicate submission race condition | Medium | Service-level check (`findByAssignmentAndStudent`) + DB-level partial unique index + 11000 interception |
| Soft-deleted assignment has active submissions | Medium | Submissions remain visible to teacher even if assignment inactive. Service should return 404 for student access to inactive assignment submissions |
| No submission history tracking | Low | `updatedAt` provides basic edit tracking. Full history deferred |
| Teacher can't change studentId on submission | Intended | Server-controlled from JWT — this is a security feature, not a limitation |
| `submissionType` from Assignment | Medium | Submission inherits `submissionType` from Assignment. If Assignment type is FILE but student submits TEXT, service should validate content matches type |
| `MISSING` status auto-assignment | Out of scope | Not implemented in Phase 4B. Requires cron/job system. |
| Cross-teacher access to student submissions | Security | Teacher A cannot see submissions for Teacher B's classes. Verified via `Assignment.classId → Class.teacherId` chain |

---

## 24. Final Implementation-Readiness Decision

### Ready criteria (checked against actual code)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Assignment domain fully implemented | ✅ | `0595df2` — all files present, tests pass |
| Assignment exposes `classId` + `courseId` | ✅ | `assignment.types.ts:19-20` |
| Assignment exposes `submissionType` | ✅ | `assignment.types.ts:26` |
| Assignment exposes `dueDate` | ✅ | `assignment.types.ts:21` |
| Assignment exposes `allowLateSubmissions` + `latePenaltyPercent` | ✅ | `assignment.types.ts:24-25` |
| Assignment exposes `status` (DRAFT/PUBLISHED/ARCHIVED) | ✅ | `assignment.types.ts:6-7` |
| Assignment exposes `createdBy` (teacher) | ✅ | `assignment.types.ts:28` |
| Class exposes `courseId` + `teacherId` | ✅ | `class.types.ts:7-8` |
| Enrollment exposes `studentId` + `classId` + `courseId` | ✅ | `enrollment.types.ts:10-12` |
| User exposes `parentIds` for parent-child linking | ✅ | `user.types.ts:32`, `user.repository.ts:22` |
| `verifyAuthorized` allows all 4 roles | ✅ | `assignment.service.ts:64-76` |
| `verifyTeacherOwnsClass` pattern exists | ✅ | `assignment.service.ts:88-98`, `enrollment.service.ts:87-105` |
| `isStudentEnrolledInClass` pattern exists | ✅ | `assignment.service.ts:100-107` |
| `isChildEnrolledInClass` pattern exists | ✅ | `assignment.service.ts:109-118` |
| Partial unique index pattern exists | ✅ | `enrollment.model.ts:50` |
| Duplicate-key 11000 interception pattern exists | ✅ | `assignment.service.ts:313-314`, `enrollment.service.ts:273-274` |
| Soft-delete idempotent pattern exists | ✅ | `assignment.service.ts:476-478`, `enrollment.service.ts:371-373` |
| CSRF middleware pattern established | ✅ | `middleware.ts:86-92` |
| Route protection (`protectedRoutes`) established | ✅ | `middleware.ts:10` |
| `apiHandler` wrapper pattern established | ✅ | `src/utils/apiHandler.ts` |
| `handleError` controller pattern established | ✅ | `assignment.controller.ts:118-144` |
| Zod `.strict()` + `z.nativeEnum` conventions established | ✅ | `assignment.validation.ts:22,38,53`; `enrollment.validation.ts:17,25,31` |
| `objectIdSchema` reusable | ✅ | `validations/objectId.ts:5` |
| `paginationSchema` reusable | ✅ | `validations/objectId.ts:7-10` |
| `searchSchema` reusable | ✅ | `validations/objectId.ts:12` |
| `ERROR_MESSAGES` pattern established | ✅ | `constants/errorMessages.ts` |
| `STATUS_CODES` pattern established | ✅ | `constants/statusCodes.ts` |
| Test infrastructure established | ✅ | 614 tests, 117 suites, `node:test` + `tsx` |
| `tsc --noEmit` passes | ✅ | 0 errors |
| ESLint config exists | ✅ | `eslint.config.mjs` (flat config, ESLint 9) |
| Build succeeds | ✅ | Phase 4A committed with passing build |

### Blockers to Phase 4B

| Blocker | Resolved? |
|---------|-----------|
| No Assignment domain | ✅ (Phase 4A complete at `0595df2`) |
| No Enrollment domain | ✅ (Phase 3 complete) |
| No `verifyAuthorized` pattern | ✅ (in Assignment and Enrollment services) |
| No partial unique index pattern | ✅ (Enrollment model) |
| No CSRF middleware | ✅ (in `middleware.ts`) |
| No test infrastructure | ✅ (614 tests, `node:test`) |
| No file upload infrastructure | ⏸ Deferred (FILE submissions use URL strings only) |
| No submission history requirement | ⏸ Explicitly out of scope for Phase 4B |

---

## 25. Summary

**Phase 4B Submission is READY FOR IMPLEMENTATION.**

All dependencies are satisfied by the actual committed code at `0595df2`. The Submission domain can be implemented following the exact patterns established by Phase 4A Assignment and Phase 3 Enrollment. No architectural changes, no new dependencies, no infrastructural changes are required.

**Key implementation decisions documented in this plan:**

1. **Single active submission per student per assignment** (partial unique index matching Enrollment pattern)
2. **`studentId` and `classId` are server-controlled** (from JWT and Assignment lookup respectively)
3. **`courseId` is NOT stored on Submission** (derivable via Assignment.courseId)
4. **`enrollmentId` is NOT stored** (verified at creation time only)
5. **`gradedAt` is included but null/null-only** (set by Phase 4C Grade)
6. **FILE submission type is URL-only** (no upload infrastructure; student attaches pre-existing URLs)
7. **Submission history is out of scope** (single active record per assignment+student)
8. **`MISSING` status is defined but not auto-assigned** (Phase 4C or cron system)

**Projected test count after Phase 4B:** ~719 (614 current + ~105 projected)