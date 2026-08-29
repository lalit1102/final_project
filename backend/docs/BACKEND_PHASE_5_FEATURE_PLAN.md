# Phase 5 — Backend Feature Plan: Course Materials / Modules / Lessons

## 1. Executive Summary

This document is a planning-only artifact. No production backend code has been
created, modified, or deleted for Phase 5. All conclusions are derived from
inspection of the actual backend source tree at
`E:\final_project/backend` as of 2026-08-29.

Phase 4E hardened the existing backend (handleMongoError fix, request body
size limits, request tracing/logging, env validation, account lockout
confirmation). Phase 5 introduces a new content domain: **Course Materials /
Modules / Lessons**.

The proposed architecture extends the existing Course entity with a
three-level hierarchy: **Module** (belongs to Course) → **Lesson**
(belongs to Module) → **Material** (belongs to Lesson, represents
content). This design is chosen because:

- The existing Course model has no content fields — content is a separate
  concern from course metadata (name, code, description, subject, teacher).
- Lessons naturally group under modules, and modules naturally group under
  courses — this matches how instructors structure educational content.
- Materials should be a separate entity to support multiple content types
  (text, image, video, file, link) within a single lesson, each with its own
  metadata (title, type, URL, order).
- Keeping Materials separate from Lessons avoids a single Lesson model with
  a polymorphic `content` field that would be difficult to validate and
  extend.

All existing patterns (apiHandler, Controller → Service → Repository → Model,
Zod `.strict()`, soft-delete with `isActive`, 404-masking IDOR protection,
RBAC with 404-not-403 for cross-tenant access, duplicate-key handling via
`handleMongoError`) will be preserved.

---

## 2. Current Backend Capability Audit

### 2.1 Technology Stack

| Layer              | Technology                          |
|--------------------|--------------------------------------|
| Framework          | Next.js 16.2.11 (App Router)          |
| Runtime            | Node.js 24.x / Edge Runtime (middleware) |
| Language           | TypeScript 5                        |
| Database           | MongoDB (Mongoose 9.8.0)             |
| JWT (server-side)  | `jsonwebtoken` 9.0.3                |
| JWT (edge verify)  | `jose` 6.2.6                        |
| Password hashing   | `bcryptjs` 3.0.3 (12 rounds)          |
| Validation         | `zod` 4.4.3                         |
| Logging            | `winston` 3.19.0                    |
| Rate limiting      | `rate-limiter-flexible` 11.2.0      |
| Email (stub)       | `EmailService` (logger stub)         |
| Google Auth        | `google-auth-library` 11.0.0         |

### 2.2 Folder Structure (Source of Truth)

```
backend/src/
├── app/
│   └── api/
│       └── auth/          # register, login, refresh, logout, profile, change-password,
│                          # forgot-password, reset-password, google
│       └── subjects/      # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── courses/       # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── classes/       # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── enrollments/   # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── assignments/   # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── submissions/   # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── grades/        # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── admin/
│           └── users/     # [id]/ route.ts, [id]/status/route.ts — GET, POST, PUT, PATCH
├── config/
│   └── env.ts             # Validates MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
├── constants/
│   ├── errorMessages.ts   # All error message constants
│   └── statusCodes.ts     # HTTP status codes (200, 201, 400, 401, 403, 404, 409, 413, 429, 500)
├── controllers/
│   ├── auth.controller.ts, subject.controller.ts, course.controller.ts,
│   │   class.controller.ts, enrollment.controller.ts, assignment.controller.ts,
│   │   submission.controller.ts, grade.controller.ts, admin.controller.ts
├── interfaces/
│   └── response.interface.ts  # ApiResponse<T> shape
├── lib/
│   ├── db.ts              # connectDB() — cached mongoose connection
│   ├── edgeJwt.ts         # JWT verification (jose, edge-compatible)
│   ├── jwt.ts             # JWT generation/verification (jsonwebtoken, server-side)
│   ├── password.ts        # bcryptjs hash/compare
│   ├── csrf.ts            # Edge-safe CSRF validation (double-submit pattern)
│   ├── csrf.server.ts     # Server-side CSRF token generation (node:crypto)
│   └── userSanitization.ts # Strips password, refreshToken, loginAttempts, lockUntil
├── middleware.ts          # CORS, auth (JWT via jose), role check, CSRF, protectedRoutes
├── models/                # Mongoose schemas: user, subject, course, class, enrollment,
│                          #   assignment, submission, grade
├── repositories/          # Mongoose repository classes for each model
├── services/              # Business logic: auth, subject, course, class, enrollment,
│                          #   assignment, submission, grade, admin, email
├── types/                 # TypeScript interfaces: user, subject, course, class,
│                          #   enrollment, assignment, submission, grade, auth
├── utils/
│   ├── apiHandler.ts      # Wrapper: connectDB + rateLimit + request tracing/logging
│   ├── apiResponse.ts     # sendResponse() — standard { success, message, data, errors, timestamp }
│   ├── AppError.ts        # AppError class + handleMongoError() — 409 for duplicate keys
│   ├── logger.ts          # Winston JSON logger
│   └── rateLimiter.ts     # rate-limiter-flexible (Redis in prod, memory in dev)
└── validations/           # Zod schemas: auth, subject, course, class, enrollment,
                            #   assignment, submission, grade, admin, objectId
```

### 2.3 Existing Domain Entities

#### Users (`src/models/user.model.ts`)
- **Fields:** name, email (unique), password (select:false), provider (LOCAL|GOOGLE), providerId, avatar, role (ADMIN|TEACHER|STUDENT|PARENT, default STUDENT), permissions (unused[]), isActive (true), isVerified (false), refreshToken (select:false), lastLogin, loginAttempts, lockUntil, passwordChangedAt, studentId (unique sparse), parentIds
- **Indexes:** email, providerId, refreshToken
- **Account lockout:** MAX_LOGIN_ATTEMPTS=5, LOCK_TIME_MS=15min (in auth.service.ts)
- **Repository:** findById, findByIdSafe, findByIds, findByEmail, findStudentsByParentId, create, update, updateLastLogin, softDelete, exists, findAllPaginated, incrementLoginAttempts

#### Subjects (`src/models/subject.model.ts`)
- **Fields:** name (200 max), code (20 max, unique, uppercase), description (1000 max), teacherId (ref User), isActive (true)
- **Indexes:** { name, teacherId: 1 } unique
- **RBAC:** TEACHER/ADMIN only; teacher ownership enforced (404 on cross-teacher access)
- **Soft-delete:** isActive pattern

#### Courses (`src/models/course.model.ts`)
- **Fields:** name (200 max), code (20 max, unique, uppercase), description (1000 max), subjectId (ref Subject), teacherId (ref User), isActive (true)
- **Indexes:** { code: 1 } unique, { subjectId: 1 }
- **RBAC:** TEACHER/ADMIN only; teacher ownership enforced; ADMIN can assign to any teacher
- **Soft-delete:** isActive pattern
- **Relationships:** belongs to Subject (teacher must own the subject); Class has courseId FK
- **Missing:** No content/material fields; no publishedAt; no lifecycle/status enum

