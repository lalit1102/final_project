# Phase 2 Feature Plan — Subjects + Courses + Classes

## 1. Executive Summary

This document is the **planning-only** specification for Phase 2 of the LearnSphere backend. It covers three domains: **Subjects**, **Courses**, and **Classes**. No production code is implemented in this phase.

The recommended domain relationship is:

```
User (TEACHER) → Subject → Course → Class
```

- **Subject**: A topic/area of study owned by a teacher (e.g., "Mathematics", "Physics").
- **Course**: A specific instance of a subject taught by a teacher (e.g., "Mathematics 101" by Teacher Alice).
- **Class**: A group of students enrolled in a course (e.g., "Mathematics 101 — Section A").

Phase 2 deliberately does **NOT** implement Enrollment, which is reserved for Phase 3. The dependency interface is documented in Section 12.

## 2. Actual Backend Baseline

### Environment

| Component | Version |
|-----------|---------|
| Next.js | 16.2.11 (App Router) |
| TypeScript | 5.x (`strict: true`) |
| MongoDB | 9.8.0 (via Mongoose 9.8.0) |
| JWT | `jsonwebtoken` ^9.0.3 + `jose` ^6.2.6 (edge) |
| Zod | ^4.4.3 |
| Test runner | `node:test` via `tsx --test` |

### Architecture (confirmed)

```
Route (src/app/api/*/route.ts)
  ↓
Controller (src/controllers/*.controller.ts)
  ↓
Service (src/services/*.service.ts)
  ↓
Repository (src/repositories/*.repository.ts)
  ↓
Model (src/models/*.model.ts)
  ↓
Mongoose Schema → MongoDB
```

### Established patterns

| Concern | Implementation |
|---------|---------------|
| API wrapper | `apiHandler` — DB connection, rate limiting, ZodError → 400 |
| Response envelope | `sendResponse` → `{ success, message, data, errors, timestamp }` |
| Error class | `AppError` (statusCode, errors[], isOperational) |
| MongoDB duplicate-key handling | `handleMongoError` (code 11000 → 409) |
| Auth middleware | JWT → `x-user-id` / `x-user-role` headers |
| CSRF | Double-submit cookie pattern (cookie + `x-csrf-token` header) |
| Rate limiting | `rate-limiter-flexible` (100 req/60s) |
| Sanitization | `sanitizeUser` strips password/refreshToken/etc. |
| ObjectId validation | `objectIdRegex = /^[0-9a-fA-F]{24}$/` in `userIdParamSchema` |
| Pagination | `page` (coerce, default 1), `limit` (coerce, 1–100, default 20) |
| CORS | Allowlist against `FRONTEND_ORIGIN` |

### Existing files relevant to Phase 2

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Auth + CSRF + CORS middleware |
| `src/utils/apiHandler.ts` | Route wrapper (DB, rate limit, ZodError handling) |
| `src/utils/AppError.ts` | Error class + `handleMongoError` |
| `src/utils/apiResponse.ts` | `sendResponse` envelope |
| `src/constants/statusCodes.ts` | HTTP status code constants |
| `src/constants/errorMessages.ts` | Error message constants (extendable) |
| `src/validations/admin.validation.ts` | Admin user validation (pagination, ObjectId param) |
| `src/lib/userSanitization.ts` | `sanitizeUser` pattern to reuse |
| `src/repositories/user.repository.ts` | Repository pattern to follow |
| `src/services/admin.service.ts` | Service pattern with `verifyAdmin` to follow |
| `src/controllers/admin.controller.ts` | Controller pattern to follow |

### Phase 1 validation baseline

- Tests: **124** (98 original + 26 new) — all passing
- TypeScript: PASS
- Lint: PASS (0 errors, 3 pre-existing warnings)
- Build: PASS

## 3. Subject Domain Audit

