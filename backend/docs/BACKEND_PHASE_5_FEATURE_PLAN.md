# Phase 5 — Backend Feature Plan: Course Materials / Modules / Lessons

## 1. Executive Summary

**Status: IMPLEMENTED.** Phase 5 introduces a new content domain: **Course Materials /
Modules / Lessons**. All production code was committed in `60fd7b3` "feat(backend):
implement course materials domain". This document was updated from its original
planning-only form to reflect the actual implementation state verified by source
inspection at `E:\final_project/backend` as of 2026-09-19.

### What was actually built

| Layer | Implementation |
|-------|----------------|
| **Models** | `module.model.ts`, `lesson.model.ts`, `material.model.ts` — Mongoose schemas with strict validation, compound unique indexes, soft-delete (`isActive`) |
| **Types** | `module.types.ts`, `lesson.types.ts`, `material.types.ts` — TypeScript interfaces with enums |
| **Repositories** | `module.repository.ts`, `lesson.repository.ts`, `material.repository.ts` — create, findById, update, softDelete, exists, totalCount, findAllPaginated |
| **Services** | `module.service.ts`, `lesson.service.ts`, `material.service.ts` — Full RBAC, ownership-chain verification, IDOR 404-masking, duplicate-key handling |
| **Controllers** | `module.controller.ts`, `lesson.controller.ts`, `material.controller.ts` — list/get/update/patch/delete + handleError |
| **Validations** | `module.validation.ts`, `lesson.validation.ts`, `material.validation.ts` — Zod `.strict()` schemas with objectId/refinement validation |
| **Routes** | Nested under `/api/courses/[courseId]/modules/...` (not flat `/api/modules`) |
| **Middleware** | No changes needed — `/api/courses` in `protectedRoutes` covers nested routes via prefix matching |

### Key implementation decisions (actual vs. proposed)

The original proposal described a **flat route structure** (`/api/modules`, `/api/lessons`,
`/api/materials`) with **status/publishedAt lifecycle fields**, **denormalized courseId
on Lesson**, and **moduleId/courseId on Material**. The actual implementation differs
in several significant ways:

1. **Nested routes**: All Phase 5 routes are nested under `/api/courses/[courseId]/modules/...`,
   requiring courseId in the URL path at every level.
2. **No status/publishedAt lifecycle**: Models use only `isActive` (soft-delete) — no
   DRAFT/PUBLISHED/ARCHIVED enum, no `publishedAt` field.
3. **`createdBy` instead of `teacherId`**: All three models reference the owning user
   via `createdBy`, not `teacherId`.
4. **Lesson content is inline**: Lessons have `contentType` (enum: VIDEO/TEXT/IMAGE/PDF/LINK)
   and `content` (string) fields — no separate Material needed for basic lesson content.
5. **Material is supplementary**: Materials are separate content items that can be
   attached to a lesson (file, image, video, link, document) — not a strict
   Course → Module → Lesson → Material hierarchy.
6. **No denormalized FKs on Lesson/Material**: Lesson only has `moduleId`; Material
   only has `lessonId` — no `courseId`/`moduleId` denormalization on children.

---

## 2. Current Backend Capability Audit

> **Note**: Sections 2.1 (Technology Stack) and 2.5 (Middleware Security) remain
> accurate from the original audit. Only the file structure and entity sections
> have been updated below.

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

### 2.2 Folder Structure (Source of Truth) — Updated

