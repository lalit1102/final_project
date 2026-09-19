# LearnSphere Backend — Phase 6 Feature Plan: Attendance

## Planning-Only Document (Read-Only Audit)

**Status:** PLANNING ONLY — No production code, tests, or configuration files were modified.
**Branch:** `feature/backend-feature-planning`
**Audit date:** 2026-09-19
**Base commit:** `ebf0cb8` — `test(backend): complete phase 5 test coverage`
**Document type:** Implementation-ready plan (no code generated)

---

## 1. Current Repository State

| Check | Value |
|-------|-------|
| Git branch | `feature/backend-feature-planning` |
| HEAD commit | `ebf0cb8` — `test(backend): complete phase 5 test coverage` |
| Working tree | CLEAN (no uncommitted changes) |
| Test baseline | 1281 pass, 0 fail, 0 skipped, 214 suites |
| TypeScript | `tsc --noEmit` → 0 errors (strict mode) |
| ESLint | 0 errors |
| Build | `npm run build` compiled successfully |
| Test runner | `tsx` via `npm test` (`"test": "tsx -r dotenv.config --test"`) |
| Runtime | Next.js 16.2.11 App Router, Node.js 24.x, MongoDB/Mongoose 9.8.0 |

### Test count verification

```
ℹ tests 1281
ℹ suites 214
ℹ pass 1281
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

### Key infrastructure files (actual)

| Component | File | Notes |
|-----------|------|-------|
| Route wrapper | `src/utils/apiHandler.ts` | `apiHandler(handler)` wraps: `connectDB → rateLimit → handler → catch(500)` |
| Response helper | `src/utils/apiResponse.ts` | `sendResponse(data, message, errors)` → `{ success, message, data, errors, timestamp }` |
| Error class | `src/utils/AppError.ts` | `AppError(message, statusCode, errors[], isOperational)` + `handleMongoError(error)` → 409 for E11000 |
| Status codes | `src/constants/statusCodes.ts` | `OK=200, CREATED=201, NO_CONTENT=204, BAD_REQUEST=400, UNAUTHORIZED=401, FORBIDDEN=403, NOT_FOUND=404, CONFLICT=409, UNPROCESSABLE_ENTITY=422, TOO_MANY_REQUESTS=429, INTERNAL_SERVER_ERROR=500` |
| Error messages | `src/constants/errorMessages.ts` | Existing constants include `COURSE_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `SUBMISSION_NOT_FOUND`, `MODULE_NOT_FOUND`, `LESSON_NOT_FOUND`, `MATERIAL_NOT_FOUND`, `GRADE_NOT_FOUND`, `GRADE_EXISTS` — **NO `ATTENDANCE_*` messages** |
| ObjectId schema | `src/validations/objectId.ts` | `objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/)`, `paginationSchema`, `searchSchema` |
| Rate limiter | `src/utils/rateLimiter.ts` | `rate-limiter-flexible`, 100 req/60s/IP |
| Logger | `src/utils/logger.ts` | Winston, JSON + console format |
| CSRF (edge-safe) | `src/lib/csrf.ts` | `validateCsrf(req)`, `setCsrfCookie`, `CSRF_COOKIE_NAME="csrfToken"`, `CSRF_HEADER_NAME="x-csrf-token"` |
| JWT (server) | `src/lib/jwt.ts` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` — payload: `{ userId, role, type }` |
| JWT (edge) | `src/lib/edgeJwt.ts` | `verifyEdgeAccessToken(token)` via `jose` — same payload shape |
| DB connection | `src/lib/db.ts` | Mongoose cached singleton |
| Auth types | `src/types/auth.types.ts` | `JwtPayload { userId: string; role: string; type: 'access' | 'refresh' | 'reset' }` |
| User roles | `src/types/user.types.ts` | `UserRole { ADMIN, TEACHER, STUDENT, PARENT }` |
| Middleware | `src/middleware.ts` | CORS, auth (JWT via jose), role check, CSRF, `protectedRoutes` prefix matching |
| User sanitization | `src/lib/userSanitization.ts` | Strips `password`, `refreshToken`, `loginAttempts`, `lockUntil` |

### Protected routes (actual, from `src/middleware.ts:10`)

```typescript
const protectedRoutes = [
  "/api/auth/change-password",
  "/api/auth/profile",
  "/api/auth/logout",
  "/api/subjects",
  "/api/courses",
  "/api/classes",
  "/api/enrollments",
  "/api/assignments",
  "/api/submissions",
  "/api/grades",
];
```

**Note:** `/api/attendance` is NOT yet in `protectedRoutes` — it must be added when Phase 6 is implemented.

---

## 2. Phase Numbering Reconciliation (Actual vs. Capability Plan)

The master capability plan (`BACKEND_FEATURE_CAPABILITY_PLAN.md`) defines two phase numbering
systems that diverge from the actual repository implementation.

### Capability plan phase numbering (Section 18–22)

| Plan Phase | Plan Domain | Capability Plan Section 22 Label |
|------------|-------------|-------------------------------|
| 1 | User Management & Admin | Phase 1 — User Management & Admin Foundation |
| 2 | Academic Structure | Phase 2 — Academic Structure |
| 3 | Enrollment | Phase 3 — Enrollment |
| 4 | Assignments & Exams | Phase 4 — Assignments & Exams |
| 5 | Attendance | Phase 5 — Attendance |
| 6 | Grades & Results | Phase 6 — Grades & Results |
| 7 | Timetable | Phase 7 — Timetable |
| 8 | Announcements | Phase 8 — Announcements |
| 9 | Notifications | Phase 9 — Notifications |
| 10 | Analytics | Phase 10 — Analytics |

### Actual repository implementation (verified via git log + source inspection)

| Actual Phase | Actual Domain | Implementation commit |
|--------------|---------------|----------------------|
| 1 | Auth + Admin User Management | `c246c24` |
| 2 | Subjects, Courses, Classes | `b83920d`, `faf41a0`, `efdd97a` |
| 3 | Enrollments (+ Student-Parent) | `d75a1fa`, `7b42529` |
| 4A | Assignments | `0595df2` |
| 4B | Submissions | `13a417d` |
| 4C | Grades | `e32ef37` |
| 4D | Security Integration Audit | `6abb7aa` (docs only) |
| 4E | Production Readiness Audit | `7d5a26b` (docs only) |
| 5 | Course Materials (Modules/Lessons/Materials) | `60fd7b3` |
| **6** | **Attendance** | **NOT YET IMPLEMENTED** ← this plan |
| 7 | Timetable | NOT YET IMPLEMENTED |
| 8 | Announcements | NOT YET IMPLEMENTED |
| 9 | Notifications | NOT YET IMPLEMENTED |
| 10 | Analytics | NOT YET IMPLEMENTED |

### Reconciliation conclusion

The capability plan's Phase 5 was "Attendance," but the actual repository repurposed
Phase 5 as **Course Materials**. Grades was implemented early as Phase 4C rather than
Phase 6. This means the capability plan's phase-number-to-domain mapping has diverged.

**Phase 6 in this document refers to the attendance feature**, following the next
available number in the actual repository sequence. Attendance is the first unimplemented
functional domain that satisfies all dependencies (Class, Course, Enrollment are all complete).

---

## 3. Implemented Domains (Dependencies Satisfied)

All dependencies for Attendance are fully implemented.

### 3.1 Class domain — `src/models/class.model.ts`, `src/types/class.types.ts`

**VERIFIED fields and patterns:**

| Field | Type | Key details |
|-------|------|-------------|
| `name` | String | required, trim, max 200 |
| `code` | String | required, unique, uppercase, trim, max 30, indexed |
| `description` | String | optional, default null, max 1000 |
| `courseId` | ObjectId → Course | required, indexed |
| `teacherId` | ObjectId → User | required, indexed — the teacher who owns this class |
| `startDate` | Date | default null |
| `endDate` | Date | default null |
| `isActive` | Boolean | default true, indexed |
| Unique index | | `{ name: 1, teacherId: 1 }` — no duplicate class names per teacher |

**⚠️ CORRECTION from earlier draft:** The Class model does **NOT** have a `studentIds` field.
Student-class membership is tracked exclusively through the **Enrollment** domain
(`enrollment.studentId` + `enrollment.classId`). The capability plan's Section 5
incorrectly lists `studentIds` on Class — this is not present in the actual codebase.
Attendance must verify student enrollment via `enrollmentRepository.findByStudentAndClass`.

### 3.2 Course domain — `src/models/course.model.ts`, `src/types/course.types.ts`

**VERIFIED fields and patterns:**

| Field | Type | Key details |
|-------|------|-------------|
| `name` | String | required, trim, max 200 |
| `code` | String | required, unique, uppercase, trim, max 20 |
| `description` | String | optional, default null, max 1000 |
| `subjectId` | ObjectId → Subject | required, indexed |
| `teacherId` | ObjectId → User | required, indexed |
| `isActive` | Boolean | default true, indexed |

### 3.3 Enrollment domain — `src/models/enrollment.model.ts`, `src/types/enrollment.types.ts`

**VERIFIED fields and patterns:**

| Field | Type | Key details |
|-------|------|-------------|
| `studentId` | ObjectId → User | required, indexed |
| `classId` | ObjectId → Class | required, indexed |
| `courseId` | ObjectId → Course | required, indexed — derived from Class |
| `status` | Enum | `ACTIVE`, `DROPPED`, `COMPLETED` — default `ACTIVE` |
| `enrolledAt` | Date | default Date.now |
| `isActive` | Boolean | default true, indexed |
| Unique index | | `{ studentId: 1, classId: 1 }`, unique, partialFilter `isActive: true` |

Repository helper: `enrollmentRepository.findByStudentAndClass(studentId, classId)` —
used by Grade, Submission, and Assignment services to verify student-class membership.

### 3.4 Existing ownership and RBAC conventions (VERIFIED)

From inspecting `src/services/grade.service.ts:64-80`, `src/services/submission.service.ts:58-70`,
and `src/services/assignment.service.ts:64-98`:

- **`verifyAuthorized(currentUserId)`** — pattern used by ALL services. Looks up user via
  `userRepository.findByIdSafe`, checks existence (401 if not found) and `isActive` (403 if inactive),
  returns `{ id: user._id.toString(), role: user.role }`.
- **TEACHER ownership of Class** — verified via `class.teacherId === requestorId`
  (see `assignment.service.ts:88-98`, `submission.service.ts:108-121`). The ownership chain
  is Class → Course → `course.teacherId` for Grade (see `grade.service.ts:106-116`),
  but for Class-owned resources it's directly `class.teacherId` (see `assignment.service.ts:88-98`,
  `submission.service.ts:108-121`).
- **ADMIN bypasses ownership checks** — ADMIN can access/modify any resource (see `grade.service.ts:354-377`).
- **STUDENT/PARENT read scoping** — STUDENT filtered to `studentId: requestorId`; PARENT filtered
  to children via `userRepository.findStudentsByParentId(requestorId)` (see `grade.service.ts:210-223`,
  `submission.service.ts:188-197`).
- **IDOR masking** — all cross-tenant access returns 404 (not 403) using `ERROR_MESSAGES.*_NOT_FOUND`
  (see `grade.service.ts:324-349`, `submission.service.ts:288-312`).
- **`isActive` soft-delete** — list queries filter `{ isActive: true }`; get-by-id returns 404
  if `!grade.isActive`; delete sets `isActive = false` idempotently (see `grade.service.ts:319`,
  `grade.service.ts:619-621`).
- **11000 duplicate key interception** — service layer catches `code === 11000` and returns 409
  (see `grade.service.ts:416-438`, `grade.service.ts:515-526`, `grade.service.ts:585-596`).
- **Two-phase get helpers** — `getForUpdate` checks `isActive` → 404; `getForDelete` does NOT
  check `isActive` (for idempotent delete) (see `grade.service.ts:138-156`).

### 3.5 Existing model field conventions (VERIFIED)

| Pattern | Models using it | Classification |
|---------|----------------|----------------|
| `createdBy` (ObjectId → User) | Assignment, Module, Lesson, Material, Subject | Ownership/creator field |
| `teacherId` (ObjectId → User) | Class, Course | Resource owner field |
| `gradedBy` (ObjectId → User) | Grade | Actor who performed the action |
| `classId` + `courseId` on same model | Assignment, Submission, Grade, Enrollment | Cross-reference pattern |
| `isActive` soft-delete | ALL models | Universal pattern |
| `timestamps: true, versionKey: false` | ALL models | Mongoose options pattern |
| Enum via `Object.values(EnumType)` | ALL models with enums | Enum pattern |
| `select: false` on password fields | User model | Sensitive field pattern |

### 3.6 API route conventions (VERIFIED)

From `src/app/api/grades/route.ts` and `src/app/api/grades/[id]/route.ts`:

- **Flat route structure**: All domains use flat routes (`/api/grades`, `/api/grades/[id]`),
  NOT nested under parents.
- **Route exports**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` exported as named consts,
  each wrapped in `apiHandler()`.