| Artifact | Status | Notes |
|----------|--------|-------|
| Model | **MISSING** | No `Subject` model exists |
| Type/interface | **MISSING** | No `ISubject` type |
| Repository | **MISSING** | No `subject.repository.ts` |
| Service | **MISSING** | No `subject.service.ts` |
| Controller | **MISSING** | No `subject.controller.ts` |
| API routes | **MISSING** | No `/api/subjects/` routes |
| Validation schemas | **MISSING** | No subject validation |
| Middleware authorization | **PARTIAL** | Admin route middleware exists (`adminRoutes = ["/api/admin"]`) but no subject-specific routes |
| RBAC | **PARTIAL** | `UserRole` enum confirmed: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` |
| Ownership rules | **MISSING** | No ownership concept exists |
| Database relationships | **MISSING** | No relationships defined |
| Indexes/unique constraints | **MISSING** | — |
| Sanitization requirements | **MISSING** | `sanitizeUser` exists as a pattern to follow |
| Error handling | **PARTIAL** | `AppError`, `handleMongoError`, `apiHandler` exist as infrastructure |
| Pagination/filtering/search | **PARTIAL** | `userListSchema` pagination pattern exists |
| Existing tests | **MISSING** | No subject tests |
| Missing tests | **ALL** | — |

## 4. Course Domain Audit

| Artifact | Status | Notes |
|----------|--------|-------|
| Model | **MISSING** | No `Course` model exists |
| Type/interface | **MISSING** | No `ICourse` type |
| Repository | **MISSING** | No `course.repository.ts` |
| Service | **MISSING** | No `course.service.ts` |
| Controller | **MISSING** | No `course.controller.ts` |
| API routes | **MISSING** | No `/api/courses/` routes |
| Validation schemas | **MISSING** | No course validation |
| Middleware authorization | **PARTIAL** | See Subject |
| RBAC | **PARTIAL** | See Subject |
| Ownership rules | **MISSING** | — |
| Database relationships | **MISSING** | Will reference Subject |
| Indexes/unique constraints | **MISSING** | — |
| Sanitization requirements | **MISSING** | Follow `sanitizeUser` pattern |
| Error handling | **PARTIAL** | Existing infrastructure reusable |
| Pagination/filtering/search | **PARTIAL** | Follow `userListSchema` pattern |
| Existing tests | **MISSING** | — |
| Missing tests | **ALL** | — |

## 5. Class Domain Audit

| Artifact | Status | Notes |
|----------|--------|-------|
| Model | **MISSING** | No `Class` model exists |
| Type/interface | **MISSING** | No `IClass` type |
| Repository | **MISSING** | No `class.repository.ts` |
| Service | **MISSING** | No `class.service.ts` |
| Controller / API routes | **MISSING** | No `/api/classes/` routes |
| Validation schemas | **MISSING** | No class validation |
| Middleware authorization | **PARTIAL** | See Subject |
| RBAC | **PARTIAL** | See Subject |
| Ownership rules | **MISSING** | — |
| Database relationships | **MISSING** | Will reference Course |
| Indexes/unique constraints | **MISSING** | — |
| Sanitization requirements | **MISSING** | Follow `sanitizeUser` pattern |
| Error handling | **PARTIAL** | Existing infrastructure reusable |
| Pagination/filtering/search | **PARTIAL** | Follow `userListSchema` pattern |
| Existing tests | **MISSING** | — |
| Missing tests | **ALL** | — |

## 6. User/Role Foundation

### Confirmed roles (from `src/types/user.types.ts`)

```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}
```

### Confirmed User model fields (from `src/models/user.model.ts`)

| Field | Type | Notes |
|-------|------|-------|
| `name` | String, required | |
| `email` | String, required, unique, indexed | |
| `password` | String, select:false | bcryptjs |
| `provider` | String enum (LOCAL, GOOGLE) | |
| `providerId` | String, sparse index | |
| `avatar` | String | |
| `role` | String enum, default STUDENT | |
| `permissions` | [String] | |
| `isActive` | Boolean, default true | |
| `isVerified` | Boolean, default false | |
| `refreshToken` | String, select:false | JWT |
| `lastLogin` | Date | |
| `loginAttempts` | Number | Account lockout |
| `lockUntil` | Date | Account lockout |
| `passwordChangedAt` | Date | |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Relationship fields available

**No** `studentId`, `employeeId`, `parentId`, `childId`, `dateOfBirth`, `gender`, `address`, `phone`, or similar relationship fields exist on the User model. These would need to be added in a future phase if teacher-student-parent relationships are required.

### JWT payload (confirmed from `src/types/auth.types.ts`)

```typescript
interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh' | 'reset';
}
```

The `userId` is propagated via `x-user-id` header in middleware. This is the **only** identity source for service-layer authorization.

## 7. Proposed Data Relationships

### Recommended relationship model

```
User (TEACHER, _id)
  │ owns (*)
  ↓
Subject (_id)
  │ contains (*)
  ↓
Course (_id, subjectId → Subject)
  │ teaches (*)
  ↓
Class (_id, courseId → Course, teacherId → User)
```

### Relationship questions answered

| Question | Answer | Rationale |
|----------|--------|-----------|
| Who owns a Subject? | A TEACHER (or ADMIN) | A subject is the conceptual area of study a teacher is qualified to teach. ADMIN can create subjects for any teacher. |
| Who owns a Course? | A TEACHER (or ADMIN) | A course is a specific offering of a subject. The `teacherId` on the Course defines ownership. |
| Who owns a Class? | A TEACHER (or ADMIN) | A class is a group of students taking a course. The `teacherId` defines who manages it. |
| Can one teacher own multiple subjects? | **Yes** | `subjects` use a flat Model; no array on User. Query `subjects` by `teacherId`. |
| Can one subject have multiple courses? | **Yes** | `Course.subjectId` is a single ObjectId ref → Subject. Multiple courses can reference the same subject (e.g., "Math 101", "Math 102"). |
| Can one course belong to multiple classes? | **Yes** | `Class.courseId` references a single Course. Multiple classes (sections) can reference the same course. |
| Can one class have multiple teachers? | **No** (keep simple) | `Class.teacherId` is a single ObjectId ref. Multi-teacher support can be added via a separate `classTeachers` join collection if needed later. |
| Who is the class teacher? | `teacherId` field on Class | Direct ObjectId reference to User. |
| Where should teacher ownership be stored? | `teacherId` field on Subject, Course, and Class | Simple, queryable, consistent with existing patterns. |
| Which relationships use ObjectId references? | All three: `Course.subjectId`, `Class.courseId`, `Class.teacherId` | Direct references are simpler and sufficient for Phase 2. |
| Which relationships should use arrays? | None for Phase 2 | Avoid overengineering. |
| Which relationships should use separate collections? | None for Phase 2 | Join tables add complexity; not needed until many-to-many is required. |

### Dependency chain for Phase 3 (Enrollment)

Enrollment will need:
- `studentId` → User (STUDENT role)
- `classId` → Class

This means the `Class` model must exist before Enrollment can be implemented. No changes to the relationship design are anticipated.

## 8. RBAC + Authorization Design

### Role matrix

| Action | ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------|---------|---------|--------|
| List Subjects (all) | ✅ | ❌ (own only) | ❌ | ❌ |
| List Subjects (own) | ✅ (any) | ✅ | ❌ | ❌ |
| Create Subject | ✅ | ✅ | ❌ | ❌ |
| Get Subject (any) | ✅ | ✅ | ❌ | ❌ |
| Update Subject (owner) | ✅ (any) | ✅ (own) | ❌ | ❌ |
| Delete Subject (owner) | ✅ (any) | ✅ (own) | ❌ | ❌ |
| Create Course | ✅ | ✅ | ❌ | ❌ |
| Update Course (owner) | ✅ | ✅ (own) | ❌ | ❌ |
| Delete Course (owner) | ✅ | ✅ (own) | ❌ | ❌ |
| Create Class | ✅ | ✅ | ❌ | ❌ |
| Update Class (owner) | ✅ | ✅ (own) | ❌ | ❌ |
| Delete Class (owner) | ✅ | ✅ (own) | ❌ | ❌ |
| List Classes (student view) | N/A | N/A | Phase 3 | N/A |

### Defense-in-depth authorization layers

```
Route / Middleware
  ↓ (JWT → x-user-id / x-user-role headers)