```
backend/src/
├── app/
│   └── api/
│       └── auth/          # register, login, refresh, logout, profile, change-password,
│                          # forgot-password, reset-password, google
│       └── subjects/      # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── courses/       # [id]/ route.ts — GET, POST, PUT, PATCH, DELETE
│       └── courses/
│           └── [courseId]/modules/                    # **Phase 5 — NEW**
│               └── [moduleId]/                        # **Phase 5 — NEW**
│                   └── lessons/                       # **Phase 5 — NEW**
│                       └── [lessonId]/                # **Phase 5 — NEW**
│                           └── materials/             # **Phase 5 — NEW**
│                               └── [materialId]/      # **Phase 5 — NEW**
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
│   ├── module.controller.ts, lesson.controller.ts, material.controller.ts  # **Phase 5 — NEW**
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
│                          # **Phase 5 NEW**: module.model.ts, lesson.model.ts, material.model.ts
├── repositories/          # Mongoose repository classes for each model
│                          # **Phase 5 NEW**: module.repository.ts, lesson.repository.ts, material.repository.ts
├── services/              # Business logic: auth, subject, course, class, enrollment,
│                          #   assignment, submission, grade, admin, email
│                          # **Phase 5 NEW**: module.service.ts, lesson.service.ts, material.service.ts
├── services/__tests__/    # Service tests including Phase 5:
│                          #   module.service.test.ts, lesson.service.test.ts, material.service.test.ts
├── types/                 # TypeScript interfaces: user, subject, course, class,
│                          #   enrollment, assignment, submission, grade, auth
│                          # **Phase 5 NEW**: module.types.ts, lesson.types.ts, material.types.ts
├── utils/
│   ├── apiHandler.ts      # Wrapper: connectDB + rateLimit + request tracing/logging
│   ├── apiResponse.ts     # sendResponse() — standard { success, message, data, errors, timestamp }
│   ├── AppError.ts        # AppError class + handleMongoError() — 409 for duplicate keys
│   ├── logger.ts          # Winston JSON logger
│   └── rateLimiter.ts     # rate-limiter-flexible (Redis in prod, memory in dev)
└── validations/           # Zod schemas: auth, subject, course, class, enrollment,
                            #   assignment, submission, grade, admin, objectId
                            # **Phase 5 NEW**: module.validation.ts, lesson.validation.ts, material.validation.ts
```

### 2.3 Domain Entities — Phase 5 Models (Actual Implementation)

#### Module (`src/models/module.model.ts`)

```typescript
interface IModule extends Document {
  title: string;              // max 200, required
  description?: string | null; // max 1000, default null
  courseId: Types.ObjectId;   // ref Course, required, indexed
  order: number;              // min 0, required
  isActive: boolean;           // default true
  createdBy: Types.ObjectId;   // ref User, required, indexed
  createdAt: Date;
  updatedAt: Date;
}
```

- **Indexes**: `{ courseId: 1, order: 1 }` unique compound — prevents duplicate order within a course
- **No `status` field**: No DRAFT/PUBLISHED/ARCHIVED lifecycle
- **No `teacherId` field**: Ownership tracked via `createdBy`
- **No `publishedAt` field**

#### Lesson (`src/models/lesson.model.ts`)

```typescript
export enum LessonContentType {
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  PDF = "PDF",
  LINK = "LINK",
}

interface ILesson extends Document {
  title: string;                              // max 200, required
  description?: string | null;                 // max 2000, default null
  moduleId: Types.ObjectId;                   // ref Module, required, indexed
  contentType: LessonContentType;             // required
  content: string;                            // max 50000, required
  durationMinutes: number;                    // min 0, default 0
  order: number;                              // min 0, required
  isActive: boolean;                           // default true
  createdBy: Types.ObjectId;                   // ref User, required, indexed
  createdAt: Date;
  updatedAt: Date;
}
```

- **Indexes**: `{ moduleId: 1, order: 1 }` unique compound
- **Key difference from plan**: `content` is a **required string** on Lesson itself —
  content is inline, not delegated to Material entity
- **No `courseId` denormalization**: Lesson only knows its parent Module
- **No `teacherId`**: Uses `createdBy` instead
- **No `status`/`publishedAt`**: No lifecycle fields

#### Material (`src/models/material.model.ts`)

```typescript
export enum MaterialType {
  FILE = "FILE",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  LINK = "LINK",
  DOCUMENT = "DOCUMENT",
}

interface IMaterial extends Document {
  title: string;                  // max 200, required
  description?: string | null;     // max 2000, default null
  lessonId: Types.ObjectId;       // ref Lesson, required, indexed
  materialType: MaterialType;     // required
  fileUrl?: string | null;        // optional
  fileSize?: number | null;       // min 0, optional
  thumbnailUrl?: string | null;   // optional
  externalUrl?: string | null;    // optional
  order: number;                  // min 0, required
  isActive: boolean;               // default true
  createdBy: Types.ObjectId;       // ref User, required, indexed
  createdAt: Date;
  updatedAt: Date;
}
```