- **Param extraction**: `extractValidatedId(args)` pattern — parses `args[0].params` with Zod.
- **Controller delegation**: Route handler calls `controller.method(req, ...)` → returns `NextResponse.json(...)`.
- **Error handling**: Controller's `handleError()` catches ZodError (400), `handleMongoError` (409),
  AppError (statusCode), fallback (500).

### 3.7 PUT vs PATCH semantics (VERIFIED)

From `src/services/grade.service.ts`:
- **PUT (`update`)**: Full replacement — requires ALL fields from the update schema,
  sets `gradedBy` and `gradedAt` server-side, checks for duplicate before creating.
- **PATCH (`patchGrade`)**: Partial update — only updates provided fields, `gradedBy`
  and `gradedAt` always set server-side, empty patch returns same record (idempotent).

### 3.8 Validation schema conventions (VERIFIED)

From `src/validations/grade.validation.ts` and `src/validations/objectId.ts`:

- **`objectIdSchema`**: `z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID")` — used for all ID params.
- **`paginationSchema`**: `page` (coerce.number, int, min 1, default 1), `limit` (coerce.number, int, min 1, max 100, default 20).
- **`searchSchema`**: `z.string().trim().min(1).max(100).optional()`.
- **All schemas use `.strict()`** — rejects unknown fields (mass-assignment protection).
- **Server-controlled fields excluded from body**: `teacherId`, `createdBy`, `courseId`,
  `isActive`, `gradedBy`, `gradedAt`, etc. are NOT in validation schemas and are rejected
  if supplied (verified in `assignment.validation.test.ts` and `submission.validation.test.ts`).
