# LearnSphere Backend — Phase 4C Grade Feature Plan

## Planning-Only Document (Read-Only Audit)

**Status:** PLANNING ONLY — No production code, tests, or configuration files were modified.
**Branch:** `feature/backend-feature-planning`
**Audit date:** 2026-08-29
**Base commit:** `13a417d` — `feat(backend): add submission management and test infrastructure`
**Document type:** Implementation-ready plan (no code generated)

---

## 1. Current Repository State

| Check | Value |
|-------|-------|
| Git branch | `feature/backend-feature-planning` |
| HEAD commit | `13a417d` — `feat(backend): add submission management and test infrastructure` |
| Working tree | CLEAN (no uncommitted changes) |
| Test baseline | 763 pass, 0 fail, 0 skipped, 137 suites |
| TypeScript | `tsc --noEmit` → 0 errors (strict mode) |
| ESLint | 0 errors, 33 warnings (all pre-existing `no-unused-vars`) |
| Build | `next build` compiled successfully |
| Test runner | `tsx` via `npm test` (`"test": "tsx -r dotenv/config --test"`) |
| Runtime | Next.js 16.2.11 App Router, Node.js v24.13.1, MongoDB/Mongoose 9.8.0 |

### Test count verification

```
ℹ tests 763
ℹ suites 137
ℹ pass 763
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

### Key infrastructure files (actual)

| Component | File | Notes |
|-----------|------|-------|
| Route wrapper | `src/utils/apiHandler.ts` | `apiHandler(handler)` wraps: `connectDB → rateLimit → handler → catch(500)` |
| Response helper | `src/utils/apiResponse.ts` | `sendResponse(data, message, errors)` → `{ success, message, data, errors, timestamp }` |
| Error class | `src/utils/AppError.ts` | `AppError(message, statusCode, errors[], isOperational)` + `handleMongoError(error)` |
| Status codes | `src/constants/statusCodes.ts` | `OK=200, CREATED=201, NO_CONTENT=204, BAD_REQUEST=400, UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404, CONFLICT=409, UNPROCESSABLE_ENTITY=422, TOO_MANY_REQUESTS=429, INTERNAL_SERVER_ERROR=500` |
| Error messages | `src/constants/errorMessages.ts` | Includes `ASSIGNMENT_NOT_FOUND`, `ASSIGNMENT_EXISTS`, `INVALID_DUE_DATE`, `SUBMISSION_NOT_FOUND`, `SUBMISSION_EXISTS` — **NO `GRADE_*` messages yet** |
| ObjectId schema | `src/validations/objectId.ts` | `objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/)`, `paginationSchema`, `searchSchema` |
| Rate limiter | `src/utils/rateLimiter.ts` | `rate-limiter-flexible`, 100 req/60s/IP |
| Logger | `src/utils/logger.ts` | Winston, JSON + console format |
| CSRF (edge-safe) | `src/lib/csrf.ts` | `validateCsrf(req)`, `setCsrfCookie`, `CSRF_COOKIE_NAME="csrfToken"`, `CSRF_HEADER_NAME="x-csrf-token"`, `safeCompareTokenEdge()` |
| JWT (server) | `src/lib/jwt.ts` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` — payload: `{ userId, role, type }` |
| JWT (edge) | `src/lib/edgeJwt.ts` | `verifyEdgeAccessToken(token)` via `jose` — same payload shape |
| DB connection | `src/lib/db.ts` | Mongoose cached singleton |
| Auth types | `src/types/auth.types.ts` | `JwtPayload { userId: string; role: string; type: 'access' \| 'refresh' \| 'reset' }` |
| User roles | `src/types/user.types.ts` | `UserRole { ADMIN, TEACHER, STUDENT, PARENT }` |

---

## 2. Phase 4A + 4B Dependency Summary (Verified)

Phase 4A (Assignment) and Phase 4B (Submission) are fully implemented and committed at `13a417d`.

### Assignment model (`src/models/assignment.model.ts`)
| Field | Type | Key details (from actual code) |
|-------|------|-------------------------------|
| `maxPoints` | Number | `required`, `min: 0` — maximum possible score |
| `dueDate` | Date | `required`, `index: true` |
| `classId` | ObjectId → Class | `required`, `index: true` |
| `courseId` | ObjectId → Course | `required`, `index: true` — derived from Class in service |
| `createdBy` | ObjectId → User | `required`, `index: true` — teacher from JWT |
| `status` | Enum | `DRAFT`, `PUBLISHED`, `ARCHIVED` — default `DRAFT` |
| `submissionType` | Enum | `FILE`, `TEXT`, `LINK`, `NONE` — default `TEXT` |
| `isActive` | Boolean | default `true`, `index: true` |

### Submission model (`src/models/submission.model.ts`)
| Field | Type | Key details (from actual code) |
|-------|------|-------------------------------|
| `assignmentId` | ObjectId → Assignment | `required`, `index: true` |
| `studentId` | ObjectId → User (STUDENT) | `required`, `index: true` — from JWT |
| `classId` | ObjectId → Class | `required`, `index: true` — derived from Assignment.classId |
| `content` | String | `default: null`, `maxlength: 50000` |
| `attachments` | [String] | `default: []` |
| `submittedAt` | Date | `default: null` — set when status → SUBMITTED |
| `status` | Enum | `DRAFT`, `SUBMITTED`, `LATE`, `MISSING` — default `DRAFT` |
| `isLate` | Boolean | `default: false`, `index: true` — calculated |
| `gradedAt` | Date | `default: null` — **set by Phase 4C Grade** |
| `isActive` | Boolean | default `true`, `index: true` |
| Unique index | | `{ assignmentId: 1, studentId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }` |

### Submission service key patterns (from actual code)
- `verifyAuthorized(currentUserId)` — all 4 roles, returns `{ id, role }`
- `studentId` = `requestorId` from JWT (STUDENT only; TEACHER/PARENT cannot create)
- `classId` derived from `assignment.classId` at creation
- `isStudentEnrolledInClass(studentId, assignment.classId, assignment.courseId)` — verified at creation
- Duplicate check: `findByAssignmentAndStudent` before create → 409 `SUBMISSION_EXISTS`
- 11000 interception in service → 409 `SUBMISSION_EXISTS`
- `getSubmissionForUpdate` checks `isActive`; `getSubmissionForDelete` does NOT (idempotent)
- TEACHER PATCH: can set `status: MISSING` only on own assignments' submissions
- PARENT PATCH: blocked (403)
- PUT: ADMIN + STUDENT (while DRAFT) only

### Submission `graduatedAt` field
- `gradedAt` exists on the Submission model (`src/models/submission.model.ts:56`) but is always `null` — set only by Phase 4C Grade.
- The `SubmissionResponse` in the service (`src/services/submission.service.ts:22-35`) does NOT include `gradedAt` in the response.

---

## 3. Phase 4B Planning Doc — Grade Section

The Phase 4B planning doc (`BACKEND_PHASE_4B_SUBMISSION_FEATURE_PLAN.md`) mentions Grade in several places:

- §120 (line 120): "Grade domain (Phase 4C)" — listed as out of scope
- §230 (line 230): "`gradedAt` — Only set by Grade domain (Phase 4C); null for Phase 4B"
- §321 (line 321): "`gradedAt` ← Phase 4C"
- §978 (line 978): "`gradedAt` deferred to Phase 4C; null in Phase 4B"
- §1074 (line 1074): "Submission history: OUT OF SCOPE for Phase 4B"

The Phase 4 planning doc (`BACKEND_PHASE_4_FEATURE_PLAN.md`) has a detailed Grade section (§14, §658-691) which is the baseline for this Phase 4C plan.

### Discrepancies in Plan vs. Actual Code

| # | Planning doc claims | Actual code | Resolution for Phase 4C |
|---|---------------------|-------------|------------------------|
| 1 | `updateAssignmentSchema` includes `courseId` in body | `courseId` NOT in actual `updateAssignmentSchema`; derived from class in service | Grade must NOT accept `courseId` in body; derive from Assignment if needed |
| 2 | `createSchema` accepts `content` for TEXT submissions | Submission create schema accepts `assignmentId` + optional `content` + optional `attachments` | Grade create schema should accept `studentId`, `assignmentId`, `points`, optional `feedback` — all from teacher body |
| 3 | Submission `PATCH` allows TEACHER to edit `content`/`attachments` | Actual code: TEACHER PATCH allows `content`/`attachments` + `status` (MISSING only) | Grade should follow TEACHER ownership pattern via Assignment.classId → Class.teacherId |
| 4 | Test baseline "470 tests" | 763 tests (137 suites) | Phase 4C test projections must use 763 as baseline |
| 5 | `submissionType: NONE` → 400 check | NOT implemented in submission service | Grade should NOT inherit this unimplemented check; Grade can be created regardless of submissionType (grading is independent of submission method) |
| 6 | `gradedAt` on Submission | Exists but always null | Phase 4C should SET `Submission.gradedAt` when creating a grade — this is the only connection between Grade and Submission |
| 7 | Grade model includes `submissionId` (optional) | No actual Grade model exists | `submissionId` should be included on Grade for traceability, but not required (grade can exist without submission if assignment allows non-submission grading) |
| 8 | Grade model includes `maxPoints` (snapshot) | No actual Grade model | `maxPoints` should be snapshotted from Assignment.maxPoints at grade creation time to preserve historical accuracy |
| 9 | Plan lists `percentage` as calculated field | No actual Grade model | `percentage` should be calculated in service: `points / maxPoints * 100`, rounded to 2 decimal places |
| 10 | RBAC table: ADMIN can create grades | Actual code: ADMIN is full-access in all domains | ADMIN should be able to create grades (for admin-level grading/override) |