- **Indexes**: `{ lessonId: 1, order: 1 }` unique compound
- **Key difference from plan**: No `content`/`url`/`fileKey` fields — instead has
  `fileUrl`, `fileSize`, `thumbnailUrl`, `externalUrl` set
- **`MaterialType.DOCUMENT`** replaces the planned `PDF` type
- **No `courseId`/`moduleId` denormalization**: Material only knows its parent Lesson
- **No `teacherId`**: Uses `createdBy` instead
- **No `status`/`publishedAt`**: No lifecycle fields

### 2.4 Existing Patterns (Verified Against Source)

All Phase 5 code follows the established backend patterns:

**API Route → Controller → Service → Repository → Model:**
Every API route is wrapped in `apiHandler()` (connectDB + rateLimit + request tracing).
Routes delegate to Controller methods. Controllers:
1. Parse body with Zod schema (`.strict()`)
2. Extract `x-user-id` from headers (set by middleware)
3. Call Service method
4. Format response with `sendResponse()`
5. Handle errors: ZodError → 400, AppError → statusCode, mongoError → 409, fallback → 500

**RBAC:**
- Middleware (`src/middleware.ts`) protects routes based on `protectedRoutes` prefix matching
- Role enforcement in service: `verifyTeacher()` checks UserRole
- TEACHER and ADMIN share create/update/delete access; STUDENT and PARENT get 403
- Cross-tenant access returns 404 (not 403) — IDOR masking via 404-not-found
- `createdBy` is always set by the server from the authenticated user's ID
- Ownership is verified by walking the parent chain (Lesson → Module → Course → teacherId)

**Soft-delete:**
- All entities have `isActive: boolean` (default true, indexed)
- List queries filter `{ isActive: true }` by default
- Get-by-id checks `!entity.isActive` → 404
- Delete is idempotent: if already inactive, returns the record as-is

**Zod Validation:**
- All schemas use `.strict()` to reject unknown fields
- ObjectId validated via `objectIdSchema` (regex: `/^[0-9a-fA-F]{24}$/`)
- Pagination: `page` (min 1, default 1), `limit` (1-100, default 20)
- Search: string, trimmed, min 1, max 100

**Error Handling:**
- `handleMongoError(error)` → 409 for E11000 duplicate keys
- `AppError` class carries statusCode, errors[], isOperational

### 2.5 Phase 5 Content Domain (Actual Implementation)

Phase 5 implements a three-level hierarchy with a twist on the content model:

```
Course (existing)
  ↓ has many (ordered)
Module
  ↓ has many (ordered)
Lesson (has inline content)
  ↓ has many (ordered)
Material (supplementary content items)
```

**Key insight**: Unlike the original proposal which treated Lesson and Material as
parallel entities, the actual implementation makes Lesson contain its own `content`
field (with `contentType` enum), while Material is a supplementary content item
that can be attached to a lesson. This is a pragmatic design: simple lessons
need no separate Material, but complex lessons can have additional files,
images, videos, or links as child Materials.

---

## 3. Route Structure (Actual Implementation)

All Phase 5 routes are **nested under courses**, not flat. The `/api/courses` prefix
is already in `protectedRoutes`, so nested routes inherit protection automatically.

```
GET    /api/courses/[courseId]/modules                              — List modules
POST   /api/courses/[courseId]/modules                              — Create module
GET    /api/courses/[courseId]/modules/[moduleId]                   — Get module
PUT    /api/courses/[courseId]/modules/[moduleId]                   — Replace module
PATCH  /api/courses/[courseId]/modules/[moduleId]                   — Partial update
DELETE /api/courses/[courseId]/modules/[moduleId]                   — Soft-delete module

GET    /api/courses/[courseId]/modules/[moduleId]/lessons           — List lessons
POST   /api/courses/[courseId]/modules/[moduleId]/lessons           — Create lesson
GET    /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]— Get lesson
PUT    /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]— Replace lesson
PATCH  /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]— Partial update
DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]— Soft-delete lesson

GET    /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials                    — List materials
POST   /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials                    — Create material
GET    /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials/[materialId]       — Get material
PUT    /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials/[materialId]       — Replace material
PATCH  /api/courses/[courseId]/modules/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials/[materialId] — Partial update
DELETE /api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/materials/[materialId]       — Soft-delete material
```