- **`isActive` preprocessing**: String `"true"`/`"false"` coerced to boolean via `z.preprocess`
  (see `grade.validation.ts:42-52`).
- **List schemas use `.strict()`** — reject unknown query params (see `grade.validation.ts:54`).

### 3.9 Test infrastructure conventions (VERIFIED)

| Aspect | Convention | Source |
|--------|-----------|--------|
| Test runner | `tsx -r dotenv.config --test` | `package.json` |
| Framework | `node:test` + `node:assert` | All test files |
| Mocking | Direct mock of repository methods (not a framework) | `module.service.test.ts:87-100` |
| Service test IDs | 24-char hex strings (not real ObjectIds) | `grade.service.test.ts:20-41` |
| Mock users | 6 roles: teacher, otherTeacher, adminId, student, parent, etc. | `grade.service.test.ts:20-29` |
| Mock data | `Partial<ISubject>[]`, `Partial<IClass>[]`, etc. | `module.service.test.ts:40-82` |
| Test counts (service) | 26–80 tests per file | Verified via `it(` count |
| Test counts (validation) | 42–75 tests per file | Verified via `it(` count |
| Test counts (middleware security) | 28–36 tests per file | Verified via `it(` count |
| Middleware test pattern | `describe`/`it` with `assert.equal(response.status, ...)` | `phase5.middleware.security.test.ts` |