#### Classes (`src/models/class.model.ts`)
- **Fields:** name (200 max), code (30 max, unique, uppercase), description (1000 max), courseId (ref Course), teacherId (ref User), startDate, endDate, isActive (true)
- **RBAC:** TEACHER/ADMIN only; teacher ownership via course ownership
- **Soft-delete:** isActive pattern

#### Enrollments (`src/models/enrollment.model.ts`)
- **Fields:** studentId, classId, courseId, status (ACTIVE|DROPPED|COMPLETED, default ACTIVE), enrolledAt, isActive (true)
- **Indexes:** { studentId, classId: 1 } unique (partial, isActive:true)
- **RBAC:** ADMIN/TEACHER for create/manage; STUDENT/PARENT for read of own data

#### Assignments (`src/models/assignment.model.ts`)
- **Fields:** title (200 max), description (5000 max), classId, courseId, dueDate, maxPoints (min 0), status (DRAFT|PUBLISHED|ARCHIVED, default DRAFT), allowLateSubmissions, latePenaltyPercent (0-100), submissionType (FILE|TEXT|LINK|NONE), attachments [], createdBy, publishedAt, isActive (true)
- **RBAC:** TEACHER/ADMIN for create/update/delete; STUDENT/PARENT for read of published assignments
- **Lifecycle:** DRAFT → PUBLISHED (via status change / publishedAt set)
- **Soft-delete:** isActive pattern

#### Submissions (`src/models/submission.model.ts`)
- **Fields:** assignmentId, studentId, classId, content (50000 max), attachments [], submittedAt, status (DRAFT|SUBMITTED|LATE|MISSING, default DRAFT), isLate, gradedAt, isActive (true)
- **RBAC:** STUDENT for own submissions; TEACHER/ADMIN for any
- **Lifecycle:** DRAFT → SUBMITTED
- **Soft-delete:** isActive pattern

#### Grades (`src/models/grade.model.ts`)
- **Fields:** studentId, assignmentId, submissionId (nullable), classId, points (min 0), maxPoints (min 0, snapshotted from assignment), percentage, feedback (2000 max), gradedBy, gradedAt, isActive (true)
- **RBAC:** TEACHER/ADMIN for create/update/delete; STUDENT can read own; PARENT can read own children's
- **Soft-delete:** isActive pattern; deletion clears Submission.gradedAt

### 2.4 Existing Patterns (Verified Against Source)

**API Route → Controller → Service → Repository → Model:**
Every API route is wrapped in `apiHandler()` (connectDB + rateLimit + request tracing).
Routes delegate to Controller methods. Controllers:
1. Parse body with Zod schema (`.strict()`)
2. Extract `x-user-id` from headers (set by middleware)
3. Call Service method
4. Format response with `sendResponse()`
5. Handle errors: ZodError → 400, AppError → statusCode, mongoError → 409, fallback → 500

**RBAC:**
- Middleware (`src/middleware.ts`) protects routes based on `protectedRoutes` and `adminRoutes`
- Role enforcement in service: `verifyTeacher()` or `verifyAuthorized()` checks UserRole
- TEACHER and ADMIN share create/update/delete access; STUDENT and PARENT are generally read-only
- Cross-tenant access returns 404 (not 403) — IDOR masking
- ADMIN can specify `teacherId` to create on behalf of another teacher; TEACHER cannot

**Soft-delete:**
- All entities have `isActive: boolean` (default true, indexed)
- List queries filter `{ isActive: true }` by default
- Get-by-id checks `!course.isActive` → 404
- Delete is idempotent: if already inactive, returns the record as-is
- No hard deletes anywhere

**Zod Validation:**
- All schemas use `.strict()` to reject unknown fields
- ObjectId validated via `objectIdSchema` (regex: `/^[0-9a-fA-F]{24}$/`)
- Pagination: `page` (min 1, default 1), `limit` (1-100, default 20)
- Search: string, trimmed, min 1, max 100

**Error Handling:**
- `handleMongoError(error, duplicateMessage?)` → 409 for E11000 duplicate keys
- `AppError` class carries statusCode, errors[], isOperational
- Controllers have `handleError()` method: ZodError → 400, mongoError → 409, AppError → statusCode, fallback → 500

**CSRF:**
- Double-submit cookie pattern: `csrfToken` cookie (non-httpOnly) + `x-csrf-token` header
- Validated in middleware for POST/PUT/PATCH/DELETE on protected routes
- Generated server-side via `crypto.randomBytes(32)` (base64url)

**CORS:**
- Reflects `FRONTEND_ORIGIN` env var as `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials: true`
- Unauthorized origins get no CORS headers

### 2.3 Current Content/Material State

**No course materials, modules, or lessons exist in the current backend.**
Grep for "material", "lesson", and "module" (excluding "module" in the JS/JSX sense
like `import`/`export module`) found zero domain references. The only "content" field
is in submissions (`ISubmission.content: string | null`, max 50000 chars).

**Course model gaps for content hosting:**
- No `publishedAt` field (assignments have it, courses do not)
- No `status` enum on Course (has DRAFT/PUBLISHED on Assignment)
- No child collections or references to materials/lessons/modules
- Course is purely metadata: name, code, description, subject, teacher

---

## 3. Existing Course Capability

### 3.1 What Exists

| Aspect | Status | Details |
|--------|--------|---------|
| Course model | Exists (`src/models/course.model.ts`) | name (200), code (20, unique), description (1000), subjectId, teacherId, isActive, timestamps |
| Course repository | Exists (`src/repositories/course.repository.ts`) | create, findById, update, softDelete, exists, totalCount, findAllPaginated |
| Course service | Exists (`src/services/course.service.ts`) | Full CRUD with RBAC, ownership checks, duplicate handling |
| Course controller | Exists (`src/controllers/course.controller.ts`) | list, getById, create, update, patch, delete + handleError |
| Course routes | Exist (`src/app/api/courses/`) + `[id]/` | GET, POST (collection); GET, PUT, PATCH, DELETE (item) |
| Course validation | Exists (`src/validations/course.validation.ts`) | createCourseSchema, updateCourseSchema, patchCourseSchema, courseListSchema, courseIdParamSchema — all `.strict()` |
| Course types | Partial (`src/types/course.types.ts`) | ICourse interface with name, code, description, subjectId, teacherId, isActive, createdAt, updatedAt |
| Course tests | Exist (`src/services/__tests__/course.service.test.ts`) | 23 tests covering RBAC, IDOR, soft-delete, duplicates, pagination, ownership |
| Course RBAC | Enforced | TEACHER/ADMIN only for all operations; TEACHER can only access own courses (404-masked); ADMIN can assign to any teacher |
| Course soft-delete | Enforced | isActive pattern; idempotent; list filters isActive=true |
| Course relationships | Course → Subject (M:1), Course → Class (1:M via FK) | Classes reference courseId; enrollment references courseId |

### 3.2 What Is Missing