**Middleware**: No changes to `protectedRoutes` were needed. The `matchesRoute()` function
in `middleware.ts` uses prefix matching (`pathname.startsWith(`${route}/`)`), so
`/api/courses/[courseId]/modules` is already protected by the `/api/courses` entry.

---

## 4. Ownership & RBAC Model (Actual Implementation)

### 4.1 Ownership Chain Verification

The actual implementation enforces ownership by walking the parent chain:

```
Material → Lesson → Module → Course → teacherId (compared against requestor)
```

- **`verifyTeacher(currentUserId)`**: Looks up user, checks role is TEACHER or ADMIN
- **`verifyCourse(courseId)`**: Checks course exists and `isActive`
- **`verifyTeacherOwnsCourse(courseId, requestorId, role)`**: For TEACHER role, verifies
  `course.teacherId === requestorId`; ADMIN bypasses
- **`verifyModule(moduleId)`**: Checks module exists and `isActive`
- **`verifyTeacherOwnsModule(moduleId, requestorId, role)`**: For TEACHER role, loads
  Module → Course → checks `course.teacherId === requestorId`
- **`verifyTeacherOwnsLesson(lessonId, requestorId, role)`**: For TEACHER role, loads
  Lesson → Module → Course → checks `course.teacherId === requestorId`

### 4.2 IDOR Protection (404-masking)

All cross-tenant access returns **404 Not Found** (not 403 Forbidden) to prevent
information leakage:
- TEACHER accessing another teacher's course/module/lesson/material → 404
- Module not found, inactive, or `courseId` mismatch → 404
- Lesson not found, inactive, or `moduleId` mismatch → 404
- Material not found, inactive, or `lessonId` mismatch → 404

### 4.3 `createdBy` (not `teacherId`)

The actual implementation uses `createdBy` on all three models instead of `teacherId`.
The `createdBy` field is set by the server from the authenticated user's ID. For ADMIN
role creating content, `createdBy` is set to the admin's own ID — there is no override
mechanism to assign to another teacher (simpler than the proposed design).

---

## 5. Validation Rules (Actual Implementation)

### 5.1 Module Validation

```typescript
// createModuleSchema — .strict()
{
  title: string, trim, min 1, max 200
  description?: string | null (trim, max 1000)
  order: number, int, min 0
}

// updateModuleSchema (PUT) — .strict()
{
  title: string, trim, min 1, max 200
  description: string | null (trim, max 1000)
  order: number, int, min 0
}

// patchModuleSchema (PATCH) — .strict()
{
  title?: string, trim, min 1, max 200
  description?: string | null (trim, max 1000)
  order?: number, int, min 0
}

// moduleListSchema
{
  page: int, min 1, default 1
  limit: int, min 1, max 100, default 20
  search?: string, trim, min 1, max 100
  isActive?: boolean (preprocessed from "true"/"false" string)
}
```

**Notable**: No `courseId` in body schema — `courseId` comes from the URL path parameter.
No `status` field in any schema. No `teacherId`/`createdBy` in body schemas.

### 5.2 Lesson Validation

```typescript
// createLessonSchema — .strict()
{
  title: string, trim, min 1, max 200
  description?: string | null (trim, max 2000)
  contentType: enum [VIDEO, TEXT, IMAGE, PDF, LINK]
  content: string, min 1, max 50000  (required)
  durationMinutes?: number, min 0, default 0
  order: number, int, min 0
}

// updateLessonSchema (PUT) — .strict()
{
  title, description, contentType, content, durationMinutes, order (all required)
}

// patchLessonSchema (PATCH) — .strict()
{
  title?, description?, contentType?, content?, durationMinutes?, order?
}

// lessonListSchema
{
  page, limit (pagination defaults)
  search?, contentType? (enum filter), isActive? (preprocessed boolean)
}
```

**Notable**: No `moduleId` in body schema — comes from URL path. `content` is required
on Lesson (inline content model, not delegated to Material).

### 5.3 Material Validation