### Grade domain: NOT yet implemented (verified)

No files exist for Grade:
- No `src/models/grade.model.ts`
- No `src/types/grade.types.ts`
- No `src/repositories/grade.repository.ts`
- No `src/validations/grade.validation.ts`
- No `src/services/grade.service.ts`
- No `src/controllers/grade.controller.ts`
- No `src/app/api/grades/` route directory
- No `GRADE_NOT_FOUND` or `GRADE_EXISTS` in `errorMessages.ts`

---

## 4. Relationship Graph (Actual)

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
Submission (assignmentId → Assignment, studentId → User)
    ↓
Grade  ← Phase 4C (THIS PLAN)

User (role: PARENT)
    parentIds links → [User (role: STUDENT)]
```

### Key relationships verified

| Relationship | Source field | Target | Verified in |
|---|---|---|---|
| Student ↔ Class | `Enrollment.studentId` → `User._id` | `Enrollment.classId` → `Class._id` | `enrollment.service.ts:125` (`findByStudentAndClass`) |
| Student ↔ Parent | `User.parentIds` → `[User._id]` | `User` where `role=STUDENT` | `user.model.ts:100`, `user.repository.ts:22-28` (`findStudentsByParentId`) |
| Class → Course | `Class.courseId` → `Course._id` | — stored, not derived | `class.types.ts:7`, `class.model.ts:30-34` |
| Assignment → Class | `Assignment.classId` → `Class._id` | — stored | `assignment.types.ts:19`, `assignment.service.ts:283` |
| Assignment → Course | `Assignment.courseId` → `Course._id` | derived from `Class.courseId` in service | `assignment.model.ts:28`, service derives via `cls.courseId.toString()` |
| Assignment → Teacher | `Assignment.createdBy` → `User._id` | from JWT, server-controlled | `assignment.service.ts:303` (`createdBy: requestorId`) |
| Assignment → maxPoints | `Assignment.maxPoints` | Number | `assignment.types.ts:22`, `assignment.model.ts:40-44` |
| Teacher owns Class | `Class.teacherId` → `User._id` | — stored | `class.types.ts:8` |
| Teacher owns Course | `Course.teacherId` → `User._id` | — stored | `course.types.ts:8` |
| Teacher owns Subject | `Subject.teacherId` → `User._id` | — stored | `subject.types.ts:6` |
| Grade → Student | `Grade.studentId` → `User._id` | STUDENT | To be implemented |
| Grade → Assignment | `Grade.assignmentId` → `Assignment._id` | assignment being graded | To be implemented |
| Grade → Submission | `Grade.submissionId` → `Submission._id` | submission being graded (optional) | To be implemented |
| Grade → Class | `Grade.classId` → `Class._id` | derived from Assignment.classId | To be implemented |
| Grade → Teacher | `Grade.gradedBy` → `User._id` | TEACHER from JWT | To be implemented |

### Resolved dependency questions

| Question | Answer | Evidence |
|---|---|---|
| Grade needs `studentId`? | YES | Identifies the graded student; needed for STUDENT/PARENT scoping |
| Grade needs `assignmentId`? | YES | Links grade to assignment; provides `maxPoints` for validation; needed for teacher ownership chain |
| Grade needs `submissionId`? | YES (optional) | Links grade to specific submission; `submissionId` → `assignmentId` → `classId` → `Class.teacherId` chain verifies teacher owns the assignment. NOT required — a grade can be created without a submission (e.g., manual grading by teacher) |
| `courseId` should be stored on Grade? | NO | Derivable via `Grade.assignmentId → Assignment.courseId`. No need to duplicate. |
| `classId` should be stored on Grade? | YES (derived at creation) | Derived from `Assignment.classId` in service. Stored for query efficiency (same pattern as Submission, Enrollment). Enables teacher-scoped queries: "all grades for class X" |
| Should `maxPoints` be stored or referenced? | STORED (snapshot) | Assignment.maxPoints can change after grading (teacher edits assignment). Store snapshot at grade creation to preserve historical accuracy of percentage calculation |
| Should `percentage` be stored or calculated? | CALCULATED at read time, not stored | `points / maxPoints * 100` — stored `maxPoints` ensures percentage is stable even if Assignment.maxPoints changes later |
| `gradedBy` server-controlled? | YES | From JWT `x-user-id` header, never from request body |
| `gradedAt` server-controlled? | YES | Set to `new Date()` in service on creation; never from request body |
| Should Grade set `Submission.gradedAt`? | YES | When creating a Grade with `submissionId`, set `Submission.gradedAt = new Date()` to mark the submission as graded. This is the only cross-domain mutation needed |
| Can a submission be graded multiple times? | YES (update) | PATCH/PUT on grade updates `points`, `feedback`, `gradedAt`. Submission.gradedAt updated accordingly |
| Can a grade exist without a submission? | YES | Teacher can grade manually (e.g., participation, project) even without a submission record |

---

## 5. In Scope

- Grade type definitions (`IGrade` interface)
- Grade Mongoose model with indexes
- Grade repository (CRUD + query methods)
- Grade Zod validation schemas (strict)
- Grade service (RBAC, ownership verification, score validation, duplicate handling, maxPoints snapshotting)
- Grade controller (CRUD with `handleError`)
- Grade API routes (`GET`, `POST`, `GET/:id`, `PUT`, `PATCH`, `DELETE`)
- Middleware integration (`/api/grades` in `protectedRoutes`)
- New error messages (`GRADE_NOT_FOUND`, `GRADE_EXISTS`)
- Test files (service, validation, middleware security)

## 6. Out of Scope (Explicitly Deferred)

- Exam domain
- Quiz domain
- Question domain
- Attendance domain
- Result domain (separate from Grade — results are read-only aggregations)
- Timetable domain
- Announcement domain
- Notification domain (LMS)
- Analytics/reporting (read-only aggregations across domains)
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
- Grade history/audit trail (separate concern — consider future `grade_history` collection)
- Grade approval workflow (e.g., draft grade → reviewed grade)
- Bulk grading operations
- Grade export (CSV/PDF)
- Gradebook analytics

---

## 7. Data Model: Grade

### Field inventory

| Field | Type | Client-supplied? | Server-derived? | Server-controlled? | Notes |
|-------|------|-------------------|--------------------|----------------------|-------|
| `_id` | ObjectId | No | Auto | Yes | Mongoose auto |
| `studentId` | ObjectId → User (STUDENT) | YES (teacher selects student) | — | — | Teacher/admin specifies which student is being graded |
| `assignmentId` | ObjectId → Assignment | YES (teacher selects assignment) | — | — | Links to assignment for maxPoints snapshot and ownership chain |
| `submissionId` | ObjectId → Submission | YES (optional) | — | — | Links to specific submission if grading a submission |
| `classId` | ObjectId → Class | NO | YES (from Assignment) | Yes | Derived from `Assignment.classId`, stored for query efficiency |
| `courseId` | ObjectId → Course | NO | YES (from Assignment) | Yes | **NOT STORED** — derivable via Assignment.courseId; Grade does not store courseId (follows Submission pattern which also doesn't store courseId) |
| `points` | Number | YES | — | — | Awarded score; must be `0 <= points <= maxPoints` |
| `maxPoints` | Number | NO | YES (from Assignment) | Yes | Snapshot of `Assignment.maxPoints` at creation time; never updated from body |
| `percentage` | Number | NO | YES (calculated) | Yes | `Math.round((points / maxPoints) * 10000) / 100` (2 decimal places); recalculated on update if points/maxPoints change |
| `feedback` | String (max 2000) | Partial | — | — | Teacher comments; nullable; editable via PATCH |
| `gradedBy` | ObjectId → User (TEACHER) | NO | — | YES (from JWT) | From JWT `x-user-id` header; never from body |
| `gradedAt` | Date | NO | — | YES | `new Date()` on creation; updated on modification |
| `isActive` | Boolean | NO | — | YES | Default `true` (soft-delete flag) |
| `createdAt` | Date | No | Auto | Yes | Mongoose timestamps |
| `updatedAt` | Date | No | Auto | Yes | Mongoose timestamps |

### Indexes

Following the Enrollment partial unique index pattern (`enrollment.model.ts:50`):

| Index | Type | Rationale |
|-------|------|----------|
| `{ studentId: 1, assignmentId: 1 }` | Partial unique | One active grade per student per assignment. Matches Enrollment's `{ studentId: 1, classId: 1 }` pattern. Ensures no duplicate grading. |
| `{ studentId: 1, isActive: 1 }` | Non-unique | Student lists own grades |
| `{ assignmentId: 1, isActive: 1 }` | Non-unique | Teacher lists all grades for an assignment |
| `{ classId: 1, isActive: 1 }` | Non-unique | Teacher lists grades by class |
| `{ submissionId: 1, isActive: 1 }` | Non-unique | Lookup by submission; also used to set `Submission.gradedAt` |
| `{ gradedBy: 1 }` | Non-unique | Teacher's grades |
| `{ createdAt: 1 }` | Non-unique | Sort by creation time |

### Soft-delete + unique index

Partial unique index `{ studentId: 1, assignmentId: 1, partialFilterExpression: { isActive: true } }` ensures:
- One active grade per (student, assignment)
- Soft-deleted grade → teacher can create a new grade (no conflict)
- Service-level check provides immediate feedback before DB write
- DB-level 11000 → caught at service level → 409 `GRADE_EXISTS`

---

## 8. Validation Design

All schemas use `.strict()` — unknown fields rejected with ZodError.

### Schemas to create in `src/validations/grade.validation.ts`

#### `gradeIdParamSchema`
```typescript
z.object({ id: objectIdSchema })
```

#### `createGradeSchema` (POST — strict)

| Field | Schema | Notes |
|-------|--------|-------|
| `studentId` | `objectIdSchema` (required) | Client supplies — teacher selects which student |
| `assignmentId` | `objectIdSchema` (required) | Client supplies — links to assignment for maxPoints |
| `submissionId` | `objectIdSchema` (optional) | Links to specific submission |
| `points` | `z.number().min(0)` (required) | Must be ≥ 0; must be ≤ Assignment.maxPoints (validated in service) |
| `feedback` | `z.string().max(2000)` (optional, nullable) | Teacher feedback |
| **REJECTED** | `classId` | derived from Assignment |
| **REJECTED** | `courseId` | derived from Assignment |
| **REJECTED** | `maxPoints` | snapshotted from Assignment |
| **REJECTED** | `percentage` | calculated in service |
| **REJECTED** | `gradedBy` | from JWT |
| **REJECTED** | `gradedAt` | server-controlled |
| **REJECTED** | `isActive` | server default true |
| **REJECTED** | `createdAt`, `updatedAt` | Mongoose timestamps |

#### `updateGradeSchema` (PUT — strict)

Same required fields as create: `studentId`, `assignmentId`, `points`. `submissionId`, `feedback` optional. `.strict()` rejects all server-controlled fields.

**Mass-assignment rejection list (all rejected by `.strict()`):** `classId`, `courseId`, `maxPoints`, `percentage`, `gradedBy`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`.