| Gap | Impact |
|-----|--------|
| No `publishedAt` on Course | Cannot determine when a course was published for student access |
| No `status` enum on Course | Cannot draft/publish lifecycle; Course is always "active" via isActive |
| No content/material fields | Cannot host lesson content within a course |
| No Module/Lesson/Material models | Content hierarchy must be built from scratch |
| No student-facing Course access | Only TEACHER/ADMIN can access courses; students access via Classes/Enrollments |
| No course-level ordering | Within a subject, courses have no sequence number |

### 3.3 Course ↔ Class ↔ Enrollment Relationship (Verified)

```
Course (Teacher-owned metadata container)
  ↓ has many
Class (Teacher-owned, belongs to Course, has schedule)
  ↓ has many (via)
Enrollment (Student ↔ Class, stores courseId for denormalization)
```

- Class references `courseId` and `teacherId` directly (denormalized)
- Enrollment references `studentId`, `classId`, and `courseId` (denormalized)
- Students access content through Classes they are enrolled in, not directly through Courses
- Teachers own Courses and Classes; Students are enrolled in Classes

---

## 4. Proposed Domain Architecture

### 4.1 Chosen Hierarchy

```
Course (existing)
  ↓ has many (ordered)
Module (new)
  ↓ has many (ordered)
Lesson (new)
  ↓ has many (ordered)
Material (new)
```

### 4.2 Why This Structure

**Module belongs to Course** — Courses currently have no way to organize content
into sections. Modules provide a named grouping (e.g., "Week 1: Introduction")
that instructors can reorder. This mirrors the existing Course → Class pattern
where Classes are children of Courses.

**Lesson belongs to Module** — A Module contains individual Lesson units
(e.g., "Lecture 1: What is Biology?"). Lessons can have their own title,
description, and lifecycle (draft/published). This mirrors the existing
Assignment model which has a `status` (DRAFT/PUBLISHED/ARCHIVED) and
`publishedAt` field.

**Material belongs to Lesson** — A Lesson can contain multiple content items
(text, video, image, file, link). Keeping Material as a separate entity allows:
- Multiple content items per lesson (e.g., a video + a text explanation)
- Different content types with type-specific validation
- Per-material ordering and metadata
- Future extensibility (e.g., adding file upload, external URLs)

This avoids overloading the Lesson model with a polymorphic `content` field
that would be difficult to validate and extend. It also avoids a single
"content" entity with no grouping, which would make ordering and organization
impossible at scale.

**Why not 2 levels (Course → Lesson → Material)?**
Modules provide a necessary intermediate layer for pedagogical organization.
Direct Course → Lesson mapping would force all lessons to be top-level within
a course, which doesn't match how instructors structure curricula (units/modules
→ lessons → content).

**Why not 4+ levels?**
The 4-level hierarchy (Course → Module → Lesson → Material) is sufficient for
most LMS use cases. Deeper nesting adds complexity without proportional benefit
and would make the API and frontend more cumbersome.

### 4.3 Ownership Model

- **Module.teacherId = Course.teacherId** (inherited, not specified by client)
- **Lesson.teacherId = Course.teacherId** (inherited, not specified by client)
- **Material.teacherId = Course.teacherId** (inherited, not specified by client)
- Admin can override teacherId (following existing Course pattern)
- Students/parents are never owners — they are consumers

### 4.4 Student Access Model

Students access course content through their enrollment in a Class, which
belongs to a Course. This follows the existing enrollment pattern:

```
Student → Enrollment → Class → Course → Module → Lesson → Material
```

- A student must be enrolled in (or be enrolled in a class of) a Course to
  access its Modules, Lessons, and Materials.
- Only **published** content (status: PUBLISHED) is visible to students/parents.
- Draft content is only visible to the owning teacher and admins.

---

## 5. Domain Model Design

### 5.1 Module Model

**File:** `backend/src/models/module.model.ts` (NEW)
**Collection:** `modules`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | auto | — | Primary key |
| `title` | String | yes | — | Module title (max 200) |
| `description` | String | no | null | Module description (max 1000) |
| `courseId` | ObjectId ref Course | yes | — | Parent course |
| `teacherId` | ObjectId ref User | yes | — | Owning teacher (inherited from Course) |
| `order` | Number | yes | auto-increment within course | Display order / sequence |
| `status` | String enum | yes | DRAFT | ModuleStatus: DRAFT, PUBLISHED, ARCHIVED |
| `publishedAt` | Date | no | null | When module was first published |
| `isActive` | Boolean | yes | true | Soft-delete flag |
| `createdAt` | Date | auto | — | Timestamp |
| `updatedAt` | Date | auto | — | Timestamp |

**Indexes:**
- `{ courseId: 1, order: 1 }` — efficient listing of modules within a course in order
- `{ courseId: 1, isActive: 1 }` — filtering active modules by course
- `{ teacherId: 1, isActive: 1 }` — teacher's own modules
- `{ status: 1 }` — filtering by status
- `{ courseId: 1, title: 1 }` with unique constraint (partialFilterExpression isActive: true) — prevent duplicate module titles within a course

**Lifecycle:**
- DRAFT → PUBLISHED: `publishedAt` set to now()
- PUBLISHED → DRAFT: `publishedAt` set to null
- Any status → ARCHIVED: terminal state (cannot be un-archived via normal flow)
- Inactive (soft-deleted) modules are hidden from all queries where `isActive: true`

### 5.2 Lesson Model

**File:** `backend/src/models/lesson.model.ts` (NEW)
**Collection:** `lessons`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | auto | — | Primary key |
| `title` | String | yes | — | Lesson title (max 200) |
| `description` | String | no | null | Lesson description (max 2000) |
| `moduleId` | ObjectId ref Module | yes | — | Parent module |
| `courseId` | ObjectId ref Course | yes | — | Denormalized parent course (for efficient queries) |
| `teacherId` | ObjectId ref User | yes | — | Owning teacher (inherited from Course) |
| `order` | Number | yes | auto-increment within module | Display order / sequence |
| `status` | String enum | yes | DRAFT | LessonStatus: DRAFT, PUBLISHED, ARCHIVED |
| `publishedAt` | Date | no | null | When lesson was first published |
| `durationMinutes` | Number | no | null | Estimated duration in minutes (min 1, max 1440) |
| `isActive` | Boolean | yes | true | Soft-delete flag |
| `createdAt` | Date | auto | — | Timestamp |
| `updatedAt` | Date | auto | — | Timestamp |

**Indexes:**
- `{ moduleId: 1, order: 1 }` — efficient listing of lessons within a module in order
- `{ courseId: 1, isActive: 1 }` — course-level filtering
- `{ teacherId: 1, isActive: 1 }` — teacher's own lessons
- `{ status: 1 }` — filtering by status
- `{ moduleId: 1, title: 1 }` with unique constraint (partialFilterExpression isActive: true) — prevent duplicate lesson titles within a module

**Denormalization rationale:** Storing `courseId` on Lesson (even though it's
reachable via Module → Course) follows the existing pattern seen in Assignment
and Grade models, which both denormalize `courseId` for efficient querying
without joins.

### 5.3 Material Model