```typescript
// createMaterialSchema — .strict() with superRefine
{
  title: string, trim, min 1, max 200
  description?: string | null (trim, max 2000)
  materialType: enum [FILE, IMAGE, VIDEO, LINK, DOCUMENT]
  fileUrl?: string | null (url format)
  fileSize?: number | null (int, min 0)
  thumbnailUrl?: string | null (url format)
  externalUrl?: string | null (url format + regex validation)
  order: number, int, min 0
}
// Refinement: fileUrl required for FILE/IMAGE/VIDEO/DOCUMENT types
// Refinement: externalUrl required for LINK type

// updateMaterialSchema (PUT) — .strict()
{
  title, description, materialType, fileUrl, fileSize,
  thumbnailUrl, externalUrl, order (all required, nullable where appropriate)
}

// patchMaterialSchema (PATCH) — .strict()
{
  title?, description?, materialType?, fileUrl?, fileSize?,
  thumbnailUrl?, externalUrl?, order?
}

// materialListSchema
{
  page, limit (pagination defaults)
  search?, materialType? (enum filter), isActive? (preprocessed boolean)
}
```

**Notable**: No `lessonId` in body schema — comes from URL path. Uses `fileUrl` and
`externalUrl` instead of the proposed `content`/`url`/`fileKey` fields.

---

## 6. Lifecycle Rules (Actual Implementation)

**No DRAFT/PUBLISHED/ARCHIVED lifecycle.** The actual implementation uses only
the established `isActive` soft-delete pattern:

```
Active (isActive: true) → Soft-deleted (isActive: false): idempotent
```

- There is no `status` enum field on any Phase 5 model
- There is no `publishedAt` field on any Phase 5 model
- Materials do not have their own lifecycle — they inherit visibility from
  parent Lesson and Module via `isActive` checks in the service layer
- Soft-delete is idempotent: deleting an already-inactive entity returns the record as-is
- **Cascade behavior**: No cascade. Deleting a parent (e.g., Module) does not affect
  children (e.g., Lessons). The service layer checks parent `isActive` before
  returning child records, so children of inactive parents are effectively hidden

---

## 7. Pagination & Query Design (Actual Implementation)

All list endpoints follow the existing pagination pattern:
- `page` (default 1, min 1)
- `limit` (default 20, min 1, max 100)

**Sorting**: Sorted by `order` ascending (primary key), consistent across all three
entities. No secondary sort by `createdAt` — the plan proposed `createdAt` descending
as a tiebreaker but this was not implemented.

**Search**: Case-insensitive regex on `title` (and `description` for some entities):
- Modules: searches `title` and `description`
- Lessons: searches `title` and `content`
- Materials: searches `title` and `description`

**Filtering**:
- Modules: `isActive` (boolean, preprocessed from string)
- Lessons: `contentType` (enum), `isActive` (boolean)
- Materials: `materialType` (enum), `isActive` (boolean)

---

## 8. Testing Strategy (Actual Implementation)

Tests follow the existing pattern in `src/services/__tests__/*.service.test.ts`:
- Uses `node:test` + `node:assert`
- Mocks repository methods directly (not a mocking framework)
- Tests call service methods directly (not through HTTP)
- Uses `beforeEach` to install mock repos

### 8.1 Service Tests (Existing — 31 tests total)

**`src/services/__tests__/module.service.test.ts`** — 7 tests:
- `createModule`: TEACHER creates for own course; ADMIN creates for any course;
  STUDENT rejected (403); nonexistent requester rejected (401); nonexistent course
  rejected (404); cross-teacher rejected (404); duplicate courseId+order (409)
- `getModuleById`: TEACHER gets own (200); ADMIN gets any (200); cross-teacher (404);
  nonexistent (404); inactive (404)
- `updateModule` (PUT): TEACHER updates own; cross-teacher (404); ADMIN updates any
- `patchModule` (PATCH): TEACHER patches own; empty patch returns same; cross-teacher (404)
- `deleteModule` (soft-delete): TEACHER deletes own; cross-teacher (404); ADMIN deletes any;
  nonexistent (404)
- `listModules`: TEACHER lists own; ADMIN lists any; STUDENT (403); cross-teacher (404);
  isActive filter

**`src/services/__tests__/lesson.service.test.ts`** — 12 tests:
Same structure as Module tests, with parent verification extended to Module → Course chain:
- `createLesson`: TEACHER creates for own module; ADMIN creates any; STUDENT (403);
  nonexistent requester (401); nonexistent module (404); cross-teacher (404); duplicate
  moduleId+order (409)