Note: `maxPoints` is NOT in the PUT body — it is always re-snapshotted from the current `Assignment.maxPoints` at update time (ensures consistency if assignment max changed).

#### `patchGradeSchema` (PATCH — strict)

| Field | Schema | Notes |
|-------|--------|-------|
| `points` | `z.number().min(0).optional()` | Must be ≤ Assignment.maxPoints (service-level validation) |
| `feedback` | `z.string().max(2000).nullable().optional()` | Optional |

**REJECTED:** `studentId`, `assignmentId`, `submissionId`, `classId`, `courseId`, `maxPoints`, `percentage`, `gradedBy`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`.

Note: `points` PATCH re-validates against current `Assignment.maxPoints`. `submissionId` PATCH is NOT allowed (submission association is set at creation only; changing it later would break the Submission.gradedAt linkage). `assignmentId` PATCH is NOT allowed (would change the grading context and maxPoints snapshot).

#### `gradeListSchema`

Extends `paginationSchema` with:
| Field | Schema | Role scoping |
|-------|--------|-------------|
| `search` | `searchSchema` | All (scoped to studentId in query) |
| `studentId` | `objectIdSchema.optional()` | ADMIN/TEACHER only; STUDENT/PARENT ignored (hardcoded) |
| `assignmentId` | `objectIdSchema.optional()` | TEACHER: must own assignment; STUDENT/PARENT: must be enrolled |
| `classId` | `objectIdSchema.optional()` | TEACHER: must own class; STUDENT: must be enrolled |
| `submissionId` | `objectIdSchema.optional()` | ADMIN/TEACHER only; STUDENT/PARENT: ignored (hardcoded to own submissions) |
| `isActive` | `z.preprocess(Boolean)` | ADMIN only; default true for all others |

### Exported types
```typescript
export type GradeIdParam = z.infer<typeof gradeIdParamSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type PatchGradeInput = z.infer<typeof patchGradeSchema>;
export type GradeListQuery = z.infer<typeof gradeListSchema>;
```

---

## 9. Repository Design

**File:** `src/repositories/grade.repository.ts`

Follows the exact pattern of `submission.repository.ts` / `assignment.repository.ts`:

```typescript
export class GradeRepository {
  create(data: Partial<IGrade>): Promise<IGrade>
  findById(id: string): Promise<IGrade | null>
  update(id: string, updateData: UpdateQuery<IGrade>): Promise<IGrade | null>
  softDelete(id: string): Promise<IGrade | null>
  exists(filter: Record<string, unknown>): Promise<boolean>
  totalCount(filter: Record<string, unknown>): Promise<number>
  findAllPaginated(filter, page, limit, sortBy, sortOrder): Promise<IGrade[]>
  findByStudent(studentId: string): Promise<IGrade[]>
  findByAssignment(assignmentId: string): Promise<IGrade[]>
  findBySubmission(submissionId: string): Promise<IGrade | null>
  findByStudentAndAssignment(studentId: string, assignmentId: string): Promise<IGrade | null>
  findByClass(classId: string): Promise<IGrade[]>
  findByGradedBy(gradedById: string): Promise<IGrade[]>
}
```

Key methods needed:
- `findByStudentAndAssignment` — for duplicate detection (one active grade per student per assignment)
- `findByAssignment` — for teacher listing all grades for an assignment
- `findByStudent` — for student listing own grades
- `findBySubmission` — for looking up grade by submission; used to set `Submission.gradedAt`
- `findByClass` — for teacher listing grades by class
- All `findAllPaginated` returns use `.lean()` (matches existing pattern)

---

## 10. Service Design

**File:** `src/services/grade.service.ts`

### RBAC rules

| Role | Create | List (all) | Get by ID | PUT | PATCH | DELETE |
|------|--------|------------|-----------|-----|-------|--------|
| ADMIN | ✅ (any student/assignment) | ✅ all | ✅ all | ✅ | ✅ | ✅ (soft-delete) |
| TEACHER | ✅ (own classes' assignments) | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') (soft-delete) |
| STUDENT | ❌ | ✅ (own only) | ✅ (own only) | ❌ | ❌ | ❌ |
| PARENT | ❌ | ✅ (children's only) | ✅ (children's only) | ❌ | ❌ | ❌ |

### Permission derivation

| Access type | How derived |
|---|---|
| Teacher → Assignment | `Assignment.classId → Class.teacherId === requestorId` |
| Teacher → Grade | `Grade.assignmentId → Assignment.classId → Class.teacherId === requestorId` |
| Student → own grade | `Grade.studentId === requestorId` |
| Parent → child's grade | `Grade.studentId` user's `parentIds` contains `requestorId` |
| Admin → all grades | No ownership check (global access) |

### Service methods

1. **`verifyAuthorized(currentUserId)`** — Same as Submission/Assignment/Enrollment. Returns `{ id, role }`. Allows all 4 roles.
2. **`verifyAssignment(id)`** — Fetch assignment + verify `isActive`. Return 404 if not found/inactive. (Reuse pattern from `submission.service.ts:72-80`)
3. **`verifyTeacherOwnsAssignment(assignmentId, requestorId, role)`** — Fetch assignment, verify `assignment.createdBy === requestorId` for TEACHER role. Return 404 if not owner. (Reuse pattern from `submission.service.ts:96-106`)
4. **`verifyStudent(studentId)`** — Verify user exists, is STUDENT role, is active. Return 404 if not found. (Reuse pattern from `submission.service.ts:82-94`)
5. **`isStudentEnrolledInClass(studentId, classId, courseId)`** — Reuse from `submission.service.ts:124-131`
6. **`isChildEnrolledInClass(parentId, classId, courseId)`** — Reuse from `submission.service.ts:133-142`
7. **`getGradeForUpdate(id, requestorId, role)`** — Fetch grade + ownership check. TEACHER: verify owns assignment's class. STUDENT: own grade only. PARENT: child's grade only. Check `isActive`.
8. **`getGradeForDelete(id, requestorId, role)`** — Fetch grade + ownership check. NO `isActive` check (idempotent soft-delete, same as Submission/Assignment/Enrollment pattern).

### Response type

```typescript
export interface GradeResponse {
  id: string;
  studentId: string;
  assignmentId: string;
  submissionId: string | null;
  classId: string;
  points: number;
  maxPoints: number;
  percentage: number;
  feedback: string | null;
  gradedBy: string;
  gradedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Core method signatures

```typescript
class GradeService {
  listGrades(query: GradeListQuery, currentUserId: string): Promise<{ grades: GradeResponse[]; pagination }>
  getGradeById(id: string, currentUserId: string): Promise<GradeResponse>
  createGrade(data: CreateGradeInput, currentUserId: string): Promise<GradeResponse>
  updateGrade(id: string, data: UpdateGradeInput, currentUserId: string): Promise<GradeResponse>
  patchGrade(id: string, data: PatchGradeInput, currentUserId: string): Promise<GradeResponse>
  deleteGrade(id: string, currentUserId: string): Promise<GradeResponse>
}
```

### `createGrade` logic (detailed)

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. Role check: Only ADMIN and TEACHER can create. STUDENT/PARENT → 403.
3. Verify student exists and is STUDENT role: `verifyStudent(data.studentId)`
4. Verify assignment exists and is active: `verifyAssignment(data.assignmentId)`
5. **Teacher ownership**: If `role === TEACHER`, verify `assignment.createdBy === requestorId` → 404 if not owner.
6. **Student enrollment check** (optional but recommended): Verify student is enrolled in assignment's class (unless ADMIN bypassing). This prevents grading students who aren't in the class. **Decision: enforce for TEACHER role; ADMIN can bypass.**
7. **maxPoints snapshot**: `maxPoints = assignment.maxPoints`
8. **Score validation**: `points >= 0` AND `points <= maxPoints` → 400 if violated.
9. **Derive classId**: `classId = assignment.classId`
10. **Check for existing active grade**: `findByStudentAndAssignment(studentId, assignmentId)` → 409 `GRADE_EXISTS` if exists and active.
11. **Set server-controlled fields**:
    - `gradedBy = requestorId` (from JWT)
    - `gradedAt = new Date()`
    - `maxPoints = assignment.maxPoints` (snapshot)
    - `percentage = Math.round((points / maxPoints) * 10000) / 100`
    - `isActive = true`
12. Try `create()` → catch 11000 → 409 `GRADE_EXISTS`.
13. **Cross-domain mutation**: If `submissionId` is provided, after creating the grade, set `Submission.gradedAt = new Date()` via `submissionRepository.update(submissionId, { $set: { gradedAt: new Date() } })`. This is the only cross-domain mutation. If submission not found, grade is still created (submissionId is optional) but log a warning.
14. Log: `Grade created: student=X, assignment=Y (by: ${currentUserId})`

### `patchGrade` logic (detailed)

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. `getGradeForUpdate(id, requestorId, role)` — fetches grade, checks isActive, verifies ownership (TEACHER: owns assignment's class; STUDENT: own grade 403 if not own; PARENT: child's grade 403 if not own)