**File:** `backend/src/models/material.model.ts` (NEW)
**Collection:** `materials`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | auto | — | Primary key |
| `title` | String | yes | — | Material title (max 200) |
| `description` | String | no | null | Material description (max 1000) |
| `lessonId` | ObjectId ref Lesson | yes | — | Parent lesson |
| `moduleId` | ObjectId ref Module | yes | — | Denormalized parent module |
| `courseId` | ObjectId ref Course | yes | — | Denormalized parent course |
| `teacherId` | ObjectId ref User | yes | — | Owning teacher |
| `materialType` | String enum | yes | — | MaterialType: TEXT, IMAGE, VIDEO, FILE, LINK |
| `content` | String | no | null | Text content for TEXT type (max 50000) |
| `url` | String | no | null | URL for IMAGE/VIDEO/LINK/FILE types (max 2048) |
| `fileKey` | String | no | null | Storage reference key for uploaded files (max 512) |
| `order` | Number | yes | auto-increment within lesson | Display order / sequence |
| `isActive` | Boolean | yes | true | Soft-delete flag |
| `createdAt` | Date | auto | — | Timestamp |
| `updatedAt` | Date | auto | — | Timestamp |

**Indexes:**
- `{ lessonId: 1, order: 1 }` — efficient listing of materials within a lesson
- `{ courseId: 1, isActive: 1 }` — course-level filtering
- `{ teacherId: 1, isActive: 1 }` — teacher's own materials
- `{ materialType: 1 }` — filtering by type

**Denormalization rationale:** Storing `moduleId` and `courseId` on Material
follows the existing pattern (Assignment has both classId and courseId).
This avoids multi-level lookups when checking ownership or listing materials.

### 5.4 Relationship Design

```
Course (existing)
  1 → M    Module
    1 → M   Lesson
      1 → M  Material
```

- **Module → Course:** `courseId` (FK). When a Course is soft-deleted, all
  child Modules are not automatically deleted (soft-delete does not cascade).
  Instead, queries filter by `courseId` where `course.isActive = true` —
  if the course is inactive, no modules will be returned for student queries.
  Teacher queries already scope by `teacherId`.

- **Lesson → Module:** `moduleId` (FK) + `courseId` (denormalized). When a
  Module is soft-deleted or archived, lessons under it are hidden via the
  module's status/isActive check in the service layer.

- **Material → Lesson:** `lessonId` (FK) + `moduleId` (denormalized) +
  `courseId` (denormalized). Same hiding logic as Lessons.

**Orphaned record prevention:**
- Service-layer checks verify parent existence and active status before any
  operation on child entities (following the existing `verifySubject()` /
  `verifyCourse()` / `verifyClass()` patterns).
- Foreign key fields are validated as ObjectId format in Zod schemas.
- No MongoDB-level referential integrity (Mongoose does not enforce FK
  constraints); integrity is enforced in the service layer.

**Cascade behavior:**
- Soft-deletes do NOT cascade. Deleting a Course sets `isActive: false` but
  does not touch Modules/Lessons/Materials. The service layer checks parent
  active status before returning child records.
- This follows the existing pattern: deleting a Subject or Course does not
  cascade to children — children simply become unreachable through normal
  queries because the parent is not found.

---

## 6. API Endpoint Plan

All endpoints follow the existing REST pattern: `/api/<entity>/` for
collections and `/api/<entity>/[id]/` for items.

### 6.1 Modules API

```
GET    /api/modules           — List modules (query: courseId, page, limit, search, status)
POST   /api/modules           — Create module
GET    /api/modules/[id]      — Get module by ID
PUT    /api/modules/[id]      — Replace module
PATCH  /api/modules/[id]      — Partial update (status change, reorder)
DELETE /api/modules/[id]      — Soft-delete module
```

**Auth:** All endpoints require valid JWT (middleware protected route)
**Roles:** TEACHER and ADMIN for all operations
**RBAC details:**
- TEACHER: can only access modules under courses they own
- ADMIN: can access any module, can assign to any teacher
- STUDENT/PARENT: NOT allowed — modules are management endpoints

**Response shape (single module):**
```json
{
  "success": true,
  "message": "Module created successfully",
  "data": {
    "id": "<mongo_id>",
    "title": "Week 1: Introduction",
    "description": "Introduction to the subject",
    "courseId": "<mongo_id>",
    "teacherId": "<mongo_id>",
    "order": 1,
    "status": "DRAFT",
    "publishedAt": null,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  },
  "errors": [],
  "timestamp": "2026-01-01T00:00:00Z"
}
```

**List response:**
```json
{
  "success": true,
  "message": "Modules fetched successfully",
  "data": {
    "modules": [ ... ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  },
  "errors": [],
  "timestamp": "2026-01-01T00:00:00Z"
}
```

**Error cases:**
- 400: Validation failure (ZodError)
- 401: Missing/invalid JWT (middleware)
- 403: User is not TEACHER or ADMIN, or account inactive
- 404: Course not found, or module not found (IDOR-masked for cross-teacher)
- 409: Duplicate module title within course (E11000)
- 429: Rate limited (apiHandler)
- 500: Unhandled error (apiHandler)

### 6.2 Lessons API

```
GET    /api/lessons        — List lessons (query: moduleId, page, limit, search, status)
POST   /api/lessons        — Create lesson
GET    /api/lessons/[id]   — Get lesson by ID
PUT    /api/lessons/[id]   — Replace lesson
PATCH  /api/lessons/[id]   — Partial update (status change, reorder)
DELETE /api/lessons/[id]   — Soft-delete lesson
```

**Auth:** All endpoints require valid JWT
**Roles:** TEACHER and ADMIN for all operations
**RBAC:** Same as Modules — only teacher/admin, scoped to own courses