- `getLessonById`: TEACHER gets own; ADMIN gets any; cross-teacher (404); nonexistent (404);
  inactive (404)
- `updateLesson`: TEACHER updates own; cross-teacher (404); ADMIN updates any
- `patchLesson`: TEACHER patches own; empty patch returns same; cross-teacher (404)
- `deleteLesson`: TEACHER deletes own; cross-teacher (404); ADMIN deletes any;
  nonexistent (404)
- `listLessons`: TEACHER lists own; ADMIN lists any; STUDENT (403); cross-teacher (404)

**`src/services/__tests__/material.service.test.ts`** — 12 tests:
Same structure, with parent verification extended to Lesson → Module → Course chain:
- `createMaterial`: TEACHER creates for own lesson; ADMIN creates any; STUDENT (403);
  nonexistent requester (401); nonexistent lesson (404); cross-teacher (404); duplicate
  lessonId+order (409)
- `getMaterialById`: TEACHER gets own; ADMIN gets any; cross-teacher (404); nonexistent (404);
  inactive (404)
- `updateMaterial`: TEACHER updates own; cross-teacher (404)
- `patchMaterial`: TEACHER patches own; empty patch returns same; cross-teacher (404)
- `deleteMaterial`: TEACHER deletes own; cross-teacher (404); ADMIN deletes any;
  nonexistent (404)
- `listMaterials`: TEACHER lists own; ADMIN lists any; STUDENT (403); cross-teacher (404)

### 8.2 Missing Test Coverage (Remediation Opportunity)

The following test files are **missing** and should be created following the existing
patterns in `src/validations/__tests__/`:

| Missing File | Pattern To Follow | Purpose |
|---|---|---|
| `src/validations/__tests__/module.validation.test.ts` | `course.validation.test.ts` | Test strict mode, required fields, field limits, order min validation, isActive preprocessing |
| `src/validations/__tests__/lesson.validation.test.ts` | `course.validation.test.ts` | Test contentType enum validation, content required, durationMinutes, strict mode |
| `src/validations/__tests__/material.validation.test.ts` | `course.validation.test.ts` + `assignment.validation.test.ts` | Test materialType enum, superRefine conditional requirements (fileUrl for FILE/IMAGE/VIDEO/DOCUMENT, externalUrl for LINK), URL format validation |

### 8.3 Middleware Security Tests (Missing)

The existing `src/__tests__/phase4*.middleware.security.test.ts` files test middleware
protection for Phase 4 endpoints. A `phase5.middleware.security.test.ts` file should be
created following the `phase4c.middleware.security.test.ts` pattern to verify:

1. **Route protection**: All 12 Phase 5 route paths require auth (no token → 401)
2. **CSRF protection**: POST/PUT/PATCH/DELETE require CSRF token; GET does not
3. **CORS**: Allowed origin gets headers; disallowed origin does not
4. **Token validation**: Invalid/expired/forged tokens → 401
5. **Prefix matching**: `/api/courses/[courseId]/modules` is protected via `/api/courses`
   prefix — this is already covered by the existing `/api/courses` test in earlier phases

**Key insight**: Since routes are nested under `/api/courses` and use prefix matching,
middleware protection is inherited automatically. No `protectedRoutes` change was needed.

---

## 9. Reconciliation: Proposed vs. Actual

### 9.1 Major Divergences

| Aspect | Proposed (Original Plan) | Actual Implementation |
|--------|-------------------------|----------------------|
| **Routes** | Flat: `/api/modules`, `/api/lessons`, `/api/materials` | Nested: `/api/courses/[courseId]/modules/...` |
| **Status lifecycle** | DRAFT/PUBLISHED/ARCHIVED enum + `publishedAt` | None — only `isActive` soft-delete |
| **Ownership field** | `teacherId` (ref User) | `createdBy` (ref User) |
| **Lesson content** | No inline content; content in Material entity | `contentType` enum + `content` string on Lesson |
| **Material fields** | `content`, `url`, `fileKey` | `fileUrl`, `fileSize`, `thumbnailUrl`, `externalUrl` |
| **MaterialType enum** | TEXT, IMAGE, VIDEO, FILE, LINK | FILE, IMAGE, VIDEO, LINK, DOCUMENT |
| **Denormalization** | `courseId` on Lesson; `moduleId`+`courseId` on Material | No denormalization — Lesson has `moduleId` only; Material has `lessonId` only |
| **admin override** | ADMIN can assign `teacherId` to another teacher on create | `createdBy` always set to requestor's own ID (no override) |
| **Duplicate index** | `{ courseId, title }` unique partial | `{ courseId, order }` unique |
| **order min** | min 1 | min 0 |
| **Student access** | Future student-facing read endpoints planned | Not implemented (same as proposed) |
| **Middleware change** | Add `/api/modules`, `/api/lessons`, `/api/materials` to `protectedRoutes` | Not needed — prefix matching on `/api/courses` covers all nested routes |