### 3.10 Parent-child relationship (VERIFIED)

From `src/models/user.model.ts:100-103` and `src/repositories/user.repository.ts:22-28`:

- `User.parentIds: Types.ObjectId[]` — array of parent user IDs (on STUDENT users)
- `userRepository.findStudentsByParentId(parentId)` — finds students where
  `parentIds` contains the parent's ID
- This is the **sole** mechanism for parent-child visibility. No `studentIds` on User,
  no join table — only `parentIds` on the student document.

---

## 4. Attendance Domain Design

### 4.1 Goal

Enable teachers to record class attendance for a given session/date, mark each
student as present/absent/late/excused, and allow students/parents to view their
attendance history. Depends on Class, Course, and Enrollment — all complete.

### 4.2 Model: `Attendance`

**File:** `src/models/attendance.model.ts` (NEW)
**Types file:** `src/types/attendance.types.ts` (NEW)

#### 4.2.1 Final model design

```typescript
export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export interface IAttendanceRecord {
  _id?: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  note?: string | null;
}

export interface IAttendance extends Document {
  classId: Types.ObjectId;
  courseId: Types.ObjectId;
  date: Date;
  teacherId: Types.ObjectId;
  records: IAttendanceRecord[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Design Decisions (Resolved)

#### Decision 1: Subdocument array vs. flat records — **DECIDED: subdocument array**

**Classification:** Phase 6 design decision (no existing model uses Mongoose subdocuments).

**Analysis:**
- No existing Mongoose model in the repository uses typed subdocument arrays. `User.parentIds`
  is `ObjectId[]`, `Assignment.attachments` is `string[]`, `User.permissions` is `string[]`.
- However, Attendance is conceptually a **roll call** — one session, one date, one class,
  with multiple students. Storing each student as a separate flat document would require
  either a composite unique index on `(classId, date, studentId)` (to prevent duplicates)
  or application-level coordination, and would fragment the "session" concept across
  multiple documents.
- The subdocument array pattern (`records: IAttendanceRecord[]`) correctly models the
  real-world domain: a single attendance event containing all students in a class on a date.
- MongoDB 4.2+ supports indexing into subdocument arrays: `"records.studentId": 1` is
  a valid index path and enables efficient per-student queries.
- The `{ classId: 1, date: 1 }` unique compound index enforces "one attendance per class
  per date" at the database level, which is simpler than per-student uniqueness constraints.

**Chosen approach:** `Attendance` document with `records: IAttendanceRecord[]` subdocument array.

#### Decision 2: `teacherId` vs `createdBy` — **DECIDED: `teacherId` only**

**Classification:** Phase 6 design decision.

**Analysis:**
- Grade uses `gradedBy` (the actor who performed the grading action).
- Assignment uses `createdBy` (the creator of the resource).
- Class and Course use `teacherId` (the owner/teacher of the resource).
- Attendance is a Class-owned resource, just like Assignment is a Class-owned resource.
  Assignment uses `createdBy` (which IS the teacher's ID when created via JWT).
- However, Class and Course use `teacherId` directly, and the ownership verification
  pattern for TEACHER checks `class.teacherId === requestorId` (not `assignment.createdBy`).
- For Attendance, `teacherId` is the most semantically correct field: it's the teacher
  who recorded the attendance for this class. This matches Class/Course conventions.
- `createdBy` would be semantically redundant with `teacherId` for this domain.

**Chosen approach:** Use `teacherId` only (set from JWT `userId` at creation). Omit `createdBy`.

#### Decision 3: Date semantics — **DECIDED: calendar-day Date, normalized to midnight UTC**

**Classification:** Phase 6 design decision (no existing model has a calendar-day field).

**Analysis:**
- All existing Date fields in the repository (`dueDate`, `enrolledAt`, `gradedAt`,
  `startDate`, `endDate`, `publishedAt`) are full timestamps.
- Attendance `date` represents "which day was attendance taken" — a calendar date,
  not a precise instant. Storing a full timestamp would make date-range queries fragile
  (timezone issues, "same day" comparisons).
- Decision: store as `Date` type, normalized to midnight UTC (`00:00:00.000Z`).
- Validation: server-side normalization in the service layer — parse input date string,
  create a `Date` with time set to `00:00:00.000Z` (UTC). Reject dates in the future.

**Chosen approach:** `Date` type, normalized to `00:00:00.000Z` UTC in service layer.
Future-date validation enforced at service level.

#### Decision 4: `note` field — **DECIDED: keep**, max 500 chars, nullable

**Classification:** Phase 6 design decision (new field type not present on subdocuments).

**Analysis:** The existing text fields follow patterns: `feedback` on Grade is `max 2000`,
`description` on Module/Lesson/Material is `max 1000`/`2000`. A `note` field for individual
student attendance records is a small text annotation. Max 500 chars is reasonable.

#### Decision 5: Unique index on `(classId, date)` — **DECIDED: use unique compound index**

**Classification:** Phase 6 design decision (pattern is supported but not used on this index shape).

**Analysis:** Grade uses `{ studentId: 1, assignmentId: 1 }` unique partial index to enforce
one grade per student per assignment. Attendance should use `{ classId: 1, date: 1 }` unique
index to enforce one attendance per class per date. This is a supported MongoDB pattern.

#### Decision 6: `courseId` denormalization — **DECIDED: denormalized, matching existing pattern**

**Classification:** VERIFIED — Grade, Assignment, and Submission all store `courseId`
explicitly on the model (denormalized from Class).

**Analysis:** Although `Class` already has `courseId`, all child models in the existing
codebase (Grade, Assignment, Submission, Enrollment) denormalize `courseId` onto
themselves. This avoids extra lookups when filtering by course. Following the established
convention.

#### Decision 7: Student enrollment verification — **DECIDED: use Enrollment**

**Classification:** VERIFIED — `enrollmentRepository.findByStudentAndClass` is the
established pattern (used by Grade, Submission, Assignment services).

**Analysis:** The Class model does NOT have a `studentIds` field. Student-class membership
is tracked exclusively via the Enrollment domain. Attendance must verify each student
in `records` is enrolled in the target class via `enrollmentRepository.findByStudentAndClass`.

### 4.4 Finalized API Endpoints (9 total)

| # | Method | Endpoint | Purpose | Scope |
|---|--------|----------|---------|-------|
| 1 | GET | `/api/attendance` | List/filter attendance records | **REQUIRED** |
| 2 | POST | `/api/attendance` | Create attendance for a class on a date | **REQUIRED** |
| 3 | GET | `/api/attendance/:id` | Get a specific attendance record | **REQUIRED** |
| 4 | PUT | `/api/attendance/:id` | Replace an attendance record | **REQUIRED** |
| 5 | PATCH | `/api/attendance/:id` | Partial update | **REQUIRED** |
| 6 | DELETE | `/api/attendance/:id` | Soft-delete attendance record | **REQUIRED** |
| 7 | GET | `/api/attendance/class/:classId` | List attendance for a class | **REQUIRED** |
| 8 | GET | `/api/attendance/student/:studentId` | List attendance for a student | **PROPOSED** |
| 9 | GET | `/api/attendance/class/:classId/stats` | Attendance statistics for a class | **PROPOSED** |

**Endpoint scope:**
- **REQUIRED (6 endpoints)**: Core CRUD + class-scoped listing. These establish the
  fundamental attendance workflow: teachers record and manage attendance, students/parents
  see class attendance.
- **PROPOSED (3 endpoints)**: Student-scoped listing (#8) and statistics (#9) are
  enhancements. If implementation scope is constrained, these can be deferred to
  a Phase 6 follow-up. However, the student-scoped endpoint (#8) is needed for
  STUDENT/PARENT RBAC on the `getById` flow — without it, students cannot see their
  own attendance history. **Recommendation: implement all 9.**

### 4.5 Validation Rules (Final)

```typescript
// createAttendanceSchema — .strict()
{
  classId: objectIdSchema,                    // from path param, not body
  date: z.coerce.date(),                       // normalized by service
  records: z.array(z.object({
    studentId: objectIdSchema,
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    note: z.string().trim().max(500).nullable().optional()
  })).min(1)
}