Controller
  ↓ (passes currentUserId from header to service)
Service
  ↓ (verifyRole + verifyOwnership)
Repository
  ↓ (scoped query: { teacherId: currentUserId })
Model
```

**Layer 1 — Middleware**: Role-based route protection.
- `/api/subjects/*`, `/api/courses/*`, `/api/classes/*` → require authentication (all roles except ADMIN bypass).
- For write operations (POST/PUT/PATCH/DELETE), ADMIN and TEACHER are allowed through middleware; STUDENT and PARENT are rejected at the middleware level (403).
- Middleware does NOT check ownership (that's service-layer).

**Layer 2 — Service**: Ownership verification.
- `verifyTeacher(currentUserId)` — verifies user exists, is active, and has role TEACHER or ADMIN.
- For update/delete operations, the service checks that the resource's `teacherId` matches `currentUserId` (ADMIN bypasses ownership check).
- This mirrors the Phase 1 `verifyAdmin` pattern.

**Layer 3 — Repository**: Scoped queries.
- For list operations, the repository filters by `teacherId` for teachers.
- For get/update/delete, the repository query includes both `_id` and `teacherId` to prevent any race condition from returning another teacher's resource.

### Attack scenarios

| Scenario | Expected result | Layer that stops it |
|----------|----------------|-------------------|
| Teacher A updates Teacher B's course | 403 Forbidden | Service ownership check |
| Student POSTs to `/api/subjects` | 403 Forbidden | Middleware role check |
| Teacher A lists all subjects (not just their own) | Only returns Teacher A's subjects | Repository query filter |
| Unauthenticated GET `/api/subjects` | 401 Unauthorized | Middleware auth check |
| Student tries to delete a class via crafted request | 403 Forbidden | Middleware + service |
| Admin creates subject for another teacher | Allowed (ADMIN scope) | Service verifyTeacher accepts ADMIN |
| Parent role accessing any Phase 2 endpoint | 403 Forbidden | Middleware role check |

## 9. API Contract

All endpoints follow the existing conventions:
- Authentication via cookies (accessToken)
- CSRF required for POST/PUT/PATCH/DELETE (double-submit cookie)
- Uses `apiHandler` wrapper (DB connect, rate limit, ZodError → 400)
- Response envelope: `sendResponse(data, message, errors)`
- Zod validation with `.strict()`
- ObjectId param validation via `objectIdRegex`
- Pagination via `paginationSchema` pattern

### SUBJECTS

```
GET    /api/subjects          — List subjects (admin: all; teacher: own)
POST   /api/subjects          — Create a subject (admin, teacher)
GET    /api/subjects/:id      — Get a subject (admin, teacher own)
PUT    /api/subjects/:id      — Full update (admin, teacher own)
PATCH  /api/subjects/:id      — Partial update (admin, teacher own)
DELETE /api/subjects/:id      — Soft-deactivate (active=false) (admin, teacher own)
```

| Method | Route | Auth | Roles | Ownership | Body | Query | Params | Success | Errors |
|--------|-------|------|-------|-----------|------|-------|--------|---------|--------|
| GET | `/api/subjects` | Yes | ALL | N/A (scoped) | — | `page`, `limit`, `search` | — | 200 + paginated list | 401, 403 |
| POST | `/api/subjects` | Yes | ADMIN, TEACHER | — | `name`, `code`, `description?` | — | — | 201 + subject | 400, 401, 403, 409 |
| GET | `/api/subjects/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` (ObjectId) | 200 + subject | 400, 401, 403, 404 |
| PUT | `/api/subjects/:id` | Yes | ADMIN, TEACHER | scoped | `name`, `code`, `description?` | — | `:id` | 200 + subject | 400, 401, 403, 404, 409 |
| PATCH | `/api/subjects/:id` | Yes | ADMIN, TEACHER | scoped | `name?`, `code?`, `description?` | — | `:id` | 200 + subject | 400, 401, 403, 404, 409 |
| DELETE | `/api/subjects/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` | 200 + subject (isActive=false) | 400, 401, 403, 404 |

**PUT vs PATCH semantics**: PUT = full replacement (all required fields); PATCH = partial update (all fields optional). This is a deliberate design decision — unlike the admin user endpoints where PUT preserves partial-update behavior for compatibility, these are new endpoints so proper REST semantics apply from the start.

### COURSES

```
GET    /api/courses          — List courses (admin: all; teacher: own)
POST   /api/courses          — Create a course (admin, teacher)
GET    /api/courses/:id      — Get a course (admin, teacher own)
PUT    /api/courses/:id      — Full update (admin, teacher own)
PATCH  /api/courses/:id      — Partial update (admin, teacher own)
DELETE /api/courses/:id      — Soft-deactivate (admin, teacher own)
```

| Method | Route | Auth | Roles | Ownership | Body | Query | Params | Success | Errors |
|--------|-------|------|-------|-----------|------|-------|--------|---------|--------|
| GET | `/api/courses` | Yes | ADMIN, TEACHER | scoped | — | `page`, `limit`, `search`, `subjectId?` | — | 200 + paginated list | 401, 403 |
| POST | `/api/courses` | Yes | ADMIN, TEACHER | — | `name`, `code`, `description?`, `subjectId` | — | — | 201 + course | 400, 401, 403, 404, 409 |
| GET | `/api/courses/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` | 200 + course | 400, 401, 403, 404 |
| PUT | `/api/courses/:id` | Yes | ADMIN, TEACHER | scoped | `name`, `code`, `description?`, `subjectId` | — | `:id` | 200 + course | 400, 401, 403, 404, 409 |
| PATCH | `/api/courses/:id` | Yes | ADMIN, TEACHER | scoped | `name?`, `code?`, `description?`, `subjectId?` | — | `:id` | 200 + course | 400, 401, 403, 404, 409 |
| DELETE | `/api/courses/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` | 200 + course (isActive=false) | 400, 401, 403, 404 |

### CLASSES

```
GET    /api/classes          — List classes (admin: all; teacher: own)
POST   /api/classes          — Create a class (admin, teacher)
GET    /api/classes/:id      — Get a class (admin, teacher own)
PUT    /api/classes/:id      — Full update (admin, teacher own)
PATCH  /api/classes/:id      — Partial update (admin, teacher own)
DELETE /api/classes/:id      — Soft-deactivate (admin, teacher own)
```

| Method | Route | Auth | Roles | Ownership | Body | Query | Params | Success | Errors |
|--------|-------|------|-------|-----------|------|-------|--------|---------|--------|
| GET | `/api/classes` | Yes | ADMIN, TEACHER | scoped | — | `page`, `limit`, `search`, `courseId?` | — | 200 + paginated list | 401, 403 |
| POST | `/api/classes` | Yes | ADMIN, TEACHER | — | `name`, `code`, `description?`, `courseId`, `teacherId?` (admin-only) | — | — | 201 + class | 400, 401, 403, 404, 409 |
| GET | `/api/classes/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` | 200 + class | 400, 401, 403, 404 |
| PUT | `/api/classes/:id` | Yes | ADMIN, TEACHER | scoped | `name`, `code`, `description?`, `courseId` | — | `:id` | 200 + class | 400, 401, 403, 404, 409 |
| PATCH | `/api/classes/:id` | Yes | ADMIN, TEACHER | scoped | `name?`, `code?`, `description?`, `courseId?` | — | `:id` | 200 + class | 400, 401, 403, 404, 409 |
| DELETE | `/api/classes/:id` | Yes | ADMIN, TEACHER | scoped | — | — | `:id` | 200 + class (isActive=false) | 400, 401, 403, 404 |

**Note on `teacherId` in Class creation**: When a teacher creates a class, `teacherId` is implicitly set to `currentUserId`. ADMIN may specify `teacherId` to create a class on behalf of another teacher. STUDENT and PARENT cannot create classes.

## 10. Data Model Design

### Subject

```typescript
// Type: src/types/subject.types.ts
export interface ISubject extends Document {
  name: string;
  code: string;        // e.g., "MATH", "PHYS" — unique
  description?: string;
  teacherId: Types.ObjectId;  // Owner — references User
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `name` | String | yes | | trim, maxlength 200 |
| `code` | String | yes | | unique, uppercase, maxlength 20 |
| `description` | String | no | null | maxlength 1000 |
| `teacherId` | ObjectId | yes | | ref: User, indexed |
| `isActive` | Boolean | | true | |
| `createdAt` | Date | | auto | timestamps |
| `updatedAt` | Date | | auto | timestamps |

**Indexes**: `{ code: 1 }` (unique), `{ teacherId: 1 }`, `{ name: 1, teacherId: 1 }` (compound unique to allow teachers to have subjects with same name but prevent duplicates per teacher).

**Soft-delete**: `isActive: false` (no physical deletion). Query scope: `isActive: true` by default, unless explicitly requested.

### Course

```typescript
// Type: src/types/course.types.ts
export interface ICourse extends Document {
  name: string;
  code: string;        // e.g., "MATH101" — unique
  description?: string;
  subjectId: Types.ObjectId;  // References Subject
  teacherId: Types.ObjectId;  // Owner — references User
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `name` | String | yes | | trim, maxlength 200 |
| `code` | String | yes | | unique, uppercase, maxlength 20 |
| `description` | String | no | null | maxlength 1000 |
| `subjectId` | ObjectId | yes | | ref: Subject, indexed |
| `teacherId` | ObjectId | yes | | ref: User, indexed |
| `isActive` | Boolean | | true | |
| `createdAt` | Date | | auto | timestamps |
| `updatedAt` | Date | | auto | timestamps |

**Indexes**: `{ code: 1 }` (unique), `{ subjectId: 1 }`, `{ teacherId: 1 }`.

### Class

```typescript
// Type: src/types/class.types.ts
export interface IClass extends Document {
  name: string;
  code: string;        // e.g., "MATH101-A" — unique
  description?: string;
  courseId: Types.ObjectId;  // References Course
  teacherId: Types.ObjectId;  // Owner — references User
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `name` | String | yes | | trim, maxlength 200 |
| `code` | String | yes | | unique, uppercase, maxlength 30 |
| `description` | String | no | null | maxlength 1000 |
| `courseId` | ObjectId | yes | | ref: Course, indexed |
| `teacherId` | ObjectId | yes | | ref: User, indexed |
| `startDate` | Date | no | null | |
| `endDate` | Date | no | null | |
| `isActive` | Boolean | | true | |
| `createdAt` | Date | | auto | timestamps |
| `updatedAt` | Date | | auto | timestamps |

**Indexes**: `{ code: 1 }` (unique), `{ courseId: 1 }`, `{ teacherId: 1 }`.

## 11. Validation Design

### Shared ObjectId param schema (reusable)

```typescript
// Pattern from admin.validation.ts userIdParamSchema
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const subjectIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid subject ID"),
});
export const courseIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid course ID"),
});
export const classIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid class ID"),
});
```

### Create Subject / Create Course / Create Class schemas

```typescript
export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  teacherId: z.string().regex(objectIdRegex, "Invalid teacher ID").optional(),  // ADMIN only
}).strict();
```

- `.strict()` on all create schemas: reject unexpected fields (e.g., `role`, `permissions`, `password`).
- `teacherId` on subject/course/class creation: ADMIN may set it; TEACHER cannot (must use their own id). Service-layer enforcement.

### Update Subject / Update Course / Update Class schemas

- **PUT schemas** (full replacement): all fields required, `.strict()`.
- **PATCH schemas** (partial update): all fields optional, `.strict()`.
- This resolves the PUT vs PATCH question: new endpoints → proper REST semantics from day one.

### List/query schemas

Reuse the existing `paginationSchema` pattern from `admin.validation.ts`:

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

Add `search` and optional `subjectId`/`courseId` filters with `objectIdRegex` validation.

### Why `.strict()` everywhere

1. Prevents mass assignment (e.g., `teacherId: "attacker_id"` injection).
2. Rejects unauthorized fields consistently.
3. Matches Phase 1 convention already established.

## 12. Service / Repository Architecture

### Repository responsibilities (per domain)

| Method | Purpose |
|--------|---------|
| `create(data)` | Insert new document |
| `findById(id)` | Find by ObjectId (internal, includes sensitive fields if needed) |
| `findByIdSafe(id)` | Find by ObjectId, exclude sensitive fields |
| `update(id, data)` | Update by ObjectId |
| `softDelete(id)` | Set `isActive = false` |
| `findAllPaginated(filter, page, limit, sortBy, sortOrder)` | Paginated list with filter |
| `exists(filter)` | Check existence |

Pattern: identical to `user.repository.ts`.

### Service responsibilities (per domain)

| Method | Purpose |
|--------|---------|
| `list(query, currentUserId)` | Verify role; scope by `teacherId` for teachers |
| `getById(id, currentUserId)` | Verify role; verify ownership for teachers |
| `create(data, currentUserId)` | Verify role (TEACHER/ADMIN); set `teacherId` = currentUserId (or ADMIN-specified) |
| `update(id, data, currentUserId)` | Verify role; verify ownership; reject unauthorized `teacherId` from non-ADMIN |
| `delete(id, currentUserId)` | Verify role; verify ownership; soft-deactivate |
| **Private**: `verifyTeacher(currentUserId)` | Verify user exists, active, role is TEACHER or ADMIN |
| **Private**: `verifyOwnership(resource, currentUserId)` | Check `resource.teacherId === currentUserId` (ADMIN bypasses) |

Pattern: mirrors `AdminService.verifyAdmin`.

### Controller responsibilities

| Method | Purpose |
|--------|---------|
| `list(req)` | Parse query; call service; return paginated response |
| `getById(req, id)` | Validate ObjectId param; call service; return response |
| `create(req)` | Parse body; call service; return 201 |
| `update(req, id)` | Parse body; call service; return 200 |
| `delete(req, id)` | Validate ObjectId; call service.delete; return 200 |
| **Private**: `handleError(error)` | ZodError → 400, MongoError → 409, AppError → its status, else → 500 |
| **Private**: `extractValidatedId(args)` | Parse ObjectId param schema before calling service |

Pattern: identical to `AdminController`.

### Route responsibilities

```typescript
export const GET = apiHandler(async (req) => adminController.list(req));
export const POST = apiHandler(async (req) => adminController.create(req));
export const GET_ID = apiHandler(async (req, ...args) => {
  const id = await extractValidatedId(args);
  return adminController.getById(req, id);
});
export const PUT = apiHandler(async (req, ...args) => {
  const id = await extractValidatedId(args);
  return adminController.update(req, id);
});
export const PATCH = apiHandler(async (req, ...args) => {
  const id = await extractValidatedId(args);
  return adminController.update(req, id);
});
export const DELETE = apiHandler(async (req, ...args) => {
  const id = await extractValidatedId(args);
  return adminController.delete(req, id);
});
```

### Middleware

- `/api/subjects/*`, `/api/courses/*`, `/api/classes/*` added to the appropriate route matcher set.
- Middleware currently protects `/api/admin/*` routes. New routes should be authenticated (ALL roles).
- Write operations (POST/PUT/PATCH/DELETE) should additionally restrict to ADMIN and TEACHER at the middleware level (STUDENT/PARENT → 403).
- CSRF applies to all state-changing methods (already enforced globally).

### Reusable utilities from Phase 1

| Utility | Usage in Phase 2 |
|---------|-----------------|
| `apiHandler` | Route wrapper for all Phase 2 routes |
| `sendResponse` | Response envelope |
| `AppError` | Service-layer errors (NOT_FOUND, FORBIDDEN, etc.) |
| `handleMongoError` | Duplicate key → 409 in all controllers |
| `userRepository` | Verify user exists and role in `verifyTeacher` |
| `sanitizeUser` | `sanitizeSubject`, `sanitizeCourse`, `sanitizeClass` (strip no sensitive fields, but follow the pattern) |
| `objectIdRegex` / `userIdParamSchema` | Copy pattern for subject/course/class param schemas |
| `paginationSchema` | Reuse for list endpoints |
| `CSRF middleware` | Unchanged — already applies to all state-changing methods |
| `handleError` pattern | Copy to new controllers |
| `verifyAdmin` pattern | Adapt to `verifyTeacher` |

## 13. Security Requirements

### Summary of Phase 2 security controls

| Requirement | Implementation |
|-------------|---------------|
| ID validation | `objectIdRegex` on all `:id` params; rejected before Mongoose |
| Authentication | Middleware JWT verification → `x-user-id` header |
| RBAC | Middleware role check (POST/PUT/PATCH/DELETE → ADMIN/TEACHER only) |
| Ownership enforcement | Service-layer `teacherId` check; repository-scoped queries |
| Horizontal privilege escalation | Service verifies `resource.teacherId === currentUserId` |
| Vertical privilege escalation | Middleware rejects STUDENT/PARENT for writes |
| Mass assignment | `.strict()` on all schemas; `teacherId` rejected from non-ADMIN bodies |
| Sensitive field exposure | `select("-password -refreshToken")` on all repository methods; sanitization functions |
| Duplicate resources | Unique indexes on `code`; `handleMongoError` → 409 |
| Invalid references | Repository lookup of `subjectId`/`courseId`; return 404 if not found |
| Inactive resources | `isActive: true` filter by default; 404 for inactive resources |
| Cross-teacher access | Service + repository scoped queries |
| Student access restrictions | Middleware 403 for STUDENT/PARENT on all Phase 2 routes |
| Parent role limitations | Middleware 403 (PARENT has no Phase 2 access) |
| Rate limiting | `apiHandler` applies rate limit to all routes |
| CSRF | Double-submit (unchanged from Phase 1) |
| Audit logging | `logger.info` on create/update/delete (no sensitive data) |

### Concrete attack scenarios

1. **Cross-teacher resource access**: Teacher A requests `GET /api/courses/607f1f77bcf86cd799439012` owned by Teacher B. Service checks `course.teacherId !== currentUserId` → 403 Forbidden.

2. **Mass assignment of ownership**: Teacher A sends `POST /api/subjects` with body `{ name: "Math", code: "MATH", teacherId: "607f1f77bcf86cd799439011" }` (Alice's ID, a different teacher). `.strict()` accepts `teacherId` field, but service-layer rejects: only ADMIN can set `teacherId`; TEACHER's `teacherId` is forced to `currentUserId`.

3. **Invalid ObjectId**: `GET /api/subjects/not-a-valid-id` → `objectIdRegex` fails → 400 before any DB query.

4. **Duplicate code**: `POST /api/subjects` with `code: "MATH"` when MATH already exists → MongoDB 11000 → `handleMongoError` → 409 Conflict.

5. **Inactive resource access**: Teacher A requests `GET /api/courses/:id` where the course's `isActive = false` → 404 Not Found (scoped query includes `isActive: true`).

6. **Student write attempt**: Student sends `POST /api/classes` → middleware checks role ≠ ADMIN/TEACHER → 403 Forbidden before reaching controller.

## 14. Test Strategy

### Framework: `node:test` + `node:assert/strict` via `npx tsx --test`

### Unit tests — Validation (new file: `src/validations/__tests__/subject.validation.test.ts`, etc.)

- Valid ObjectId param accepted
- Invalid ObjectId rejected (non-hex, wrong length, empty)
- Create schema accepts valid input
- Create schema rejects unexpected fields (`.strict()`)
- Create schema rejects empty name
- Create schema rejects invalid ObjectId reference
- Update (PATCH) schema accepts partial input
- Update (PATCH) schema rejects unexpected fields
- List query schema applies pagination defaults

### Unit tests — Service (new file: `src/services/__tests__/subject.service.test.ts`, etc.)

- Admin can list all subjects
- Teacher can list only own subjects
- Teacher can create subject
- Teacher cannot create subject with `teacherId` override (ignored/forced)
- Admin can create subject for another teacher
- Teacher can update own subject
- Teacher cannot update another teacher's subject (403)
- Teacher can soft-delete own subject
- Soft-deleted subject has `isActive = false`
- Repeated soft-delete is idempotent
- Non-admin/non-teacher requester is rejected (403)
- Nonexistent requester is rejected (401)
- Cross-teacher resource access is rejected (403)

### Unit tests — Repository (new file: `src/repositories/__tests__/subject.repository.test.ts`, etc.)

- `create` returns saved document
- `findById` returns user with password/refreshToken for internal use
- `findByIdSafe` excludes sensitive fields
- `softDelete` sets `isActive = false`
- `findAllPaginated` applies filter and pagination correctly
- `update` excludes sensitive fields from result

### Unit tests — Duplicate key (new file or extend `handleMongoError.test.ts`)

- `handleMongoError` returns 409 for code 11000
- Controller `handleError` returns 409 for MongoDB duplicate key error

### Integration/API tests

- Determined after implementation; should use `NextRequest` with absolute URLs
- Test full route → controller → service → repository → model flow
- Test CSRF token requirement on POST/PUT/PATCH/DELETE

### Testing conventions to follow

- Use `@/` path aliases (confirmed in `tsconfig.json`)
- Mock repositories (not DB) — follow `admin.service.test.ts` pattern
- Use `beforeEach` to reset mocks
- Test IDs: `"507f1f77bcf86cd799439011"` pattern (24-char hex)

## 15. Dependency Analysis

### Implementation dependency chain

```
User (exists)
  ↓ references
Subject (Phase 2A)
  ↓ references
Course (Phase 2B)
  ↓ references
Class (Phase 2C)
  ↓ references (Phase 3)
Enrollment (Phase 3 — NOT in scope)
```

### Why this order is required

- **Subject** has no dependencies on Course or Class — can be implemented first.
- **Course** depends on Subject (must validate `subjectId` exists) — implement after Subject.
- **Class** depends on Course (must validate `courseId` exists) — implement after Course.
- **Enrollment** (Phase 3) depends on Class — blocked until Class exists.

### Relationship design rationale

The `Subject → Course → Class` chain was chosen over flat or many-to-many designs because:

1. **Simple direct references**: Each entity has a single owner (`teacherId`) and a single parent. No join collections needed for Phase 2.
2. **Natural hierarchy**: A subject is a conceptual area; a course is a specific offering; a class is a group of students. This is the standard LMS hierarchy.
3. **Query efficiency**: Single ObjectId lookups for parent references.
4. **Phase 3 compatibility**: Enrollment will reference `classId`, which exists in this chain. No redesign needed.
5. **Ownership consistency**: Every resource has `teacherId`, enabling uniform RBAC across all three domains.

### Phase 3 (Enrollment) dependency interface

Enrollment will require:
- `studentId` → `User` (role = STUDENT) — **does not exist yet on User model**
- `classId` → `Class` — created in Phase 2

The `Class` model's structure must not change between Phase 2 and Phase 3. If student-class relationships require additional metadata (enrollment date, grade, status), this can be added as fields on the Enrollment model in Phase 3 without affecting Phase 2 models.

## 16. Implementation Order

### Phase 2A — Validation foundation (1 day)

1. Create `src/types/subject.types.ts`, `course.types.ts`, `class.types.ts`
2. Create `src/validations/subject.validation.ts`, `course.validation.ts`, `class.validation.ts`
3. Add `SUBJECT_NOT_FOUND`, `COURSE_NOT_FOUND`, `CLASS_NOT_FOUND`, etc. to `errorMessages.ts`

**Rationale**: Types and validation are prerequisites for all other layers. No runtime impact.

### Phase 2B — Subject domain (2 days)

1. `src/models/subject.model.ts`
2. `src/repositories/subject.repository.ts`
3. `src/services/subject.service.ts`
4. `src/controllers/subject.controller.ts`
5. `src/app/api/subjects/route.ts`, `src/app/api/subjects/[id]/route.ts`, `src/app/api/subjects/[id]/status/route.ts`
6. Tests: validation, service, repository, integration

**Rationale**: No upstream dependencies. Establishes the pattern for Course and Class.

### Phase 2C — Course domain (2 days)

1. `src/models/course.model.ts`
2. `src/repositories/course.repository.ts`
3. `src/services/course.service.ts`
4. `src/controllers/course.controller.ts`
5. `src/app/api/courses/route.ts`, etc.
6. Tests

**Rationale**: Depends on Subject (validate `subjectId`). Reuses Subject patterns.

### Phase 2D — Class domain (2 days)

1. `src/models/class.model.ts`
2. `src/repositories/class.repository.ts`
3. `src/services/class.service.ts`
4. `src/controllers/class.controller.ts`
5. `src/app/api/classes/route.ts`, etc.
6. Tests

**Rationale**: Depends on Course (validate `courseId`). Reuses Course patterns.

### Phase 2E — Middleware update (0.5 day)

Update `src/middleware.ts` to include new route prefixes (`/api/subjects`, `/api/courses`, `/api/classes`) in the protected/admin route matchers.

### Phase 2F — Integration validation (1 day)

1. Run `tsc --noEmit`
2. Run `npx tsx --test` (expect 124 + new tests)
3. Run `next build`
4. Run `eslint`
5. Verify no Phase 1 regressions

**Rationale**: Order ensures each domain is fully implemented and tested before moving to the next, reducing risk. Course depends on Subject; Class depends on Course.

## 17. Frontend Impact

This is a **planning-only** phase. No frontend changes are made. The following describes future frontend capabilities that will become possible after Phase 2 implementation:

| Frontend capability | Backend dependency |
|---------------------|--------------------|
| Subject management dashboard (create/edit/delete subjects) | `/api/subjects/*` (POST/GET/PUT/PATCH/DELETE) |
| Course creation workflow (select subject → create course) | `/api/courses/*` + `/api/subjects` listing |
| Class roster (create class sections per course) | `/api/classes/*` + `/api/courses` listing |
| Teacher dashboard showing owned subjects/courses/classes | Scoped GET endpoints (teacher sees only own resources) |
| ADMIN subject/course/class management UI | Full access to all endpoints |

### API service requirements for frontend

- REST client for `/api/subjects`, `/api/courses`, `/api/classes`
- Pagination support (page/limit query params)
- Error handling for 400 (validation), 403 (authorization), 404 (not found), 409 (duplicate)
- CSRF token inclusion on all POST/PUT/PATCH/DELETE requests
- `x-user-role` awareness for conditional UI rendering (ADMIN sees all; TEACHER sees own)

### Role-based UI implications

- **ADMIN**: Full CRUD on all three domains
- **TEACHER**: CRUD only on owned resources
- **STUDENT/PARENT**: Cannot access these endpoints (UI should not display these features)

Frontend implementation remains **blocked** until backend APIs are implemented and validated.

## 18. Blockers

| Requirement | Actual Status | Phase 2 Impact | Priority |
|-------------|---------------|----------------|----------|
| Subject model/repository/service/controller | MISSING | Cannot implement CRUD | BLOCKER |
| Course model/repository/service/controller | MISSING | Cannot implement CRUD | BLOCKER |
| Class model/repository/service/controller | MISSING | Cannot implement CRUD | BLOCKER |
| Subject/Course/Class validation schemas | MISSING | Cannot validate input | BLOCKER |
| Subject/Course/Class route files | MISSING | No API endpoints | BLOCKER |
| Middleware route matcher update | Partial | New routes unprotected | HIGH |
| Subject/Course/Class types/interfaces | MISSING | No TypeScript types | BLOCKER |
| `studentId` on User model (for Phase 3) | MISSING | Blocks Enrollment (Phase 3) | FUTURE |
| Parent-child relationship fields on User | MISSING | Blocks PARENT role features | FUTURE |
| Test infrastructure for new domains | Partial | Need new test files | MEDIUM |
| Error message constants for new domains | Partial | Need new messages | LOW |

## 19. Phase 2 Readiness

**Assessment: PARTIALLY READY**

### Why partially ready

- ✅ **Architecture is compatible**: The existing `Route → Controller → Service → Repository → Model` pattern, `apiHandler` wrapper, `AppError`/`handleMongoError`, `sendResponse` envelope, Zod validation, pagination, sanitization, and CSRF are all reusable.
- ✅ **Security infrastructure is in place**: CORS allowlist, JWT auth, CSRF protection, rate limiting, and role-based middleware all exist and are validated.
- ✅ **Type system is well-defined**: `UserRole` enum, `IUser` interface, and `JwtPayload` provide a solid foundation.
- ✅ **Test patterns are established**: `admin.service.test.ts` demonstrates the mock-repository pattern that can be replicated for Subject/Course/Class.
- ⚠️ **No Phase 2 code exists**: All models, types, repositories, services, controllers, routes, and validation schemas must be created from scratch.
- ⚠️ **Middleware needs route matcher updates**: The protected route matchers must be extended to include the new route prefixes.
- ⚠️ **Test count will increase significantly**: Each domain needs at least 4 test files × ~10-15 tests each.

### Readiness criteria met

- Existing architecture is fully reusable ✓
- Security mechanisms are in place ✓
- Development tooling (TypeScript, ESLint, tests, build) all passing ✓
- No conflicting implementations exist ✓

## 20. Final Recommendation

**PROCEED WITH IMPLEMENTATION in the Phase 2A → 2B → 2C → 2D → 2E → 2F order.**

The backend is well-positioned for Phase 2 implementation:

1. The architecture is clean and consistent — new domains should follow the exact same pattern as the admin user management.
2. Security is layered and defense-in-depth — middleware role checks complement service-level ownership verification.
3. The test framework and patterns are established — new tests will follow the same mock-repository approach.
4. The relationship design (`Subject → Course → Class` with `teacherId` ownership on each) is simple, queryable, and compatible with future Enrollment (Phase 3) which will reference `Class.classId`.

Key decisions documented:
- **Relationship**: `Subject → Course → Class` with `teacherId` on each entity
- **RBAC**: Middleware blocks STUDENT/PARENT; service enforces ownership; ADMIN bypasses ownership
- **PUT vs PATCH**: New endpoints use proper REST semantics (PUT = full, PATCH = partial)
- **Soft-delete**: `isActive = false` on all three domains (no physical deletion)
- **No parent-child relationships or student enrollment** in this phase