   **Decision**: STUDENT/PARENT cannot PATCH grades. Only TEACHER/ADMIN can PATCH. This is enforced at step 3.
3. Role check: Only ADMIN and TEACHER can patch. STUDENT/PARENT → 403.
4. If `data.points !== undefined`:
   - Fetch assignment (re-verify it's still active)
   - Validate `points >= 0` AND `points <= assignment.maxPoints` → 400 if violated
   - Update `maxPoints` snapshot to current `assignment.maxPoints` (ensures consistency)
   - Recalculate `percentage = Math.round((points / maxPoints) * 10000) / 100`
5. If `data.feedback !== undefined`:
   - Set `feedback = data.feedback ?? null`
6. Set `gradedAt = new Date()` (updated timestamp for the grade)
7. Update via `gradeRepository.update(id, { $set: updates })`
8. If `submissionId` exists on the grade, update `Submission.gradedAt` again
9. Log: `Grade patched: ${id} (by: ${currentUserId})`

### `updateGrade` (PUT) logic

1. Same RBAC as PATCH (ADMIN/TEACHER only)
2. Same ownership check via `getGradeForUpdate`
3. Re-verify assignment (for maxPoints snapshot and score validation)
4. `points` required — validate `0 <= points <= assignment.maxPoints`
5. `feedback` optional (nullable)
6. `maxPoints` snapshotted from current Assignment.maxPoints (NOT from body)
7. `percentage` recalculated
8. `gradedAt` updated to `new Date()`
9. If `submissionId` exists, update `Submission.gradedAt`
10. Full field replacement (PUT semantics): `studentId`, `assignmentId`, `submissionId` come from URL/grade record, not body (they're needed for route/context but not editable). Actually — PUT replaces the entire resource. The body should contain `points` and `feedback`. `studentId` and `assignmentId` come from the existing grade record (not the body), since you can't change which student/assignment a grade belongs to via PUT. This follows the same pattern as Assignment PUT (where the resource is identified by `:id`, and the body provides the mutable fields).

### `deleteGrade` logic

1. `verifyAuthorized(currentUserId)` → `{ id: requestorId, role }`
2. Only ADMIN and TEACHER can delete. STUDENT/PARENT → 403.
3. `getGradeForDelete(id, requestorId, role)` — fetches grade, verifies ownership. NO `isActive` check (idempotent).
4. If `!isActive` → return current (idempotent, same as all other domains)
5. Soft-delete: `gradeRepository.softDelete(id)` → set `isActive: false`
6. If `submissionId` exists on the grade, set `Submission.gradedAt = null` (un-grade the submission when the grade is deleted). This maintains consistency.
7. Log: `Grade deactivated: ${id} (by: ${currentUserId})`

---

## 11. API Design

### `src/app/api/grades/route.ts`
```
GET  → apiHandler → gradeController.list
POST → apiHandler → gradeController.create
```

### `src/app/api/grades/[id]/route.ts`
```
GET    → apiHandler → extractValidatedId → gradeController.getById
PUT    → apiHandler → extractValidatedId → gradeController.update
PATCH  → apiHandler → extractValidatedId → gradeController.patch
DELETE → apiHandler → extractValidatedId → gradeController.delete
```

`extractValidatedId` uses same pattern:
```typescript
async function extractValidatedId(args: unknown[]): Promise<string> {
  const { id } = await (args[0] as { params: Promise<{ id: string }> }).params;
  return gradeIdParamSchema.parse({ id }).id;
}
```

### No nested routes needed
- List endpoint with query params covers all use cases
- `GET /api/grades?studentId=...` (teacher/admin)
- `GET /api/grades?assignmentId=...` (teacher)
- `GET /api/grades?classId=...` (teacher)
- `GET /api/grades?submissionId=...` (teacher/admin)

### Error responses

| Scenario | Error | Status |
|---|---|---|
| Grade ID not found | `GRADE_NOT_FOUND` | 404 |
| Grade not owned by requestor (IDOR) | `GRADE_NOT_FOUND` | 404 |
| Duplicate active grade (service-level check) | `GRADE_EXISTS` | 409 |
| Duplicate active grade (DB-level 11000) | `GRADE_EXISTS` | 409 |
| Student not enrolled in assignment's class (TEACHER only) | `GRADE_NOT_FOUND` | 404 |
| Assignment not found/inactive | `ASSIGNMENT_NOT_FOUND` | 404 |
| Student not found/not a STUDENT role | `USER_NOT_FOUND` / `FORBIDDEN` | 404 / 403 |
| Score < 0 | Validation error | 400 |
| Score > maxPoints | `INVALID_SCORE` (new message) | 400 |
| Missing required points field | Validation error (ZodError) | 400 |
| TEACHER/PARENT/STUDENT calling create | `FORBIDDEN` | 403 |
| STUDENT/PARENT calling update/patch/delete | `FORBIDDEN` | 403 |
| Soft-delete already-deleted grade | Return current (idempotent) | 200 |

### New error messages to add to `src/constants/errorMessages.ts`

```typescript
GRADE_NOT_FOUND: 'Grade not found.',
GRADE_EXISTS: 'A grade for this student and assignment already exists.',
INVALID_SCORE: 'Score must be between 0 and the assignment\'s maximum points.',
```

---

## 12. RBAC Matrix

### Grade operations by role

| Role | Create | List (all) | Get by ID | PUT | PATCH | DELETE |
|------|--------|------------|-----------|-----|-------|--------|
| **ADMIN** | ✅ (any student) | ✅ all | ✅ all | ✅ | ✅ | ✅ (soft-delete) |
| **TEACHER** | ✅ (own classes' assignments) | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') | ✅ (own classes') (soft-delete) |
| **STUDENT** | ❌ | ✅ (own only) | ✅ (own only) | ❌ | ❌ | ❌ |
| **PARENT** | ❌ | ✅ (children's only) | ✅ (children's only) | ❌ | ❌ | ❌ |

### Permission derivation

| Access type | How derived | Source |
|---|---|---|
| Teacher → Grade | `Grade.assignmentId → Assignment.classId → Class.teacherId === requestorId` | `assignment.service.ts:283` pattern |
| Student → own grade | `Grade.studentId === requestorId` | `submission.service.ts:289` pattern |
| Parent → child's grade | `Grade.studentId` user's `parentIds` contains `requestorId` | `submission.service.ts:304-313` pattern |
| Admin → all grades | No ownership check | `submission.service.ts:171-208` pattern (ADMIN branches) |

### Key security decisions

1. **STUDENT/PARENT can READ but not WRITE grades** — Grades are created/managed by teachers/admins. Students/parents only view.
2. **Teacher ownership is verified via Assignment → Class → teacherId chain** — NOT via a `teacherId` field on Grade. This follows the exact same pattern as Submission.
3. **`submissionId` on Grade is optional** — A teacher can create a grade for a student on an assignment even if the student hasn't submitted. The grade records `points`, `maxPoints`, `feedback` independently.
4. **`studentId` is client-supplied in Grade create** — Unlike Submission (where `studentId` is from JWT because the student creates their own submission), Grade is created BY a teacher who selects WHICH student to grade. So `studentId` is in the create body, validated as an ObjectId, and verified as a STUDENT-role user.
5. **`gradedBy` is server-controlled** — Always from JWT `x-user-id`, never from request body. Follows same pattern as Assignment's `createdBy`.
6. **`maxPoints` is snapshotted from Assignment** — Not from request body. If the teacher changes Assignment.maxPoints later, existing grades retain their original maxPoints.
7. **Score validation against current Assignment.maxPoints** — When creating a grade, `points` must be `0 <= points <= Assignment.maxPoints`. When updating a grade, `points` is re-validated against current `Assignment.maxPoints`.

---

## 13. Security / IDOR Rules

### Authentication
- All routes pass through `middleware.ts` which:
  1. Verifies `accessToken` cookie via `jose` (`verifyEdgeAccessToken`)
  2. Overwrites `x-user-id` and `x-user-role` headers from JWT payload (client-supplied headers are ignored)
  3. Enforces CSRF on POST/PUT/PATCH/DELETE
- Middleware does NOT role-filter (all authenticated users can reach the route). Role enforcement is in the service layer.

### IDOR protection (return 404, not 403)
- STUDENT accessing another student's grade → 404
- PARENT accessing unrelated student's grade → 404
- TEACHER accessing grades for assignments they don't own → 404
- STUDENT/PARENT attempting to create/update/delete grades → 403 (explicit role check, not IDOR)

### Mass-assignment protection
- All schemas use `.strict()`
- Rejected from `createGradeSchema`: `classId`, `courseId`, `maxPoints`, `percentage`, `gradedBy`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`
- Rejected from `patchGradeSchema`: `studentId`, `assignmentId`, `submissionId`, `classId`, `courseId`, `maxPoints`, `percentage`, `gradedBy`, `gradedAt`, `isActive`, `createdAt`, `updatedAt`
- `gradedBy` derived from JWT `x-user-id` header (server-controlled)
- `gradedAt` set server-side (`new Date()`)
- `maxPoints` snapshotted from Assignment.maxPoints
- `percentage` calculated in service
- `classId` derived from Assignment.classId

### CSRF protection
- POST/PUT/PATCH/DELETE on `/api/grades` and `/api/grades/[id]` require CSRF token
- Double-submit cookie pattern: `csrfToken` cookie + `x-csrf-token` header, timing-safe compared
- GET exempt

### Forged header protection
- `x-user-id` and `x-user-role` are set by middleware from verified JWT payload
- Client-supplied values are overwritten (line 95-96 in `middleware.ts`)
- Controllers read from `req.headers.get("x-user-id")` — this is the middleware-set value, not user-supplied

### Query parameter bypass protection
- `studentId` query param on `/api/grades` list:
  - STUDENT: ignored (hardcoded to `requestorId`)
  - PARENT: ignored (hardcoded to children's IDs)
  - ADMIN/TEACHER: honored
- `submissionId` query param:
  - STUDENT/PARENT: ignored (hardcoded to own submissions' grades)
  - ADMIN/TEACHER: honored
- `classId` query param:
  - TEACHER: verified against `findActiveClassIdsByTeacher`
  - STUDENT: verified enrollment
  - PARENT: verified children's enrollment
  - ADMIN: honored as-is
- `assignmentId` query param:
  - TEACHER: verified owns assignment
  - STUDENT: verified enrolled in assignment's class + assignment is PUBLISHED
  - PARENT: verified child enrolled + assignment is PUBLISHED
  - ADMIN: honored as-is

### Rate limiting
- All routes wrapped in `apiHandler` → 100 req/60s/IP via `rateLimiter`

### Cross-domain mutation safety
- When Grade is created with `submissionId`, `Submission.gradedAt` is set via `submissionRepository.update()`
- When Grade is soft-deleted and had a `submissionId`, `Submission.gradedAt` is cleared
- This mutation is scoped: only the specific submission's `gradedAt` field is updated, not any other field

---

## 14. Soft-Delete and `isActive` RBAC

Same pattern as Phase 3 remediation (confirmed in `submission.service.ts:245-251`):
- STUDENT/PARENT/TEACHER always get `isActive: true` (ignores `?isActive=false`)
- Only ADMIN can filter by `isActive=false`

Soft-delete is idempotent (same pattern as Submission/Assignment/Enrollment):
- `getGradeForDelete` does NOT check `isActive` (allows idempotent re-delete)
- `getGradeForUpdate` DOES check `isActive` (cannot update a soft-deleted grade)

### Soft-delete + re-grading behavior:
- If a grade is soft-deleted, the student can be re-graded (partial unique index allows new active grade)
- This mirrors Enrollment's re-enrollment-after-drop behavior

---

## 15. Duplicate / Uniqueness

### Primary rule: One active grade per (student, assignment)

Partial unique index: `{ studentId: 1, assignmentId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }`

This matches Enrollment's exact pattern:
```typescript
// enrollment.model.ts:50
enrollmentSchema.index(
  { studentId: 1, classId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
```

### Race condition handling
```typescript
try {
  const created = await gradeRepository.create(gradeData);
} catch (error) {
  if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000) {
    throw new AppError(ERROR_MESSAGES.GRADE_EXISTS, STATUS_CODES.CONFLICT, ["A grade for this student and assignment already exists."]);
  }
  const mongoError = handleMongoError(error);
  if (mongoMongoError) throw mongoError;
  throw error;
}
```

Service-level check (`findByStudentAndAssignment`) before create provides immediate feedback. DB-level 11000 provides race-condition safety. Both return 409 `GRADE_EXISTS`.

### Edge case: Can the same submission be graded twice?
- A Grade can reference a `submissionId`, but the uniqueness is on `(studentId, assignmentId)`, not on `submissionId`.
- If a student has only one active submission per assignment (enforced by Submission's partial unique index), then there's at most one active grade per submission.
- If the submission is soft-deleted and a new one is created, the old grade still exists (uniqueness is on student+assignment, not submission). The teacher can update the existing grade or create a new one for the new submission (but would get `GRADE_EXISTS` if the old grade is still active). This is correct behavior — grading is tied to student + assignment, not submission.

---

## 16. API Endpoints

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/grades` | Yes | ADMIN (all), TEACHER (own classes), STUDENT (own), PARENT (children's) |
| POST | `/api/grades` | Yes | ADMIN, TEACHER (own classes' assignments) |
| GET | `/api/grades/:id` | Yes | ADMIN, TEACHER (own classes), STUDENT (own), PARENT (children's) |
| PUT | `/api/grades/:id` | Yes | ADMIN, TEACHER (own classes) |
| PATCH | `/api/grades/:id` | Yes | ADMIN, TEACHER (own classes) |
| DELETE | `/api/grades/:id` | Yes | ADMIN, TEACHER (own classes) — soft-delete |

### List query params

| Param | Type | Purpose | Role scoping |
|-------|------|---------|-------------|
| `page` | number (default 1) | Pagination | All |
| `limit` | number (default 20, max 100) | Page size | All |
| `studentId` | ObjectId | Filter by student | ADMIN/TEACHER: honored; STUDENT: hardcoded to own; PARENT: hardcoded to children's |
| `assignmentId` | ObjectId | Filter by assignment | TEACHER: must own; STUDENT: must be enrolled + PUBLISHED; PARENT: child must be enrolled + PUBLISHED; ADMIN: honored |
| `classId` | ObjectId | Filter by class | TEACHER: must own class; STUDENT: must be enrolled; PARENT: child must be enrolled; ADMIN: honored |
| `submissionId` | ObjectId | Filter by submission | ADMIN/TEACHER: honored; STUDENT/PARENT: ignored |
| `search` | string | Search feedback | All (scoped) |
| `isActive` | boolean | Filter active/inactive | ADMIN only; default true for others |

### POST/PUT body (strict)

| Field | Type | Required | Role | Notes |
|-------|------|----------|------|-------|
| `studentId` | ObjectId | POST: Yes; PUT: No (from record) | TEACHER, ADMIN | Student being graded |
| `assignmentId` | ObjectId | POST: Yes; PUT: No (from record) | TEACHER, ADMIN | Source assignment |
| `submissionId` | ObjectId | No | TEACHER, ADMIN | Optional link to submission |
| `points` | number (min 0) | Yes | TEACHER, ADMIN | Must be ≤ Assignment.maxPoints (service-level) |
| `feedback` | string (max 2000) | No | TEACHER, ADMIN | Nullable |

### Server-controlled (never in body)

- `classId` — derived from `Assignment.classId`
- `courseId` — NOT stored on Grade (derivable via Assignment)
- `maxPoints` — snapshotted from `Assignment.maxPoints` at creation/update
- `percentage` — calculated: `Math.round((points / maxPoints) * 10000) / 100`
- `gradedBy` — from JWT `x-user-id`
- `gradedAt` — `new Date()` on creation, updated on modification
- `isActive` — default true
- `createdAt`, `updatedAt` — Mongoose timestamps

### Middleware-protected routes (to be added)

In `src/middleware.ts`, `protectedRoutes` array, add `"/api/grades"`:

```typescript
const protectedRoutes = [
  "/api/auth/change-password", "/api/auth/profile", "/api/auth/logout",
  "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments",
  "/api/assignments", "/api/submissions",
  "/api/grades",  // NEW — Phase 4C
];
```

### CSRF behavior
- GET: exempt
- POST: requires CSRF token (create grade)
- PUT: requires CSRF token
- PATCH: requires CSRF token
- DELETE: requires CSRF token

---

## 17. Controller / Service / Repository Responsibilities

### Controller (`src/controllers/grade.controller.ts`)

Should handle:
- `list(req)` — extract query params, parse `gradeListSchema`, call `gradeService.listGrades`
- `getById(req, id)` — parse `gradeIdParamSchema`, call `gradeService.getGradeById`
- `create(req)` — parse `createGradeSchema`, call `gradeService.createGrade`
- `update(req, id)` — parse `updateGradeSchema`, call `gradeService.updateGrade`
- `patch(req, id)` — parse `patchGradeSchema`, call `gradeService.patchGrade`
- `delete(req, id)` — call `gradeService.deleteGrade`
- `handleError(error)` — same pattern: ZodError→400, duplicate-key interception, AppError→statusCode, handleMongoError fallback, logger.error + 500

### Service (`src/services/grade.service.ts`)

Should handle:
- Business rules
- Ownership validation (verifyAuthorized, verifyTeacherOwnsAssignment, verifyStudent)
- Assignment verification (verifyAssignment — isActive check)
- Student enrollment verification (isStudentEnrolledInClass, isChildEnrolledInClass)
- Score validation (0 ≤ points ≤ Assignment.maxPoints)
- maxPoints snapshotting from Assignment
- percentage calculation
- Duplicate detection (findByStudentAndAssignment)
- Duplicate-key 11000 race handling → 409 GRADE_EXISTS
- State transitions (none needed — Grade has no status enum; it's immutable once created except for PATCH/PUT content changes)
- Authorization rules requiring domain relationships (Assignment → Class → teacherId)
- Cross-domain mutation: setting `Submission.gradedAt` when grade is created/updated/deleted

### Repository (`src/repositories/grade.repository.ts`)

Should handle:
- Database access
- Scoped queries (all methods filter by isActive where appropriate)
- Persistence
- Soft-delete filtering (`isActive: true` in all query methods)
- Uniqueness-related operations

---

## 18. Error Handling

### New error messages to add to `src/constants/errorMessages.ts`

```typescript
GRADE_NOT_FOUND: 'Grade not found.',
GRADE_EXISTS: 'A grade for this student and assignment already exists.',
INVALID_SCORE: 'Score must be between 0 and the assignment\'s maximum points.',
```

### Error scenarios

| Scenario | Error | Status |
|---|---|---|
| Grade ID not found | `GRADE_NOT_FOUND` | 404 |
| Grade not owned by requestor (IDOR) | `GRADE_NOT_FOUND` | 404 |
| Duplicate active grade (service-level check) | `GRADE_EXISTS` | 409 |
| Duplicate active grade (DB-level 11000) | `GRADE_EXISTS` | 409 |
| Assignment not found/inactive | `ASSIGNMENT_NOT_FOUND` | 404 |
| Student not found | `USER_NOT_FOUND` | 404 |
| Student not STUDENT role | `FORBIDDEN` | 403 |
| Score < 0 | ZodError (min 0) | 400 |
| Score > maxPoints | `INVALID_SCORE` | 400 |
| TEACHER/PARENT calling create | `FORBIDDEN` | 403 |
| STUDENT/PARENT calling update/patch/delete | `FORBIDDEN` | 403 |
| Teacher grading assignment they don't own | `ASSIGNMENT_NOT_FOUND` (hide existence) | 404 |
| Student not enrolled in assignment's class (TEACHER) | `GRADE_NOT_FOUND` (hide existence) | 404 |
| Soft-delete already-deleted grade | Return current (idempotent) | 200 |
| Unauthenticated | Middleware returns 401 | 401 |
| Forged x-user-id/x-user-role | Overwritten by middleware | 401 (invalid token) or 403 |
| CSRF missing/mismatched | `CSRF_INVALID` | 403 |

### Controller error handling pattern
Same as `submission.controller.ts:118-144`:
1. `z.ZodError` → 400 with issues array
2. Duplicate-key (11000) → 409 (intercepted at service level, controller also checks via `handleMongoError`)
3. `AppError` → use `error.statusCode` and `error.errors`
4. `handleMongoError(error)` → if returns non-null, use its status
5. Unknown error → 500 (logger.error)

---

## 19. Score Validation

### Requirements
- `points` must be a number
- `points >= 0` (enforced by Zod `z.number().min(0)`)
- `points <= Assignment.maxPoints` (enforced at service level, not Zod — Zod doesn't have access to Assignment)
- `maxPoints` comes from `Assignment.maxPoints` (stored on Assignment model, `min: 0`)
- Integer vs decimal: `points` and `maxPoints` are both `Number` type — decimals are allowed (e.g., 8.5 out of 10). No integer constraint needed.
- Precision: `percentage` rounded to 2 decimal places: `Math.round((points / maxPoints) * 10000) / 100`
- Negative values: rejected by Zod `min(0)`
- NaN/Infinity: rejected by Zod `z.number()` (Zod validates finite numbers by default)
- String-number coercion: NOT applied (Zod `z.number()` requires actual number type — no `z.coerce.number()`)
- Extremely large values: Zod has no upper bound on number; service-level `points <= maxPoints` provides the upper bound

### Validation timing
- Zod validates `points` is a number ≥ 0 at the controller level
- Service validates `points <= Assignment.maxPoints` after fetching the assignment
- This two-layer approach matches the architecture (Zod for format, service for domain logic)

---

## 20. Submission Relationship

### Dependency chain
Grade → Assignment → Class → Course → Subject → User(TEACHER)
Grade → Student(User) → Enrollment → Class
Grade → Submission (optional)

### Rules
- **Only submitted/non-draft submissions can be graded**: A submission in DRAFT status should not be gradeable. **Decision: If `submissionId` is provided on grade creation, verify the submission is NOT in DRAFT status.** If it is DRAFT, return 400 or create grade without linking to submission. **Recommended**: Allow grade creation without submissionId; if submissionId is provided, verify submission status ≠ DRAFT. If DRAFT, set `submissionId = null` and log a warning.

  Actually, reconsidering: A teacher might want to grade a student's work even before they formally "submit" (e.g., reviewing a draft). The grade is about the student's work, not the submission's formal status. **Decision: Do NOT enforce submission status check.** Allow grading any submission regardless of status. The grade is independent of submission lifecycle. If `submissionId` is provided, just verify the submission exists and is active, and set its `gradedAt`.

- **Draft submissions can be graded**: YES (as per above decision)
- **Deleted (soft-deleted) submissions cannot be graded**: If `submissionId` is provided and the submission is `!isActive`, return 404 `SUBMISSION_NOT_FOUND`. **Decision: verify submission `isActive: true` if `submissionId` is provided.**
- **A submission can be graded multiple times**: YES — PATCH/PUT on the grade updates it. The grade is a separate entity from the submission. Updating a grade re-sets `Submission.gradedAt`.
- **Re-submission invalidates or preserves previous grades**: A submission is single-active (partial unique index per assignment+student). Re-submission updates the same record (per Phase 4B plan). So there's only one submission record per student per assignment, and one grade record per student per assignment. No conflict.
- **Soft-delete interaction**: If a submission is soft-deleted, its grade remains (grade references `submissionId` but the grade's uniqueness is on `studentId + assignmentId`, not `submissionId`). If the grade's `submissionId` points to a soft-deleted submission, the grade is still valid. The `Submission.gradedAt` was already set at grade creation time. When the submission is soft-deleted, `Submission.gradedAt` is NOT cleared (only grade deletion clears it).

---

## 21. Middleware / CSRF Integration

### Protected routes entry (to be added)
In `src/middleware.ts`, `protectedRoutes` array, add `"/api/grades"`:

```typescript
const protectedRoutes = [
  "/api/auth/change-password", "/api/auth/profile", "/api/auth/logout",
  "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments",
  "/api/assignments", "/api/submissions",
  "/api/grades",  // NEW — Phase 4C
];
```

### Dynamic route handling
- `/api/grades` — matches `matchesRoute("/api/grades", protectedRoutes)` via `pathname.startsWith("/api/grades/")` (same pattern as `/api/submissions`)
- `/api/grades/:id` — covered by prefix match
- No regex or special handling needed

### CSRF behavior
- GET: exempt
- POST: requires CSRF token (create grade)
- PUT: requires CSRF token
- PATCH: requires CSRF token
- DELETE: requires CSRF token

### JWT identity propagation
- Middleware verifies `accessToken` → extracts `{ userId, role }` from JWT
- Sets `x-user-id` = `decoded.userId` and `x-user-role` = `decoded.role` as request headers
- Controllers read `req.headers.get("x-user-id")` — this is the server-set value

### Forged-header protection (verified)
Middleware overwrites client-supplied headers (confirmed in `middleware.ts:95-96`):
```typescript
requestHeaders.set("x-user-id", decoded.userId);   // overwrites client value
requestHeaders.set("x-user-role", decoded.role);    // overwrites client value
```

---

## 22. Database Indexes (Planned)

### Grade model indexes

| Index | Type | Rationale |
|-------|------|----------|
| `{ studentId: 1, assignmentId: 1 }` | Partial unique | One active grade per student per assignment |
| `{ studentId: 1, isActive: 1 }` | Non-unique | Student lists own grades |
| `{ assignmentId: 1, isActive: 1 }` | Non-unique | Teacher lists all grades for an assignment |
| `{ classId: 1, isActive: 1 }` | Non-unique | Teacher lists grades by class |
| `{ submissionId: 1, isActive: 1 }` | Non-unique | Lookup by submission |
| `{ gradedBy: 1 }` | Non-unique | Teacher's grades |
| `{ createdAt: 1 }` | Non-unique | Sort by creation time |

---

## 23. Test Strategy

### Test infrastructure (actual)
- **Runner:** `node:test` via `tsx` (`npm test` = `tsx -r dotenv/config --test`)
- **Assertions:** Node.js built-in `node:assert` with `strict` mode
- **Organization:** Co-located `__tests__` directories alongside source
- **Mocking:** Manual monkey-patching of repository singletons (no DI framework, no mongodb-memory-server)
- **Env vars:** `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` required even for mocked tests (they're in `env.ts` which throws at import time)
- **Test command:** `$env:DOTENV_CONFIG_PATH=".env.local"; npm test`

### Phase 4C test files to create

| File | Type |
|------|------|
| `src/services/__tests__/grade.service.test.ts` | Service (RBAC, IDOR, ownership, score validation, duplicate handling, maxPoints snapshot, percentage calculation, cross-domain submission update) |
| `src/validations/__tests__/grade.validation.test.ts` | Validation (strict mode, ObjectId, mass assignment rejection, PUT/PATCH semantics, score bounds, pagination) |
| `src/__tests__/phase4c.middleware.security.test.ts` | Middleware security (route protection, CSRF, RBAC at middleware level, header spoof) |

### Test categories

| Category | Tests | Coverage |
|----------|-------|----------|
| Grade service — CRUD happy path | ~6 | Create grade, list own (student), list by assignment (teacher), get by ID, update grade, soft-delete grade |
| Grade service — RBAC | ~12 | ADMIN full, TEACHER scoped to own classes, STUDENT read-only, PARENT read-only |
| Grade service — IDOR | ~8 | Student→other student's grade, parent→other parent's child, teacher→other teacher's assignment, cross-role access |
| Grade service — Ownership | ~5 | Teacher owns assignment via Class.teacherId chain, student owns grade, parent owns child's grade |
| Grade service — Score validation | ~5 | points < 0 rejected, points > maxPoints rejected, points = 0 accepted, points = maxPoints accepted, maxPoints snapshot from assignment |
| Grade service — Percentage calculation | ~3 | Correct percentage, 2 decimal rounding, recalculates on update |
| Grade service — Duplicate prevention | ~3 | Existing active grade → 409, after soft-delete → can create new, MongoDB 11000 handling |
| Grade service — Server-controlled fields | ~4 | gradedBy from JWT, gradedAt server set, maxPoints snapshotted, percentage calculated |
| Grade service — Mass assignment | ~4 | classId rejected, courseId rejected, gradedBy rejected, isActive rejected |
| Grade service — Soft-delete | ~3 | Idempotent re-delete, list excludes inactive, deleted grade returns 404 on subsequent access |
| Grade service — isActive RBAC | ~4 | STUDENT/PARENT/TEACHER cannot filter isActive=false, ADMIN can filter |
| Grade service — Query param bypass | ~4 | studentId query ignored for STUDENT/PARENT, classId query verified for TEACHER, assignmentId query verified |
| Grade service — ObjectId validation | ~3 | Valid format, invalid format rejected, nonexistent assignment/student → 404 |
| Grade service — Pagination | ~3 | Defaults, max limit, page boundaries |
| Grade service — Cross-domain submission mutation | ~4 | Create grade with submissionId sets Submission.gradedAt, delete grade clears Submission.gradedAt, update grade updates Submission.gradedAt, grade without submissionId works |
| Grade service — Submission status check | ~2 | Grade created with DRAFT submission — allowed (no status restriction), grade with soft-deleted submission → 404 |
| Validation — strict mode | ~4 | Unknown fields rejected, classId rejected, maxPoints rejected, gradedBy rejected |
| Validation — ObjectId | ~3 | Valid format, invalid format, nonexistent |
| Validation — score bounds | ~3 | min 0 enforced, negative rejected, maxPoints comparison in service |
| Validation — PUT/PATCH semantics | ~3 | PUT requires all fields, PATCH allows partial, missing required → error |
| Validation — pagination | ~3 | Defaults, max limit, page boundaries |
| Validation — list filters | ~3 | studentId, assignmentId, classId, submissionId, isActive preprocessing |
| Middleware security — route protection | ~8 | Unauthenticated → 401 for all methods |
| Middleware security — CSRF | ~4 | GET exempt, POST/PUT/PATCH/DELETE require CSRF, missing → 403, mismatched → 403 |
| Middleware security — RBAC at middleware | ~3 | Middleware doesn't role-filter (all roles reach route); role enforcement in service |
| Middleware security — header spoof | ~3 | x-user-id overwrite, x-user-role overwrite, forged JWT → 401 |
| Middleware security — route matching | ~3 | `/api/grades` matches, `/api/grades/:id` matches, unrelated routes don't match |

### Projected test count

| Component | Projection |
|----------|-----------|
| Grade service tests | ~50 |
| Grade validation tests | ~25 |
| Phase 4C middleware security tests | ~25 |
| **Phase 4C subtotal** | **~100** |

**Total projected after Phase 4C:** 763 (current) + ~100 = **~863 tests**

---

## 24. Phase Compatibility

### Phase 1 production hardening — ✅ Compatible
- Uses `AppError`, `apiHandler`, `sendResponse`, `handleMongoError`, `STATUS_CODES` — all established patterns
- No infrastructure changes needed

### Phase 2 Subjects + Classes + Courses — ✅ Compatible
- Grade references `Assignment.classId → Class` — Class model exists with `teacherId`, `courseId`
- No changes to Phase 2 models needed

### Phase 3 Assignment architecture — ✅ Compatible (Wait: Phase 3 is Enrollment, Phase 4A is Assignment)
- Grade uses `verifyAuthorized` (Enrollment pattern, `enrollment.service.ts:49-61`)
- Grade uses `isStudentEnrolledInClass` / `isChildEnrolledInClass` (Assignment/Submission pattern)
- Grade uses partial unique index (Enrollment pattern)
- Grade uses 11000 interception (Assignment/Enrollment pattern)

### Phase 4A security — ✅ Compatible
- Grade follows the same RBAC, IDOR, mass-assignment, CSRF, forged-header patterns as Assignment
- Grade reuses `verifyTeacherOwnsAssignment` pattern from Submission (`submission.service.ts:96-106`)

### Phase 4B Submission — ✅ Compatible
- `Submission.gradedAt` field exists and is `null` — Phase 4C sets it when grading
- `SubmissionResponse` does NOT include `gradedAt` — Phase 4C should NOT modify `SubmissionResponse` (that belongs to the Submission domain's responsibility)
- Grade's `submissionId` references `Submission._id` — the Submission model has no `grades` reverse reference (Mongoose population not needed; Grade queries are independent)
- Grade uniqueness is on `(studentId, assignmentId)`, matching Submission uniqueness on `(assignmentId, studentId)` — complementary, not conflicting

### Dependencies that must be completed before Grade
- ✅ Phase 4A Assignment (complete — `assignment.model.ts`, `assignment.repository.ts`, `assignment.service.ts`, `assignment.controller.ts`, routes, validation, tests)
- ✅ Phase 4B Submission (complete — `submission.model.ts`, `submission.repository.ts`, `submission.service.ts`, `submission.controller.ts`, routes, validation, tests)
- ✅ Phase 3 Enrollment (complete — needed for student-class relationship verification)
- ✅ Phase 2 Class/Course/Subject (complete — needed for teacher ownership chain)

---

## 27. Phase 4D Boundary

### What Phase 4C includes
1. Grade model (types, mongoose schema, indexes)
2. Grade repository (CRUD + query methods)
3. Grade validation (strict Zod schemas)
4. Grade service (RBAC, ownership, score validation, duplicate handling, maxPoints snapshot, percentage calculation, Submission.gradedAt mutation)
5. Grade controller (CRUD with handleError)
6. Grade API routes (`/api/grades`, `/api/grades/:id`)
7. Middleware integration (`/api/grades` in protectedRoutes)
8. New error messages (`GRADE_NOT_FOUND`, `GRADE_EXISTS`, `INVALID_SCORE`)
9. Test files (service, validation, middleware security)

### What Phase 4C does NOT include
1. **Exam domain** — separate pedagogical domain (exam → grade, not assignment → grade)
2. **Attendance domain** — separate tracking domain
3. **Report-card aggregation** — read-only analytics across all grades (requires all data domains)
4. **Grade history/audit trail** — separate `grade_history` collection for tracking grade changes over time
5. **Bulk grading** — grading multiple submissions/students at once
6. **Grade export** — CSV/PDF download of grades
7. **Grade approval workflow** — draft grade → reviewed grade workflow
8. **Weighted grading** — different assignment categories with different weights
9. **Gradebook analytics** — class averages, distributions, trends
10. **Late penalty enforcement** — applying `latePenaltyPercent` from Assignment (this is an assignment-level policy; Grade just records the final score)

### Where later grading/reporting/analytics begins
- **Phase 4D**: Security hardening (verify all middleware routes, CSRF, RBAC, IDOR, mass-assignment for Grade)
- **Phase 4E**: Exit validation (tests, typecheck, lint, build)
- **Phase 5/6**: Exam, Attendance, Timetable, Report-card aggregation, Analytics

---

## 28. Planning Corrections Against Phase 4 Feature Plan

The Phase 4 feature plan (`BACKEND_PHASE_4_FEATURE_PLAN.md`, §14 lines 658-691) proposed a Grade model. Here are corrections based on actual code audit:

| # | Plan claims | Actual code | Correction |
|---|-------------|-------------|------------|
| 1 | Grade model includes `maxPoints` as required field | No Grade model exists | `maxPoints` is NOT user-supplied — snapshotted from `Assignment.maxPoints` at creation. Should NOT be in create body schema. |
| 2 | `studentId` in body for Grade | No Grade model exists | Since TEACHER creates grades (selecting student), `studentId` IS in the create body (unlike Submission where studentId is from JWT). This is correct per the plan. |
| 3 | `submissionId` optional link to Submission | No Grade model exists | `submissionId` IS optional (grade can be created without submission). If provided, `Submission.gradedAt` should be set. |
| 4 | `percentage` calculated | No Grade model exists | `percentage = Math.round((points / maxPoints) * 10000) / 100` (2 decimal places). Not stored — calculated at read time or stored as denormalized field. **Decision: store as denormalized field, recalculated on update.** |
| 5 | `{ studentId: 1, assignmentId: 1 }` compound unique index | No Grade model exists | Correct — same pattern as Enrollment. Partial unique on `isActive: true`. |
| 6 | `classId` index for scoping | No Grade model exists | `classId` is derived from Assignment.classId (not from body) and stored on Grade for query efficiency — same as Submission. |
| 7 | RBAC: TEACHER can grade own classes | Confirmed in patterns | Teacher ownership = `Assignment.classId → Class.teacherId`. NOT a `teacherId` field on Grade. |
| 8 | Plan lists `courseId` index on Grade | Not in actual code | **REMOVE** — Grade should NOT store `courseId`. Derivable via `Assignment.courseId`. Follows Submission pattern (Submission also doesn't store courseId). |
| 9 | Plan mentions `submissionType: NONE` → 400 for Submission | NOT implemented in actual Submission service | Grade should NOT inherit this unimplemented check. Grading is independent of submission method. |
| 10 | Test baseline "470 tests" in Phase 4 plan | 763 tests actual | Correct baseline is 763. |

---

## 29. Risks / Blockers

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Score validation requires Assignment.maxPoints lookup | Every grade creation/update needs an Assignment fetch | Acceptable — teacher creates grades one at a time; Assignment fetch is cached in Mongoose |
| maxPoints snapshot can become stale vs Assignment | If Assignment.maxPoints changes after grading, percentage uses old snapshot | Intentional — historical grades should preserve original maxPoints |
| Submission.gradedAt cross-domain mutation | Creating a grade updates a different collection (Submission) | Use best-effort pattern: wrap in try/catch, log warning if submission update fails, don't fail the grade creation |
| No grade history/audit trail | Cannot track who changed a grade and when | Out of Phase 4C scope; `updatedAt` provides basic change tracking |
| Teacher grading student not enrolled in class | Teacher might grade a student who isn't enrolled | Enforce enrollment check for TEACHER (optional for ADMIN) |
| Decimal precision in grading | `points` and `maxPoints` are floats — rounding issues | Use `Math.round((points / maxPoints) * 10000) / 100` for percentage; store points/maxPoints as-is |
| Grade without submission | Student has an assignment but no submission — can teacher still grade? | YES — `submissionId` is optional; grade records points regardless |

### No critical blockers
All dependencies for Phase 4C (Grade) are satisfied:
- ✅ Assignment domain fully implemented (Phase 4A, `13a417d`)
- ✅ Submission domain fully implemented (Phase 4B, `13a417d`)
- ✅ Enrollment domain fully implemented (Phase 3)
- ✅ Class/Course/Subject domains implemented (Phase 2)
- ✅ `verifyAuthorized` pattern established
- ✅ `verifyTeacherOwnsAssignment` pattern established (via Assignment.createdBy)
- ✅ `isStudentEnrolledInClass` / `isChildEnrolledInClass` patterns established
- ✅ Partial unique index pattern established
- ✅ Duplicate-key 11000 interception pattern established
- ✅ Soft-delete idempotent pattern established
- ✅ CSRF middleware pattern established
- ✅ Route protection (`protectedRoutes`) established
- ✅ `apiHandler` wrapper pattern established
- ✅ `handleError` controller pattern established
- ✅ Zod `.strict()` + `z.nativeEnum` conventions established
- ✅ `objectIdSchema`, `paginationSchema`, `searchSchema` reusable
- ✅ `ERROR_MESSAGES` / `STATUS_CODES` patterns established
- ✅ Test infrastructure established (763 tests, `node:test` + `tsx`)
- ✅ `tsc --noEmit` passes
- ✅ ESLint config exists
- ✅ Build succeeds