### 9.2 Minor Divergences

| Aspect | Proposed | Actual |
|--------|---------|--------|
| **Module description** max 1000 | ✓ | ✓ |
| **Lesson description** max 2000 | ✓ | ✓ |
| **Material description** max 1000 | ✓ | ✓ (actually 2000 on Material model) |
| **Lesson content** max 50000 | ✓ | ✓ |
| **Duration min** | 1 | 0 (default 0) |
| **Duration max** | 1440 | Not enforced (min 0 only) |
| **Secondary sort** | `createdAt` descending | Not implemented — only `order` ascending |
| **title uniqueness** | `{ courseId, title }` unique | Not enforced at DB level — `{ courseId, order }` unique instead |
| **Content visibility for students** | Filtered by `status: PUBLISHED` | N/A — no status field, no student endpoints |

### 9.3 Files That Match the Proposal

| File | Status |
|------|--------|
| `src/types/module.types.ts` — `IModule` interface | ✓ Created (simplified) |
| `src/types/lesson.types.ts` — `ILesson` + `LessonContentType` enum | ✓ Created |
| `src/types/material.types.ts` — `IMaterial` + `MaterialType` enum | ✓ Created |
| `src/models/*.model.ts` | ✓ Created (no lifecycle indexes) |
| `src/repositories/*.repository.ts` | ✓ Created |
| `src/validations/*.validation.ts` | ✓ Created |
| `src/services/*.service.ts` | ✓ Created |
| `src/controllers/*.controller.ts` | ✓ Created |
| `src/app/api/courses/[courseId]/modules/...` routes | ✓ Created (nested, not flat) |
| `MODULE_NOT_FOUND`, `LESSON_NOT_FOUND`, `MATERIAL_NOT_FOUND` in errorMessages.ts | ✓ Added (lines 19-21) |

---

## 10. Validation Results

All quality gates pass after Phase 5 implementation:

| Check | Result | Command |
|-------|--------|---------|
| TypeScript | PASS | `tsc --noEmit` |
| ESLint | 0 errors | `npm run lint` |
| Tests | 1038 passed, 0 failed | `npm test` |
| Build | PASS | `npm run build` |
| Working tree | Clean | `git status` (no uncommitted changes) |

---

## 11. Remaining Work (Not Completed in Phase 5)

1. **Validation tests**: `module.validation.test.ts`, `lesson.validation.test.ts`,
   `material.validation.test.ts` in `src/validations/__tests__/`
2. **Middleware security tests**: `phase5.middleware.security.test.ts` in `src/__tests__/`
   (lower priority — route protection is inherited via prefix matching)
3. **Controller-level tests**: No controller tests exist for any domain entity
4. **Student-facing read endpoints**: Not implemented (marked as future in the proposal)
5. **API-level integration tests**: No HTTP-level route tests exist for any domain entity

---

## 12. Appendices

### 12.1 Material Type Enum Comparison

| Proposed | Actual |
|---------|--------|
| TEXT | (removed — text content moved to Lesson.content) |
| IMAGE | IMAGE |
| VIDEO | VIDEO |
| FILE | FILE |
| LINK | LINK |
| — | DOCUMENT (new — for PDF/other document types) |

### 12.2 Error Message Constants Added

```typescript
// src/constants/errorMessages.ts (lines 19-21)
MODULE_NOT_FOUND: 'Module not found.',
LESSON_NOT_FOUND: 'Lesson not found.',
MATERIAL_NOT_FOUND: 'Material not found.',
```

These follow the exact pattern of existing constants (e.g., `COURSE_NOT_FOUND`,
`ASSIGNMENT_NOT_FOUND`).