// updateAttendanceSchema (PUT) — .strict()
{
  date: z.coerce.date(),
  records: z.array(z.object({...})).min(1)
}

// patchAttendanceSchema (PATCH) — .strict()
{
  date?: z.coerce.date(),
  records?: z.array(z.object({...}))
}

// attendanceListSchema — .strict()
{
  ...paginationSchema,
  classId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  date: z.string().optional(),                 // ISO date string
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "ALL"]).optional(),
  isActive: z.preprocess(...)                  // string "true"/"false" → boolean
}
```

**Server-controlled fields (excluded from all body schemas, rejected if supplied):**
- `courseId` — derived from `Class.courseId`
- `teacherId` — set from JWT `userId`
- `isActive` — soft-delete via DELETE endpoint only

### 4.6 Error Messages to Add

```typescript
// src/constants/errorMessages.ts
ATTENDANCE_NOT_FOUND: 'Attendance record not found.',
ATTENDANCE_EXISTS: 'Attendance for this class on this date already exists.',
ATTENDANCE_EMPTY_RECORDS: 'At least one student record is required.',
ATTENDANCE_INVALID_DATE: 'Attendance date cannot be in the future.',
ATTENDANCE_STUDENT_NOT_ENROLLED: 'Student is not enrolled in this class.',
```

### 4.7 Middleware / Protected Routes

Add `/api/attendance` to `protectedRoutes` in `src/middleware.ts`:

```typescript
const protectedRoutes = [
  // ... existing ...
  "/api/attendance",  // ← Phase 6
];
```

Prefix matching (`pathname === route || pathname.startsWith(`${route}/`)`) covers all
`/api/attendance/*` paths. No other middleware changes needed.

### 4.8 Service Layer Design (Final)

New file: `src/services/attendance.service.ts`

**Ownership helpers (following existing patterns):**
- `verifyAuthorized(currentUserId)` — VERIFIED from every service (`grade.service.ts:68-80`)
- `verifyClass(classId)` — VERIFIED from `assignment.service.ts:78-86`
- `verifyTeacherOwnsClass(classId, requestorId, role)` — VERIFIED from `assignment.service.ts:88-98`
  and `submission.service.ts:108-121`. Checks `class.teacherId === requestorId` for TEACHER.
- `verifyStudentEnrolledInClass(studentId, classId, courseId)` — VERIFIED from
  `grade.service.ts:118-125` and `submission.service.ts:124-131`
- `isChildOfParent(parentId, studentId)` — VERIFIED from `grade.service.ts:127-136`
  (uses `userRepository.findStudentsByParentId`)

**Service methods:**
1. `createAttendance(data, currentUserId)` — verifies class ownership, validates all
   students enrolled, checks duplicate (`{ classId, date }`), sets `teacherId` from JWT
2. `getAttendanceById(id, currentUserId)` — TEACHER: own class; STUDENT: own record in
   `records[].studentId`; PARENT: child in `records[].studentId`
3. `updateAttendance(id, data, currentUserId)` (PUT) — VERIFIED full-replacement pattern
   from `grade.service.ts:441-527`
4. `patchAttendance(id, data, currentUserId)` (PATCH) — VERIFIED partial-update pattern
   from `grade.service.ts:529-597`
5. `deleteAttendance(id, currentUserId)` (soft-delete) — VERIFIED pattern from
   `grade.service.ts:599-634`, uses `getForDelete` (no `isActive` check)
6. `listAttendances(query, currentUserId)` — VERIFIED pagination/filter pattern from
   `grade.service.ts:195-312`

### 4.9 Repository Layer Design (Final)

New file: `src/repositories/attendance.repository.ts`

Following the existing repository pattern (`grade.repository.ts`):

```
create(data)
findById(id)
findByClassAndDate(classId, date)  // for duplicate check
findByStudent(studentId, options)  // for student-scoped listing
findAllPaginated(filter, page, limit, sortBy, sortOrder)
update(id, data)
patch(id, data)
softDelete(id)
exists(filter)
totalCount(filter)
```

### 4.10 Controller Layer Design (Final)

New file: `src/controllers/attendance.controller.ts`

Methods: `list`, `getById`, `create`, `update` (PUT), `patch`, `remove`, `listByClass`,
`listByStudent`, `getStats`.

Each method follows the controller pattern from `grade.controller.ts:118-144`:
1. Parse body/query with Zod schema (`.strict()`)
2. Extract `x-user-id` from headers
3. Call Service method
4. Format response with `sendResponse()`
5. Handle errors: ZodError → 400, AppError → statusCode, mongoError → 409, fallback → 500

### 4.11 Route Structure (Final)

```
src/app/api/attendance/
├── route.ts                    — GET (list), POST (create)
├── [id]/
│   └── route.ts                — GET, PUT, PATCH, DELETE
├── class/
│   ├── [classId]/
│   │   └── route.ts           — GET (class-scoped list)
│   │   └── stats/
│   │       └── route.ts       — GET (statistics)
│   └── [studentId]/
│       └── route.ts           — GET (student-scoped list)
```

### 4.12 Types

New file: `src/types/attendance.types.ts`

```typescript
export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export interface IAttendanceRecord {
  _id?: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  note?: string | null;
}

export interface IAttendance extends Document {
  classId: Types.ObjectId;
  courseId: Types.ObjectId;
  date: Date;
  teacherId: Types.ObjectId;
  records: IAttendanceRecord[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceResponse {
  id: string;
  classId: string;
  courseId: string;
  date: Date;
  teacherId: string;
  records: IAttendanceRecord[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. RBAC Summary

### 5.1 Current RBAC (VERIFIED from `src/middleware.ts:10-11`)

| Role | Admin Route Access | Feature Route Access |
|------|-------------------|---------------------|
| ADMIN | Full (`/api/admin/*`) | Full (all feature endpoints) |
| TEACHER | No (403) | Read all; create/update/delete own |
| STUDENT | No (403) | Read (enrolled classes/courses only) |
| PARENT | No (403) | Read (children's classes/courses only) |

### 5.2 Attendance RBAC (Following existing patterns)

Same role-based pattern as existing domains. ADMIN has full access. TEACHER access is
scoped to classes where `class.teacherId === requestorId`. STUDENT/PARENT have read-only
access scoped to their own attendance records (or their children's).

| Role | Create | Read (own class) | Read (other classes) | Read (own student) | Update | Delete |
|------|--------|-------------------|----------------------|---------------------|------------------------|--------|--------|--------|
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes (soft) |
| TEACHER | Yes (own classes) | Yes | No (404) | Yes | Yes (own class) | Yes (own class) |
| STUDENT | No (403) | Yes (enrolled class) | No (403/404) | Yes (own) | No (403) | No (403) |
| PARENT | No (403) | Yes (children's classes) | No (403/404) | Yes (children) | No (403) | No (403) |

### 5.3 Permission model

**VERIFIED**: Role-based only. `permissions: string[]` field exists on User but is unused.
No permission-code system. This is the established convention.

---

## 6. Testing Strategy

### 6.1 Service tests (new)

**File:** `src/services/__tests__/attendance.service.test.ts`

Following the existing service test pattern (`grade.service.test.ts`):
- Mock repository methods directly (not a mocking framework)
- `node:test` + `node:assert`
- 6 mock roles: teacher, otherTeacher, adminId, student, parent, etc.
- 24-char hex string IDs

| Test Group | Estimated Tests |
|------------|-----------------|
| `createAttendance` | 8-10 |
| `getAttendanceById` | 6-8 |
| `updateAttendance (PUT)` | 4-5 |
| `patchAttendance (PATCH)` | 3-4 |
| `deleteAttendance (soft-delete)` | 5-6 |
| `listAttendances` | 5-6 |
| **Total** | **~31-39** |

### 6.2 Validation tests (new)

**File:** `src/validations/__tests__/attendance.validation.test.ts`

Following the existing validation test pattern (`grade.validation.test.ts`):

| Schema | Estimated Tests |
|--------|-----------------|
| `attendanceIdParamSchema` | 3 |
| `classIdParamSchema` | 3 |
| `studentIdParamSchema` | 3 |
| `createAttendanceSchema` | 12-15 |
| `patchAttendanceSchema` | 5-7 |
| `attendanceListSchema` | 12-15 |
| **Total** | **~35-43** |

### 6.3 Middleware security tests (new)

**File:** `src/__tests__/phase6.middleware.security.test.ts`

Following the existing pattern (`phase5.middleware.security.test.ts`):

1. Route protection: all `/api/attendance/*` paths require auth (401 without token)
2. CSRF protection: POST/PUT/PATCH/DELETE require CSRF token; GET does not
3. CORS: allowed origin gets headers; disallowed origin does not
4. Token validation: invalid/expired/forged tokens → 401

| Test Group | Estimated Tests |
|------------|-----------------|
| Route protection | 12 (6 endpoint patterns × 2 for param/non-param) |
| CSRF | 4-6 |
| CORS | 3-4 |
| Token validation | 4-5 |
| **Total** | **~23-29** |

### 6.4 Test count projection

| Test file | Estimated tests |
|-----------|-----------------|
| `attendance.service.test.ts` | ~31-39 |
| `attendance.validation.test.ts` | ~35-43 |
| `phase6.middleware.security.test.ts` | ~23-29 |
| **Total Phase 6 new tests** | **~89-111** |
| **Post-Phase 6 total** | **~1370-1392** |

---

## 7. Implementation Sequence (Recommended)

1. **Models & Types**: `src/models/attendance.model.ts`, `src/types/attendance.types.ts`
2. **Constants**: Add `ATTENDANCE_*` messages to `src/constants/errorMessages.ts`
3. **Repository**: `src/repositories/attendance.repository.ts`
4. **Service**: `src/services/attendance.service.ts` + ownership helpers
5. **Validation**: `src/validations/attendance.validation.ts`
6. **Controller**: `src/controllers/attendance.controller.ts`
7. **Routes**: `src/app/api/attendance/.../route.ts` (all 9 endpoints)
8. **Middleware**: Add `/api/attendance` to `protectedRoutes` in `src/middleware.ts`
9. **Tests**: Service tests → Validation tests → Middleware security tests
10. **Quality gates**: `tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`

---

## 8. Exit Criteria

| Criterion | Requirement |
|-----------|-------------|
| Model created | `Attendance` model with `AttendanceStatus` enum, indexes, soft-delete |
| Types created | `IAttendance`, `IAttendanceRecord`, `AttendanceStatus` enum, `AttendanceResponse` |
| API endpoints | All 9 endpoints return correct responses with proper RBAC |
| RBAC enforced | ADMIN full; TEACHER own class only; STUDENT/PARENT scoped read |
| IDOR protection | Cross-tenant access returns 404 (not 403) |
| Soft-delete | `DELETE` sets `isActive = false`, idempotent, list/get filter active |
| Input validation | All POST/PUT/PATCH bodies validated with Zod `.strict()`; no mass-assignment |
| Ownership chain | `Attendance.classId` → `Class.teacherId` verified for TEACHER mutations |
| Duplicate prevention | One attendance per class+date enforced via unique index + service check |
| Student enrollment check | Records can only be created for enrolled students (via Enrollment) |
| Date normalization | Attendance date stored as midnight UTC; future dates rejected |
| Error messages | `ATTENDANCE_*` constants added to `errorMessages.ts` |
| Test coverage | Service tests, Validation tests, Middleware security tests all pass |
| TypeScript | `tsc --noEmit` passes with 0 errors |
| ESLint | 0 errors |
| Build | `npm run build` compiles successfully |