**Response shape (single lesson):**
```json
{
  "data": {
    "id": "<mongo_id>",
    "title": "What is Biology?",
    "description": "Basic introduction",
    "moduleId": "<mongo_id>",
    "courseId": "<mongo_id>",
    "teacherId": "<mongo_id>",
    "order": 1,
    "status": "DRAFT",
    "publishedAt": null,
    "durationMinutes": 15,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 6.3 Materials API

```
GET    /api/materials     — List materials (query: lessonId, page, limit, search, materialType)
POST   /api/materials    — Create material
GET    /api/materials/[id]— Get material by ID
PUT    /api/materials/[id]— Replace material
PATCH  /api/materials/[id]— Partial update
DELETE /api/materials/[id]— Soft-delete material
```

**Auth:** All endpoints require valid JWT
**Roles:** TEACHER and ADMIN for all operations
**RBAC:** Same scoping pattern

**Response shape (single material):**
```json
{
  "data": {
    "id": "<mongo_id>",
    "title": "Introduction Video",
    "description": null,
    "lessonId": "<mongo_id>",
    "moduleId": "<mongo_id>",
    "courseId": "<mongo_id>",
    "teacherId": "<mongo_id>",
    "materialType": "VIDEO",
    "content": null,
    "url": "https://example.com/video.mp4",
    "fileKey": null,
    "order": 1,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 6.4 Student-Facing Read Endpoints (Future)

Students access content through the existing enrollment/class/course chain.
A future endpoint might be:

```
GET /api/courses/[courseId]/modules  — List published modules for a course (student-accessible)
GET /api/modules/[moduleId]/lessons  — List published lessons in a module (student-accessible)
GET /api/lessons/[lessonId]/materials — List published materials in a lesson (student-accessible)
```

These would:
- Accept any authenticated user (TEACHER, STUDENT, PARENT)
- TEACHER/ADMIN see all statuses (DRAFT, PUBLISHED, ARCHIVED)
- STUDENT/PARENT see only PUBLISHED content
- Verify enrollment in the course's class before returning content

**Note:** These student-facing endpoints are marked as future/optional in this
planning phase. The initial implementation will focus on teacher/admin CRUD
for modules, lessons, and materials.

---

## 7. RBAC Matrix

| Role | Module Create | Module Read (own) | Module Read (cross-teacher) | Module Update (own) | Module Update (cross) | Module Delete (own) | Module Delete (cross) |
|------|---------------|--------------------|-----------------------------|---------------------|-----------------------|---------------------|-----------------------|
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes (soft-delete) | Yes (soft-delete) |
| TEACHER | Yes (own courses) | Yes | No (404) | Yes (own) | No (404) | Yes (own) | No (404) |
| STUDENT | No (403) | No (403) | No (403) | No (403) | No (403) | No (403) | No (403) |
| PARENT | No (403) | No (403) | No (403) | No (403) | No (403) | No (403) | No (403) |

Same matrix applies to Lessons and Materials (with Module/Lesson scoping instead of Course).

| Role | Content Visibility (Student-facing reads) |
|------|------------------------------------------|
| STUDENT | Only PUBLISHED status, must be enrolled in a class of the course |
| PARENT | Only PUBLISHED status, must be parent of enrolled student |
| TEACHER | All statuses for own courses' content |
| ADMIN | All statuses, all content |

**Ownership/scoping rules:**
1. Teacher ownership is verified via `course.teacherId` — not via `module.teacherId` alone. A teacher who did not create the parent Course cannot access its modules.
2. ADMIN bypasses ownership checks but must still provide valid `courseId` (which must exist and be active).
3. Client-supplied `courseId`, `moduleId`, `lessonId`, `teacherId` are validated as ObjectIds and checked for existence + active status in the service layer.
4. For TEACHER role, `teacherId` on created modules/lessons/materials is always set to the authenticated user's ID (client-supplied `teacherId` is ignored, following the Course pattern).
5. For ADMIN role, `teacherId` on created entities can be specified (with validation that the target user is a TEACHER).

---

## 8. IDOR & Security Design

**Cross-course access:**
- Service layer checks that the parent Course exists and is active.
- If the requester is a TEACHER, their `teacherId` must match the Course's `teacherId`.
- Mismatch → 404 "Course not found" (not 403, to prevent information leakage).

**Cross-teacher access:**
- All list queries for TEACHER role include `teacherId` in the filter.
- Get-by-id checks ownership before returning (404 on mismatch).
- Update/delete check ownership via `getModuleForUpdate()` / `getLessonForUpdate()` pattern (same as existing Course/Assignment).

**Student accessing unpublished content:**
- Student-facing read endpoints (future) will filter `status: "PUBLISHED"` and check enrollment.
- Teacher-facing endpoints do not expose student data at all (STUDENT/PARENT get 403 on write endpoints).

**Parent accessing unrelated content:**
- Same enrollment check as students — parent can only see PUBLISHED content for students they are a parent of (verified via `userRepository.findStudentsByParentId()`).

**Forged courseId/moduleId/lessonId:**
- All ID parameters validated via `objectIdSchema` (24-hex-char regex).
- Service layer looks up the entity by ID; if not found or inactive → 404.
- The `courseId` is always set by the server (from the parent entity), never trusted from the client for writes.
- `teacherId` is always set by the server from the authenticated user (for TEACHER role) or validated target (for ADMIN).

**Query parameter bypass:**
- Query parameters (`courseId`, `moduleId`, `lessonId`) are validated as ObjectIds and checked for existence.
- Filters are constructed server-side — client cannot inject arbitrary MongoDB operators beyond what's explicitly allowed (e.g., `isActive` boolean, `status` enum, `search` string regex).
- List queries always include `isActive: true` in the filter unless explicitly requesting inactive records (admin-only).

**Mass assignment:**
- All Zod schemas use `.strict()` — unknown fields are rejected.
- Server-controlled fields (`teacherId`, `courseId`, `moduleId`, `lessonId`, `isActive`, `createdAt`, `updatedAt`, `publishedAt`) are either:
  - Not in the schema at all (truly server-controlled), or
  - Only settable by ADMIN role (e.g., `teacherId` on create for ADMIN)
- Client-supplied `order` is accepted but must be a positive integer; the service enforces uniqueness within the parent scope.

**Inactive parent resources:**
- If a Course is soft-deleted (isActive: false), all child Module/Lesson/Material queries return 404.
- If a Module is archived, its Lessons are hidden (not returned in queries).
- The service always checks parent entity's `isActive` before proceeding.

**Deleted child resources under active parents:**
- Soft-deleted modules/lessons/materials are excluded from all queries via `isActive: true` filter.
- Get-by-id on a soft-deleted entity → 404.
- The `order` field does not need renumbering on deletion (gaps are acceptable, following existing pattern).

---

## 9. Validation Rules

### 9.1 Module Validation

```
createModuleSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 1000, optional
  courseId: objectId (required)
  status: enum [DRAFT, PUBLISHED, ARCHIVED], default DRAFT
  .strict()

updateModuleSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 1000, nullable, optional
  courseId: objectId (required — must be the same course)
  status: enum [DRAFT, PUBLISHED, ARCHIVED]
  .strict()

patchModuleSchema:
  title?: string, trim, min 1, max 200
  description?: string, trim, max 1000, nullable
  status?: enum [DRAFT, PUBLISHED, ARCHIVED]
  order?: number, int, min 1
  .strict()

moduleListSchema:
  page: int, min 1, default 1
  limit: int, min 1, max 100, default 20
  search?: string, trim, min 1, max 100
  courseId?: objectId
  status?: enum [DRAFT, PUBLISHED, ARCHIVED]
  isActive?: boolean (preprocessed from string)
```

### 9.2 Lesson Validation

```
createLessonSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 2000, optional
  moduleId: objectId (required)
  status: enum [DRAFT, PUBLISHED, ARCHIVED], default DRAFT
  durationMinutes?: number, min 1, max 1440
  .strict()

updateLessonSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 2000, nullable, optional
  moduleId: objectId (required — must be same module)
  status: enum [DRAFT, PUBLISHED, ARCHIVED]
  durationMinutes?: number, min 1, max 1440
  .strict()

patchLessonSchema:
  title?: string, trim, min 1, max 200
  description?: string, trim, max 2000, nullable
  status?: enum [DRAFT, PUBLISHED, ARCHIVED]
  order?: number, int, min 1
  durationMinutes?: number, min 1, max 1440
  .strict()

lessonListSchema:
  page: int, min 1, default 1
  limit: int, min 1, max 100, default 20
  search?: string, trim, min 1, max 100
  moduleId?: objectId
  status?: enum [DRAFT, PUBLISHED, ARCHIVED]
  isActive?: boolean (preprocessed from string)
```

### 9.3 Material Validation

```
createMaterialSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 1000, optional
  lessonId: objectId (required)
  materialType: enum [TEXT, IMAGE, VIDEO, FILE, LINK] (required)
  content: string, max 50000, optional (required when materialType = TEXT)
  url: string, url format, max 2048, optional (required when materialType = IMAGE/VIDEO/LINK)
  fileKey: string, max 512, optional (required when materialType = FILE)
  .strict()

updateMaterialSchema:
  title: string, trim, min 1, max 200
  description: string, trim, max 1000, nullable, optional
  lessonId: objectId (required — must be same lesson)
  materialType: enum [TEXT, IMAGE, VIDEO, FILE, LINK] (required)
  content: string, max 50000, nullable, optional
  url: string, url format, max 2048, nullable, optional
  fileKey: string, max 512, nullable, optional
  .strict()

patchMaterialSchema:
  title?: string, trim, min 1, max 200
  description?: string, trim, max 1000, nullable
  materialType?: enum [TEXT, IMAGE, VIDEO, FILE, LINK]
  content?: string, max 50000, nullable
  url?: string, url format, max 2048, nullable
  fileKey?: string, max 512, nullable
  order?: number, int, min 1
  .strict()

materialListSchema:
  page: int, min 1, default 1
  limit: int, min 1, max 100, default 20
  search?: string, trim, min 1, max 100
  lessonId?: objectId
  materialType?: enum [TEXT, IMAGE, VIDEO, FILE, LINK]
  isActive?: boolean (preprocessed from string)
```

### 9.4 Validation Rationale

- **Title max 200:** Consistent with Course/Subject/Class/Assignment title max.
- **Description max 1000:** Consistent with Course/Subject/Class description max. Lesson description is 2000 to allow more detail (matches Assignment description max of 5000, scaled down for lessons).
- **Content max 50000:** Matches existing Submission content max (50000 chars).
- **URL max 2048:** Standard URL length limit.
- **fileKey max 512:** Standard S3/object storage key length.
- **durationMinutes max 1440:** 24 hours in minutes — practical upper bound for a single lesson.
- **order min 1:** Positive integer, consistent with pagination.
- **materialType-dependent required fields:** TEXT requires `content`; IMAGE/VIDEO/LINK require `url`; FILE requires `fileKey`. This is enforced via Zod refinements.

---

## 10. Lifecycle Rules

### 10.1 Module Lifecycle

```
DRAFT → PUBLISHED: publishedAt set to now()
PUBLISHED → DRAFT: publishedAt set to null
PUBLISHED → ARCHIVED: terminal state
ARCHIVED → (cannot transition to active states via normal API)
Any state → Inactive (soft-delete): isActive = false
```

### 10.2 Lesson Lifecycle

```
DRAFT → PUBLISHED: publishedAt set to now()
PUBLISHED → DRAFT: publishedAt set to null
PUBLISHED → ARCHIVED: terminal state
ARCHIVED → (cannot transition to active states via normal API)
Any state → Inactive (soft-delete): isActive = false
```

### 10.3 Material Lifecycle

Materials do not have a publish/archive lifecycle — they are published or
hidden based on their parent Lesson's status. A Material is visible to:
- Teachers/Admins: when the parent Lesson and Module and Course are all active
- Students/Parents: when the parent Lesson status is PUBLISHED, the parent
  Module status is PUBLISHED, the parent Course is active, and enrollment is verified

### 10.4 Cascade Behavior Rules

- **Course soft-deleted:** All child Modules become effectively unreachable
  (service checks Course.isActive before returning Module data).
- **Module soft-deleted:** All child Lessons become unreachable.
- **Module archived:** Lessons under it are not returned in queries (service
  filters by Module.status).
- **Lesson soft-deleted:** All child Materials become unreachable.
- **Lesson archived:** Materials under it are not returned in queries.
- **No automatic restoration:** Reactivating a parent does not automatically
  un-archive children. This follows the principle of explicit state management.
- **Delete idempotency:** Soft-deleting an already-inactive entity returns the
  entity as-is (same as existing Course/Class soft-delete pattern).

---

## 11. Pagination & Query Design

All list endpoints follow the existing pagination pattern:
- `page` (default 1, min 1)
- `limit` (default 20, min 1, max 100)

**Sorting:**
- Modules: sorted by `order` ascending, then `createdAt` descending
- Lessons: sorted by `order` ascending, then `createdAt` descending
- Materials: sorted by `order` ascending, then `createdAt` descending

This differs from the existing domain entities (which sort by `createdAt`
descending) because ordered content requires `order` as the primary sort key.

**Search:**
- Modules: search on `title` (case-insensitive regex)
- Lessons: search on `title` (case-insensitive regex)
- Materials: search on `title` (case-insensitive regex)

**Filtering:**
- Modules: `courseId`, `status`, `isActive`
- Lessons: `moduleId`, `status`, `isActive`
- Materials: `lessonId`, `materialType`, `isActive`

**Query parameter bypass prevention:**
- All query params validated via Zod (objectId for IDs, enum for status/types)
- Filters are constructed server-side; client-provided values only refine
  the query within the authenticated user's scope
- TEACHER queries always include `{ teacherId: requestorId }` and
  `{ [course/module/lesson]Id verified for ownership }`
- STUDENT/PARENT queries (future student-facing endpoints) always include
  `status: PUBLISHED` and enrollment verification

---

## 12. Testing Strategy

Tests follow the existing pattern in `src/services/__tests__/*.service.test.ts`:
- Uses `node:test` + `node:assert`
- Mocks repository methods directly (not a mocking framework)
- Tests call service methods directly (not through HTTP)
- Uses `beforeEach` to install mock repos

### 12.1 Service Tests

**ModuleService tests** (`src/services/__tests__/module.service.test.ts`):
- RBAC: TEACHER can create/list/get/update/delete own modules; STUDENT/PARENT rejected (403); ADMIN can access any
- IDOR: TEACHER cannot access another teacher's modules (404); ADMIN can access any
- Ownership: TEACHER-supplied teacherId ignored; ADMIN can specify target teacher
- Course verification: nonexistent course → 404; inactive course → 404
- Soft-delete: idempotent; inactive modules return 404
- Duplicates: E11000 on duplicate title+courseId → 409
- Pagination: respects page/limit; filters by teacherId for TEACHER role
- Lifecycle: DRAFT → PUBLISHED sets publishedAt; ARCHIVED cannot be republished
- Search: case-insensitive regex on title
- Nonexistent requester → 401

**LessonService tests** (`src/services/__tests__/lesson.service.test.ts`):
- RBAC: same as Module
- Module verification: nonexistent/inactive/archived module → 404
- Order: unique within module; gaps allowed on deletion
- Same test categories as Module: RBAC, IDOR, ownership, soft-delete, duplicates, pagination, lifecycle

**MaterialService tests** (`src/services/__tests__/material.service.test.ts`):
- RBAC: same as Module
- Lesson verification: nonexistent/inactive/archived lesson → 404
- Material type validation: TEXT requires content; IMAGE/VIDEO/LINK require url; FILE requires fileKey
- Same test categories as Module: RBAC, IDOR, ownership, soft-delete, duplicates, pagination

### 12.2 Controller-Level Tests

Following the existing pattern, controller tests would verify:
- Zod validation errors → 400 with field-level messages
- AppError → correct status code + message
- mongoError → 409 with correct message
- Unhandled error → 500 generic message
- Response shape: `{ success, message, data, errors, timestamp }`

### 12.3 Security Regression Tests

The existing `phase4*.security.test.ts` files in `src/__tests__/` test middleware-level
security. These should be extended to include `/api/modules`, `/api/lessons`, and
`/api/materials` in the `protectedRoutes` array of `middleware.ts`.

---

## 13. Implementation Order

Following the exact pattern established by Phases 4A/4B/4C:

1. **Types** — `src/types/module.types.ts`, `src/types/lesson.types.ts`, `src/types/material.types.ts`
   - Define interfaces with `Document` base, `Types.ObjectId` for FKs, enums for status/type, `isActive`, timestamps
2. **Constants** — Add `MODULE_EXISTS`, `MODULE_NOT_FOUND`, `LESSON_EXISTS`, `LESSON_NOT_FOUND`, `MATERIAL_NOT_FOUND`, `INVALID_MATERIAL_TYPE` to `errorMessages.ts` if needed
3. **Models** — `src/models/module.model.ts`, `src/models/lesson.model.ts`, `src/models/material.model.ts`
   - Mongoose schemas with field validation, indexes, unique constraints
4. **Repositories** — `src/repositories/module.repository.ts`, `src/repositories/lesson.repository.ts`, `src/repositories/material.repository.ts`
   - Same methods as existing repos: create, findById, update, softDelete, exists, totalCount, findAllPaginated
5. **Validation** — `src/validations/module.validation.ts`, `src/validations/lesson.validation.ts`, `src/validations/material.validation.ts`
   - Zod schemas with `.strict()`, objectId validation, enum validation
6. **Services** — `src/services/module.service.ts`, `src/services/lesson.service.ts`, `src/services/material.service.ts`
   - Full RBAC, ownership checks, IDOR prevention, lifecycle rules, relationship validation
7. **Controllers** — `src/controllers/module.controller.ts`, `src/controllers/lesson.controller.ts`, `src/controllers/material.controller.ts`
   - Same structure as existing controllers: list, getById, create, update, patch, delete, handleError
8. **Routes** — `src/app/api/modules/route.ts`, `src/app/api/modules/[id]/route.ts`, etc.
   - Wrapped in `apiHandler`, delegating to controllers
9. **Middleware** — Add `/api/modules`, `/api/lessons`, `/api/materials` to `protectedRoutes` in `src/middleware.ts`
10. **Tests** — Service tests following existing pattern (before implementation or alongside)
11. **Security regression** — Extend existing security test files
12. **Full validation** — `tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`

---

## 14. Future Frontend Contract

### 14.1 Endpoint List

```
GET    /api/modules                        — List modules (teacher/admin)
POST   /api/modules                        — Create module (teacher/admin)
GET    /api/modules/[id]                   — Get module (teacher/admin own)
PUT    /api/modules/[id]                   — Replace module (teacher/admin own)
PATCH  /api/modules/[id]                   — Partial update (teacher/admin own)
DELETE /api/modules/[id]                   — Soft-delete module (teacher/admin own)
GET    /api/lessons                        — List lessons (teacher/admin)
POST   /api/lessons                        — Create lesson (teacher/admin)
GET    /api/lessons/[id]                   — Get lesson (teacher/admin own)
PUT    /api/lessons/[id]                   — Replace lesson (teacher/admin own)
PATCH  /api/lessons/[id]                   — Partial update (teacher/admin own)
DELETE /api/lessons/[id]                   — Soft-delete lesson (teacher/admin own)
GET    /api/materials                      — List materials (teacher/admin)
POST   /api/materials                      — Create material (teacher/admin)
GET    /api/materials/[id]                 — Get material (teacher/admin own)
PUT    /api/materials/[id]                 — Replace material (teacher/admin own)
PATCH  /api/materials/[id]                 — Partial update (teacher/admin own)
DELETE /api/materials/[id]                 — Soft-delete material (teacher/admin own)
```

### 14.2 Request/Response Shapes

**Create Module:**
```
POST /api/modules
Body: { title: string, description?: string, courseId: string, status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" }
Response: { success, message, data: ModuleResponse, errors, timestamp }
```

**Create Lesson:**
```
POST /api/lessons
Body: { title: string, description?: string, moduleId: string, status?: ..., durationMinutes?: number }
Response: { success, message, data: LessonResponse, errors, timestamp }
```

**Create Material:**
```
POST /api/materials
Body: { title: string, description?: string, lessonId: string, materialType: "TEXT"|"IMAGE"|"VIDEO"|"FILE"|"LINK", content?: string, url?: string, fileKey?: string }
Response: { success, message, data: MaterialResponse, errors, timestamp }
```

### 14.3 Authentication & Authorization

- All endpoints require valid JWT (accessToken cookie) — middleware enforced
- CSRF token required for POST/PUT/PATCH/DELETE — middleware enforced
- TEACHER: full CRUD on own courses' content
- ADMIN: full CRUD on any content
- STUDENT/PARENT: no access to write endpoints (403)
- Student-facing read endpoints (future): only PUBLISHED content, enrollment-gated

### 14.4 Error Format

Same as all existing endpoints:
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": ["array of error strings"],
  "timestamp": "2026-01-01T00:00:00Z"
}
```

### 14.5 Pagination Format

Same as existing endpoints:
```json
{
  "data": {
    "modules": [ ... ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

## 15. Proposed File Changes

### NEW Files

```
backend/src/models/module.model.ts
backend/src/models/lesson.model.ts
backend/src/models/material.model.ts
backend/src/repositories/module.repository.ts
backend/src/repositories/lesson.repository.ts
backend/src/repositories/material.repository.ts
backend/src/services/module.service.ts
backend/src/services/lesson.service.ts
backend/src/services/material.service.ts
backend/src/controllers/module.controller.ts
backend/src/controllers/lesson.controller.ts
backend/src/controllers/material.controller.ts
backend/src/validations/module.validation.ts
backend/src/validations/lesson.validation.ts
backend/src/validations/material.validation.ts
backend/src/types/module.types.ts
backend/src/types/lesson.types.ts
backend/src/types/material.types.ts
backend/src/app/api/modules/route.ts
backend/src/app/api/modules/[id]/route.ts
backend/src/app/api/lessons/route.ts
backend/src/app/api/lessons/[id]/route.ts
backend/src/app/api/materials/route.ts
backend/src/app/api/materials/[id]/route.ts
backend/src/services/__tests__/module.service.test.ts
backend/src/services/__tests__/lesson.service.test.ts
backend/src/services/__tests__/material.service.test.ts
```

### MODIFY Files

```
backend/src/middleware.ts
  - Add "/api/modules", "/api/lessons", "/api/materials" to protectedRoutes array
  (line 10)
```

No other existing files need modification.

---

## 16. Migration & Data Considerations

**Existing data:**
- No existing Module/Lesson/Material collections in MongoDB.
- The Course collection exists but has no fields referencing content entities.
- No migration script is needed — new collections are created on first write.

**Backward compatibility:**
- No existing API responses change.
- No existing database schema changes.
- The new entities are purely additive.
- The `protectedRoutes` addition in `middleware.ts` only affects routes that will be created in Phase 5 — no existing routes are impacted.

**Index creation:**
- New indexes will be created automatically by Mongoose on first connect
  (since `autoIndex` defaults to `true` in development).
- In production, indexes should be created via `mongoose.syncIndexes()`
  or a deployment script. The existing codebase does not use a separate
  migration system — indexes are defined in the schema.

**Seed/test data:**
- New test mock data will be created for modules, lessons, and materials
  (following the pattern in `course.service.test.ts` and `grade.service.test.ts`).
- No production seed data changes needed.

---

## 17. Performance Considerations

**Nested resource lookups:**
- Denormalized `courseId` on Lesson and Material avoids multi-level lookups
  when checking Course ownership/visibility.
- Denormalized `moduleId` on Material avoids a lookup from Material → Lesson → Module.
- This follows the existing pattern: Assignment has both `classId` and `courseId`;
  Grade has `studentId`, `assignmentId`, `submissionId`, `classId`.

**Population:**
- The existing backend does not use Mongoose `.populate()` — all joins are
  done via service-layer lookups (e.g., `verifyTeacher()` calls
  `userRepository.findByIdSafe()`). New services will follow this pattern.
- This avoids N+1 query issues from lazy population.

**Pagination:**
- All list endpoints use `skip`/`limit` pagination (same as existing entities).
- No cursor-based pagination (not needed at current scale).
- Maximum limit is 100 (same as existing `paginationSchema`).

**Indexes:**
- Composite indexes on `{ parentId, order }` and `{ parentId, isActive }`
  follow the existing pattern.
- Unique constraints use `partialFilterExpression: { isActive: true }`
  (same as existing Course, Class, Enrollment, Submission, Grade models).

**Large lesson content:**
- Material `content` field (max 50000 chars) is capped to prevent
  unbounded document growth.
- Text content is stored as a MongoDB String field — no special handling
  for large content is needed at current scale.
- For future file/video materials, a CDN or object storage solution
  would be integrated (referenced via `url` or `fileKey`).

**Material lists:**
- Materials are queried by `lessonId` with an index on `{ lessonId: 1, order: 1 }`.
- This is efficient for the typical case of listing all materials in a lesson.

---

## 18. Risks & Open Questions

### 18.1 Risks

| Risk | Mitigation |
|------|-----------|
| **Deep nesting complexity** | Keep to 4 levels (Course → Module → Lesson → Material). No 5th level. |
| **Multiple content types in one entity** | Use `materialType` enum + conditional required fields (Zod refinements). |
| **Ordering conflicts** | Use unique sparse index on `(parentId, order)` with `isActive: true`. |
| **Cross-teacher data leakage** | IDOR-masking (404 not 403) + server-side ownership scoping in every query. |
| **Draft content exposure to students** | Enforce `status: PUBLISHED` filter in student-facing endpoints; TEACHER/ADMIN bypass. |
| **N+1 queries on content listing** | Denormalized parent IDs; service-layer lookups (no populate). |
| **Soft-delete orphaning** | Parent active-status checks in service layer; no cascade deletes. |

### 18.2 Open Questions

1. **Should Materials support file uploads?** The plan includes `fileKey`
   for FILE-type materials, but file upload handling (multipart, S3
   integration) is not defined here. This could be a Phase 5.5 or later
   feature. For now, `url` (external link) and `content` (text) are
   sufficient for V1.

2. **Should there be a Course → Material shortcut?** Currently, to get
   all materials for a course, you would need to traverse Module → Lesson →
   Material. A denormalized `courseId` on Material handles this efficiently
   without a shortcut endpoint.

3. **Should Modules/Lessons support prerequisites?** (e.g., "Lesson 2
   is unlocked after completing Lesson 1"). This is an advanced feature
   that could be added later. Not planned for Phase 5.

4. **Should Materials have versioning?** Not planned for Phase 5 — a
   PATCH simply overwrites content. Version history could be a future
   feature.

5. **Should Lessons have an `estimatedTime` vs `durationMinutes`?**
   The plan uses `durationMinutes`. Rename if the team prefers
   `estimatedDurationMinutes` for consistency with potential future
   `actualTimeSpent` tracking.

---

## 19. Phase 5 Acceptance Criteria

1. **Module CRUD** — TEACHER and ADMIN can create, list, get, update, patch,
   and soft-delete modules. STUDENT and PARENT receive 403 on all module
   endpoints. IDOR-masking returns 404 for cross-teacher access.

2. **Lesson CRUD** — Same RBAC/IDOR as Module, scoped to parent Module and
   Course ownership.

3. **Material CRUD** — Same RBAC/IDOR, scoped to parent Lesson, Module, and
   Course ownership. Material type validation enforces conditional required
   fields.

4. **Lifecycle** — DRAFT/PUBLISHED/ARCHIVED enum for Module and Lesson.
   `publishedAt` set on transition to PUBLISHED. Students can only see
   PUBLISHED content (for student-facing read endpoints if implemented).

5. **Soft-delete** — All entities use `isActive` pattern. Delete is
   idempotent. Inactive entities return 404 on get-by-id.

6. **Validation** — All schemas use `.strict()`. ObjectId params validated.
   Enum fields validated. String lengths enforced. Material type-conditional
   fields validated.

7. **Error handling** — Duplicate keys return 409. Not-found returns 404
   (IDOR-masked). Invalid input returns 400 with field-level messages.
   Rate limiting (429) and unhandled errors (500) handled by apiHandler.

8. **Middleware** — `/api/modules`, `/api/lessons`, `/api/materials` added
   to `protectedRoutes` in `middleware.ts`.

9. **Request tracing** — All endpoints log requestId, method, pathname,
   ip, statusCode, duration via the existing apiHandler logging.

10. **Request body size** — All endpoints reject bodies over 5MB (413).

11. **Tests** — 960+ existing tests still pass. New service tests cover
    RBAC, IDOR, ownership, soft-delete, duplicates, pagination, lifecycle,
    query bypass, mass assignment, relationship integrity.

12. **Static validation** — `tsc --noEmit` passes with 0 errors.
    `npm run lint` has 0 errors (new warnings acceptable). `npm run build`
    succeeds.

---

## 20. Comparison with Phase 4E Audit Recommendation

The Phase 4E audit noted that the Course domain was incomplete for
content delivery (no `publishedAt`, no `status`, no content fields).
This plan addresses that by proposing a separate content hierarchy
(Module → Lesson → Material) rather than overloading the Course model.

The Phase 4E audit also confirmed that account lockout, request tracing,
request body limits, env validation, and handleMongoError fixes were
needed (or already implemented). All of those are now complete and will
apply automatically to Phase 5 endpoints since they are enforced in
`apiHandler.ts` and `middleware.ts`.
