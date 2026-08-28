# LearnSphere Backend — Phase 3 Feature Plan

## Planning-Only Document (Read-Only Audit)

**Status:** AUDIT ONLY — No backend, frontend, or configuration files were modified.
**Branch:** `feature/backend-feature-planning`
**Checkpoint commit:** `56646d9` — Phase 2 complete (313/313 tests, TypeScript, ESLint, build, security audit all pass)
**Audit date:** 2026-08-28

---

## 1. Executive Summary

Phase 3 of LearnSphere backend development begins with this read-only audit to determine the next backend domains to implement. Phase 2 (Subject, Course, Class) is officially complete. The audit confirms that the actual repository contains a well-structured, layered architecture (`Route → Controller → Service → Repository → Model → MongoDB`) with robust auth (JWT double-token + HTTP-only cookies + CSRF), RBAC (middleware + service-level ownership), and a mature test suite (300+ tests using `node:test` + `tsx`).

**Key finding:** The existing `BACKEND_FEATURE_CAPABILITY_PLAN.md` (dated 2026-08-27) describes the **Phase 1** state (only the User model). It must NOT be treated as authoritative for Phase 3 — it predates Phase 2 implementation. This document corrects the record based on direct inspection of the actual source tree.

**Phase 3 candidate (recommended):** **Enrollment** — the logical next domain that links students to classes/courses. It depends on the completed Phase 2 domains (Subject → Course → Class) and unblocks the entire downstream LMS feature chain (Assignments, Submissions, Attendance, Grades, Timetable).

---

## 2. Current Backend State

### 2.1 Git state

| Check | Value |
|-------|-------|
| Branch | `feature/backend-feature-planning` |
| HEAD commit | `56646d9` — `test(backend): add phase 2e security coverage` |
| Working tree | CLEAN |
| Remote sync | Synchronized |

### 2.2 Backend source tree (actual)

```
backend/src/
├── app/
│   └── api/
│       ├── auth/            ← 9 route files (register, login, logout, refresh, profile, change-password, forgot-password, reset-password, google)
│       ├── subjects/        ← Phase 2: [id] route (GET, PUT, PATCH, DELETE)
│       ├── courses/         ← Phase 2: [id] route (GET, PUT, PATCH, DELETE)
│       ├── classes/         ← Phase 2: [id] route (GET, PUT, PATCH, DELETE)
│       └── admin/
│           └── users/       ← Phase 1: [id] route (GET, PUT, PATCH, DELETE)
├── config/
│   └── env.ts               ← Environment variable validation (MONGODB_URI, JWT secrets, etc.)
├── constants/
│   ├── errorMessages.ts
│   └── statusCodes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── subject.controller.ts    ← Phase 2
│   ├── course.controller.ts     ← Phase 2
│   ├── class.controller.ts      ← Phase 2
│   └── admin.controller.ts      ← Phase 1
├── interfaces/
│   └── response.interface.ts    ← ApiResponse<T> envelope
├── lib/
│   ├── db.ts                  ← Mongoose cached singleton connection
│   ├── edgeJwt.ts             ← jose-based JWT verify (Edge runtime for middleware)
│   ├── jwt.ts                 ← jsonwebtoken sign/verify (server-side)
│   ├── csrf.ts                ← Edge-safe CSRF validation (double-submit)
│   ├── csrf.server.ts         ← Node-only CSRF token generation
│   └── password.ts            ← bcryptjs hashing/compression (12 rounds)
├── middleware.ts              ← CORS + auth + CSRF + role check
├── models/
│   ├── user.model.ts
│   ├── subject.model.ts       ← Phase 2
│   ├── course.model.ts        ← Phase 2
│   └── class.model.ts         ← Phase 2
├── repositories/
│   ├── user.repository.ts
│   ├── subject.repository.ts  ← Phase 2
│   ├── course.repository.ts   ← Phase 2
│   └── class.repository.ts    ← Phase 2
├── services/
│   ├── auth.service.ts
│   ├── email.service.ts       ← Email stub (logs, no actual sending)
│   ├── subject.service.ts     ← Phase 2
│   ├── course.service.ts      ← Phase 2
│   ├── class.service.ts       ← Phase 2
│   └── admin.service.ts       ← Phase 1
├── types/
│   ├── auth.types.ts          ← JwtPayload { userId, role, type }
│   ├── user.types.ts          ← UserRole enum, AuthProvider enum, IUser interface
│   ├── subject.types.ts       ← Phase 2
│   ├── course.types.ts        ← Phase 2
│   └── class.types.ts         ← Phase 2
├── utils/
│   ├── apiHandler.ts          ← Route wrapper: connectDB → rateLimit → handler → catch
│   ├── apiResponse.ts         ← sendResponse envelope
│   ├── AppError.ts            ← AppError class + handleMongoError (code 11000 → 409)
│   ├── logger.ts              ← Winston logger
│   └── rateLimiter.ts         ← rate-limiter-flexible (100 req/60s/IP)
├── validations/
│   ├── objectId.ts            ← objectIdSchema, paginationSchema, searchSchema
│   ├── auth.validation.ts
│   ├── admin.validation.ts    ← Phase 1
│   ├── subject.validation.ts  ← Phase 2
│   ├── course.validation.ts   ← Phase 2
│   └── class.validation.ts    ← Phase 2
└── __tests__/                  ← 2 security test files (phase2e)
    └── (plus __tests__ dirs in services/, validations/, utils/, lib/)
```

### 2.3 Technology stack (actual)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.11 (App Router) |
| Runtime | Node.js / Edge Runtime (middleware) |
| Language | TypeScript 5 (`strict: true`) |
| Database | MongoDB 9.8.0 via Mongoose 9.8.0 |
| JWT (server) | `jsonwebtoken` 9.0.3 |
| JWT (edge) | `jose` 6.2.6 |
| Password hashing | `bcryptjs` 3.0.3 (12 rounds) |
| Validation | `zod` 4.4.3 |
| Logging | `winston` 3.19.0 |
| Rate limiting | `rate-limiter-flexible` 11.2.0 (Redis in prod, memory in dev) |
| Path alias | `@/*` → `./src/*` |
| Test runner | `node:test` via `tsx --test` (NO Jest, NO mongodb-memory-server) |

---

## 3. Phase 1 & Phase 2 Capabilities

### 3.1 Phase 1 — Authentication & Infrastructure (implemented)

#### Authentication endpoints (`/api/auth/*`)

| Method | Endpoint | Auth required | RBAC |
|--------|----------|---------------|------|
| POST | `/api/auth/register` | No | Public |
| POST | `/api/auth/login` | No | Public |
| POST | `/api/auth/refresh` | No (reads refreshToken cookie) | Public |
| POST | `/api/auth/logout` | Yes | Any authenticated |
| GET | `/api/auth/profile` | Yes | Any authenticated |
| PUT | `/api/auth/profile` | Yes | Any authenticated |
| POST | `/api/auth/change-password` | Yes | Any authenticated |
| POST | `/api/auth/forgot-password` | No | Public |
| POST | `/api/auth/reset-password` | No (reset token in body) | Public |
| POST | `/api/auth/google` | No | Public |

#### Auth infrastructure

- **JWT**: Access token (15 min, `JWT_ACCESS_SECRET`), refresh token (7 days, `JWT_REFRESH_SECRET`), reset token (15 min). Token `type` field enforced (`access` | `refresh` | `reset`).
- **Token rotation**: Refresh endpoint issues new tokens and invalidates old refresh tokens. Reuse detection: if DB refresh token doesn't match presented token → revoke all → 401.
- **Cookies**: `accessToken` (15 min, httpOnly, sameSite=strict, path=/) + `refreshToken` (7 days, httpOnly, sameSite=strict, path=/) + `csrfToken` (readable, sameSite=strict).
- **Account lockout**: 5 failed attempts → 15 min lock.
- **Rate limiting**: 100 req/60s per IP (all `/api/*` via `apiHandler`).
- **CSRF**: Double-submit cookie pattern — `csrfToken` cookie (readable) + `x-csrf-token` header, compared with timing-safe comparison. Applied in middleware to POST/PUT/PATCH/DELETE on protected/admin routes.
- **CORS**: Reflects `FRONTEND_ORIGIN` env var (default `http://localhost:3000`), `credentials: true`.
- **Email service**: STUB — `emailService.ts` only logs to Winston. No real email provider configured.
- **AppError**: Custom error class with `statusCode`, `errors[]`, `isOperational`. `handleMongoError` converts duplicate-key errors (code 11000) → 409 Conflict.

#### Phase 1 — Admin User Management (`/api/admin/*`)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/admin/users` | Yes | ADMIN only (middleware) |
| GET | `/api/admin/users/:id` | Yes | ADMIN only (middleware) |
| PUT | `/api/admin/users/:id` | Yes | ADMIN only (middleware) |
| PATCH | `/api/admin/users/:id` | Yes | ADMIN only (middleware) |
| DELETE | `/api/admin/users/:id` | Yes | ADMIN only (middleware) |

- **Soft-delete**: `DELETE` sets `isActive = false` (no physical deletion).
- **Service-level auth**: `adminService.verifyAdmin(currentUserId)` re-checks role in service layer (defense in depth).
- **Sanitization**: `sanitizeUser()` strips `password`, `refreshToken`, `loginAttempts`, `lockUntil`, `passwordChangedAt`, `permissions` from all admin responses.

### 3.2 Phase 2 — Academic Structure (implemented)

#### Model fields (actual)

**Subject** (`src/models/subject.model.ts`)
```
name: String (required, trim, max 200)
code: String (required, unique, uppercase, trim, max 20, index)
description: String (nullable, max 1000, trim)
teacherId: ObjectId → User (required, index)
isActive: Boolean (default true, index)
createdAt, updatedAt: Date (timestamps)
Indexes: { name: 1, teacherId: 1 } unique; { code: 1 } unique
```

**Course** (`src/models/course.model.ts`)
```
name: String (required, trim, max 200)
code: String (required, unique, uppercase, trim, max 20, index)
description: String (nullable, max 1000, trim)
subjectId: ObjectId → Subject (required, index)
teacherId: ObjectId → User (required, index)
isActive: Boolean (default true, index)
createdAt, updatedAt: Date (timestamps)
Indexes: { code: 1 } unique; { subjectId: 1 }
```

**Class** (`src/models/class.model.ts`)
```
name: String (required, trim, max 200)
code: String (required, unique, uppercase, trim, max 30, index)
description: String (nullable, max 1000, trim)
courseId: ObjectId → Course (required, index)
teacherId: ObjectId → User (required, index)
startDate: Date (nullable)
endDate: Date (nullable)
isActive: Boolean (default true, index)
createdAt, updatedAt: Date (timestamps)
Indexes: { code: 1 } unique; { courseId: 1 }; { teacherId: 1 }; { name: 1, teacherId: 1 } unique
```

#### Relationship chain (actually implemented)

```
User (role: TEACHER)
  ↓ teacherId
Subject
  ↓ subjectId (Course references Subject)
Course (also has teacherId → User)
  ↓ courseId (Class references Course)
Class (also has teacherId → User)
```

- `Subject.teacherId` → User
- `Course.subjectId` → Subject, `Course.teacherId` → User
- `Class.courseId` → Course, `Class.teacherId` → User

#### RBAC & ownership pattern (established by Phase 2)

Every Phase 2 service implements the same pattern:

1. **`verifyTeacher(currentUserId)`** — looks up the requesting User, throws `401 UNAUTHORIZED` if user not found, throws `403 FORBIDDEN` if role is not TEACHER or ADMIN. Returns `{ id, role }`.
2. **Ownership scoping on list**: If role is TEACHER, the filter includes `filter.teacherId = requestorId` (teacher only sees their own resources). ADMIN sees all.
3. **Ownership scoping on get-by-id**: If role is TEACHER and `resource.teacherId !== requestorId`, throws `404 NOT_FOUND` (returns not-found, not forbidden, to prevent enumeration).
4. **Ownership scoping on update/patch**: Calls `getEntityForUpdate()` which performs the same ownership check as get-by-id.
5. **Teacher ID spoofing**: When role is TEACHER, `teacherId` from the request body is **ignored** — the authenticated user's ID is always used. Only ADMIN can specify a `teacherId`.
6. **Cross-resource ownership**: When creating a Class, the service verifies the teacher owns the referenced Course (`verifyTeacherOwnsCourse`). When creating a Course, verifies teacher owns the referenced Subject (`verifyTeacherOwnsSubject`).
7. **Soft-delete**: All three domains use `softDelete` → `isActive: false`. Deleted resources are excluded from `findById` lookups (checks `!subject.isActive`).

#### API routes (actual)

| Route | Methods | Middleware-protected |
|-------|---------|---------------------|
| `/api/subjects` | GET (list), POST (create) | Yes (`/api/subjects`) |
| `/api/subjects/:id` | GET, PUT, PATCH, DELETE | Yes |
| `/api/courses` | GET (list), POST (create) | Yes (`/api/courses`) |
| `/api/courses/:id` | GET, PUT, PATCH, DELETE | Yes |
| `/api/classes` | GET (list), POST (create) | Yes (`/api/classes`) |
| `/api/classes/:id` | GET, PUT, PATCH, DELETE | Yes |

All route files are wrapped with `apiHandler` (DB connect + rate limit + ZodError catch).

#### Validation patterns (actual)

Each domain has 4 schemas following the same pattern:
- `createSchema` — required fields + `teacherId` optional (ADMIN) + `.strict()`
- `updateSchema` (PUT) — all required fields + `.strict()`
- `patchSchema` (PATCH) — all fields optional + `.strict()`
- `listSchema` — extends `paginationSchema` with `search`, `isActive`, domain-specific filters
- `idParamSchema` — `{ id: objectIdSchema }`

Reusable infrastructure from `src/validations/objectId.ts`:
- `objectIdSchema` — `z.string().regex(/^[0-9a-fA-F]{24}$/)`
- `paginationSchema` — `{ page: coerce.number().int().min(1).default(1), limit: coerce.number().int().min(1).max(100).default(20) }`
- `searchSchema` — `z.string().trim().min(1).max(100).optional()`

#### Response envelope (actual)

All responses use `sendResponse(data, message, errors)`:
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;   // false if errors.length > 0
  message: string;
  data: T | null;
  errors: string[];
  timestamp: string;  // ISO 8601
}
```

#### Soft-delete convention (actual)

All Phase 2 models use `isActive: Boolean (default: true, index: true)`. The `softDelete` repository method sets `isActive = false` via `findByIdAndUpdate`. Services check `!entity.isActive` on `findById` and throw `404 NOT_FOUND` (not visible, not deleted error). This is a soft-delete pattern — records remain in MongoDB but are filtered out.

---

## 4. Missing LMS Capabilities

### 4.1 Domain audit results

The following table reflects the **actual repository** state (verified by searching all source files):

| Domain | Status | Evidence |
|--------|--------|----------|
| **User** | EXISTS | `src/models/user.model.ts`, `src/types/user.types.ts` |
| **Subject** | EXISTS | `src/models/subject.model.ts` etc. (Phase 2) |
| **Course** | EXISTS | `src/models/course.model.ts` etc. (Phase 2) |
| **Class** | EXISTS | `src/models/class.model.ts` etc. (Phase 2) |
| **Admin (user management)** | EXISTS | `src/controllers/admin.controller.ts`, `/api/admin/users` routes |
| **Student** | MISSING | No Student model. STUDENT role exists in enum but User has no `studentId` field, no `classIds`/`courseIds` enrollment array |
| **Parent** | MISSING | PARENT role exists in enum but no `parentIds`/`childrenIds` relationship fields on User |
| **Enrollment** | MISSING | No Enrollment model, no `/api/enrollments` route, no `studentId` references on any model |
| **Assignment** | MISSING | No model, no route, no validation. Only false positive: `verifyTeacherAssignment` in class.service.ts (means "verify teacher assignment", not LMS assignments) |
| **Exam** | MISSING | No model, no route |
| **Quiz** | MISSING | No model, no route |
| **Question** | MISSING | No model, no route |
| **Lesson** | MISSING | No model, no route |
| **Chapter** | MISSING | No model, no route |
| **Module** | MISSING | No model, no route |
| **Submission** | MISSING | No model, no route |
| **Grade** | MISSING | No model, no route |
| **Result** | MISSING | No model, no route |
| **Attendance** | MISSING | No model, no route |
| **Schedule** | MISSING | No model, no route |
| **Timetable** | MISSING | No model, no route |
| **Announcement** | MISSING | No model, no route |
| **Notification (LMS)** | MISSING | `useNotification.ts` in frontend is an AntD `message` wrapper (UI toast) — NOT an LMS notification domain |
| **Course Material / File** | MISSING | No file upload model, no document model |
| **Dashboard (analytics)** | PARTIAL | Frontend has `/dashboard` shell (stub showing welcome message), but no `/api/analytics` or `/api/dashboard` backend endpoint |
| **Report** | MISSING | No reporting model, no `/api/reports` route |

### 4.2 Grep verification

A search for `studentId|parentId|enrollment|Enrollment|managedBy|childId|relatedUser` across both `backend/src` and `frontend/src` returned **zero matches**. No relationship fields exist anywhere in the codebase.

A search for `Assignment|Exam|Quiz|Question|Attendance|Submission|Grade|Lesson|Chapter|Module|Schedule|Timetable|Notification|Announcement|Material` across `backend/src` returned only false positives (`verifyTeacherAssignment` in class.service.ts:84, `subjectRepository`/`courseRepository` module imports in test files).

---

## 5. Domain Classification

| Domain | Current State | Rationale |
|--------|--------------|-----------|
| User | EXISTS | Auth model with role enum, all auth flows implemented |
| Subject | EXISTS | Phase 2 — teacher-owned reference data |
| Course | EXISTS | Phase 2 — belongs to Subject + teacher |
| Class | EXISTS | Phase 2 — belongs to Course + teacher |
| Admin (User Management) | EXISTS | Phase 1 — `/api/admin/users` CRUD with soft-delete |
| Student | MISSING | STUDENT/PARENT roles exist in enum; no relationship model |
| Parent | MISSING | No parent-child linking fields on User |
| Enrollment | MISSING | No linkage between students and classes/courses |
| Assignment | MISSING | No assignment model, no `/api/assignments` |
| Submission | MISSING | No submission model |
| Exam | MISSING | No exam/quiz/question model |
| Attendance | MISSING | No attendance tracking |
| Grade | MISSING | No grading system |
| Timetable | MISSING | No scheduling/timetable model |
| Announcement | MISSING | No announcement system |
| Notification (LMS) | MISSING | Frontend `useNotification` is UI-only (AntD message), not a domain |
| Course Material | MISSING | No file/document model, no upload infrastructure |
| Dashboard (analytics) | PARTIAL | Frontend shell exists; no backend analytics API |
| Report | MISSING | No reporting endpoints |

---

## 6. User Relationship Analysis

### 6.1 User model fields (actual)

`src/models/user.model.ts` — 17 fields, no student/parent relationship fields:

| Field | Type |
|-------|------|
| `name` | String (trim, max 100) |
| `email` | String (unique, index, lowercase) |
| `password` | String (bcrypt hash, select: false, nullable) |
| `provider` | String (enum: LOCAL, GOOGLE) |
| `providerId` | String (sparse index, nullable) |
| `avatar` | String (nullable) |
| `role` | String (enum: ADMIN, TEACHER, STUDENT, PARENT; default: STUDENT) |
| `permissions` | [String] (default [], **UNUSED**) |
| `isActive` | Boolean (default true) |
| `isVerified` | Boolean (default false) |
| `refreshToken` | String (select: false, nullable) |
| `lastLogin` | Date (nullable) |
| `loginAttempts` | Number (default 0) |
| `lockUntil` | Date (nullable) |
| `passwordChangedAt` | Date (nullable) |
| `createdAt` | Date (timestamps) |
| `updatedAt` | Date (timestamps) |

**No relationship fields exist:** No `studentId`, `parentId`, `parentIds`, `childrenIds`, `classIds`, `courseIds`, `managedBy`, `relatedUsers`, or any linking array. The grep for these terms returned zero matches.

### 6.2 Role semantics (actual)

| Role | How it's used |
|------|--------------|
| ADMIN | Full access — bypasses all ownership checks in services (`role !== TEACHER` condition in `verifyTeacher`). Middleware allows ADMIN on `/api/admin/*`. |
| TEACHER | Can CRUD own Subjects/Courses/Classes. Ownership: `entity.teacherId === requestorId`. Cannot access other teachers' resources (404 returned, not 403). Cannot enroll students, create assignments, etc. (those endpoints don't exist yet). |
| STUDENT | Exists in enum but **no STUDENT-specific endpoints exist**. All Phase 2 APIs require TEACHER or ADMIN. STUDENT/PARENT roles are blocked at the service level (`verifyTeacher` throws `403 FORBIDDEN`). |
| PARENT | Exists in enum but **no PARENT-specific endpoints exist**. Same blocking as STUDENT. No parent-child relationship model. |

### 6.3 What's missing

1. **Student→Class/Class→Student linkage**: No field on `Class` to track which students are enrolled (Phase 2 Class model has no `studentIds` array).
2. **Parent→Student linkage**: No field on User to link parents to children (`parentIds`, `childrenIds`).
3. **Teacher→Student roster**: No way to retrieve a teacher's students without an Enrollment table.
4. **Student→Course/Course→Student linkage**: No enrollment mechanism.

---

## 7. Current API Inventory

### 7.1 Auth endpoints (10 total)

| Method | Endpoint | Handler |
|--------|----------|---------|
| POST | `/api/auth/register` | `AuthController.register` |
| POST | `/api/auth/login` | `AuthController.login` |
| POST | `/api/auth/refresh` | `AuthController.refresh` |
| POST | `/api/auth/logout` | `AuthController.logout` |
| GET | `/api/auth/profile` | `AuthController.getProfile` |
| PUT | `/api/auth/profile` | `AuthController.updateProfile` |
| POST | `/api/auth/change-password` | `AuthController.changePassword` |
| POST | `/api/auth/forgot-password` | `AuthController.forgotPassword` |
| POST | `/api/auth/reset-password` | `AuthController.resetPassword` |
| POST | `/api/auth/google` | `AuthController.googleLogin` |

### 7.2 Admin endpoints (5 total)

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/admin/users` | `AdminController.listUsers` |
| GET | `/api/admin/users/:id` | `AdminController.getUserById` |
| PUT | `/api/admin/users/:id` | `AdminController.updateUser` |
| PATCH | `/api/admin/users/:id` | `AdminController.updateUser` (same handler) |
| DELETE | `/api/admin/users/:id` | `AdminController.deleteUser` |

### 7.3 Subject endpoints (5 total)

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/subjects` | `SubjectController.list` |
| POST | `/api/subjects` | `SubjectController.create` |
| GET | `/api/subjects/:id` | `SubjectController.getById` |
| PUT | `/api/subjects/:id` | `SubjectController.update` |
| PATCH | `/api/subjects/:id` | `SubjectController.patch` |
| DELETE | `/api/subjects/:id` | `SubjectController.delete` |

### 7.4 Course endpoints (5 total)

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/courses` | `CourseController.list` |
| POST | `/api/courses` | `CourseController.create` |
| GET | `/api/courses/:id` | `CourseController.getById` |
| PUT | `/api/courses/:id` | `CourseController.update` |
| PATCH | `/api/courses/:id` | `CourseController.patch` |
| DELETE | `/api/courses/:id` | `CourseController.delete` |

### 7.5 Class endpoints (5 total)

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/classes` | `ClassController.list` |
| POST | `/api/classes` | `ClassController.create` |
| GET | `/api/classes/:id` | `ClassController.getById` |
| PUT | `/api/classes/:id` | `ClassController.update` |
| PATCH | `/api/classes/:id` | `ClassController.patch` |
| DELETE | `/api/classes/:id` | `ClassController.delete` |

### 7.6 Missing API areas

| Domain | Missing endpoints |
|--------|------------------|
| Enrollment | All — `/api/enrollments` (no route exists) |
| Assignment | All — `/api/assignments` |
| Submission | All — `/api/submissions` |
| Exam | All — `/api/exams` |
| Attendance | All — `/api/attendance` |
| Grade/Result | All — `/api/grades`, `/api/results` |
| Timetable | All — `/api/timetable` |
| Announcement | All — `/api/announcements` |
| Notification | All — `/api/notifications` |
| Analytics | All — `/api/analytics` |

### 7.7 Middleware-protected routes (actual)

From `src/middleware.ts:10`:
```typescript
const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout", "/api/subjects", "/api/courses", "/api/classes"];
const adminRoutes = ["/api/admin"];
```

| Route group | Auth required | Role restriction | CSRF |
|-------------|---------------|-----------------|------|
| `/api/auth/change-password` | Yes | Any authenticated | POST → yes |
| `/api/auth/profile` (GET, PUT) | Yes | Any authenticated | PUT → yes |
| `/api/auth/logout` | Yes | Any authenticated | POST → yes |
| `/api/subjects`, `/api/courses`, `/api/classes` (+ `:id`) | Yes | TEACHER/ADMIN (service-level) | POST/PUT/PATCH/DELETE → yes |
| `/api/admin/*` | Yes | ADMIN only (middleware) | POST/PUT/PATCH/DELETE → yes |
| All other `/api/*` | No | — | No |

---

## 8. Current RBAC Model

### 8.1 Identity propagation

The middleware (`src/middleware.ts`) verifies the access token JWT via `jose` (`verifyEdgeAccessToken`), then sets two request headers on the NextResponse:
```typescript
requestHeaders.set("x-user-id", decoded.userId);
requestHeaders.set("x-user-role", decoded.role);
```

Controllers read the user identity **exclusively** from these trusted headers:
```typescript
const currentUserId = req.headers.get("x-user-id") ?? "unknown";
```

**Security property**: Client-supplied `x-user-id` / `x-user-role` headers are ignored — the middleware overwrites them after JWT verification. The security tests (`phase2e.middleware.security.test.ts:113-123`) verify that spoofed headers do not bypass authentication.

### 8.2 Middleware-level RBAC

| Check | Implementation |
|-------|---------------|
| Protected routes | `matchesRoute(pathname, protectedRoutes)` — exact or prefix match |
| Admin routes | `matchesRoute(pathname, adminRoutes)` — prefix match |
| Admin enforcement | `if (isAdmin && decoded.role !== UserRole.ADMIN) → 403` |
| CSRF | `CSRF_STATE_CHANGING_METHODS.has(req.method)` → `validateCsrf(req)` after auth passes |

### 8.3 Service-level RBAC (established pattern)

Each Phase 2 service implements `verifyTeacher(currentUserId)`:

1. Fetches user via `userRepository.findByIdSafe(currentUserId)`.
2. If user not found → `401 UNAUTHORIZED` ("Requesting user not found").
3. If `user.role !== TEACHER && user.role !== ADMIN` → `403 FORBIDDEN` (role-specific message).
4. Returns `{ id: user._id.toString(), role: user.role }`.

The caller then uses `role` and `id` to scope queries:
- **TEACHER**: `filter.teacherId = requestorId` (list returns only own resources).
- **ADMIN**: no filter added (sees all).
- **TEACHER on get-by-id/update/patch/delete**: If `entity.teacherId !== requestorId` → `404 NOT_FOUND` (not 403, prevents enumeration).

### 8.4 Ownership enforcement (actual)

| Threat | Mitigation | Test evidence |
|--------|-----------|---------------|
| body `teacherId` spoofing on create | Service ignores `data.teacherId` when role is TEACHER; uses `requestorId` | `phase2e.service.security.test.ts:168-183`, `subject.service.test.ts:154-166` |
| Cross-resource ownership (Course subjectId) | `verifyTeacherOwnsSubject` checks subject's teacherId | `phase2e.service.security.test.ts:133-141` |
| Cross-resource ownership (Class courseId) | `verifyTeacherOwnsCourse` checks course's teacherId | `phase2e.service.security.test.ts:110-121` |
| Query param bypass (`teacherId` in list query) | List filter hardcodes `teacherId` from JWT, ignores query param | `phase2e.service.security.test.ts:275-283` |
| IDOR (direct object reference) | get-by-id returns 404 for non-owner teacher | `phase2e.service.security.test.ts:100-108` |
| Spoofed `x-user-id`/`x-user-role` headers | Middleware overwrites from verified JWT | `phase2e.middleware.security.test.ts:112-123` |

### 8.5 Soft-delete enforcement

All Phase 2 models: `findById` returns the document, but service checks `!entity.isActive` → throws `404`. `softDelete` sets `isActive: false`. Repeated soft-delete is idempotent. Repository `findAllPaginated` and `totalCount` use the `filter` passed from the service (which includes `isActive: true`).

### 8.6 What Phase 3 domains will need

| Future domain | RBAC requirement |
|---------------|-----------------|
| Enrollment | Student can view own; Admin/Teacher can enroll. Ownership: admin/teacher creates; student reads. |
| Assignment | Teacher creates (owned); Student views submitted/submit; Parent views children's. |
| Submission | Student creates (owns own); Teacher views all in class; Admin sees all. |
| Exam | Teacher creates; Student/ Parent views. |
| Attendance | Teacher records; Student/Parent views own. |
| Grade | Teacher records; Student/Parent views own. |
| Timetable | Teacher creates; Student/Parent views (scoped by enrollment). |
| Announcement | Teacher/Admin creates; role-targeted recipients view. |
| Notification | System-created; recipient views own. |

**Key constraint**: STUDENT and PARENT roles currently cannot access any Phase 2 endpoint. Phase 3 domains (starting with Enrollment) must add read access for STUDENT/PARENT — this will require a pattern change from "block non-teachers" to "allow role-scoped access."

---

## 9. Current Validation Infrastructure

### 9.1 Reusable schemas (`src/validations/objectId.ts`)

```typescript
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().regex(objectIdRegex, "Invalid ID");
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const searchSchema = z.string().trim().min(1).max(100).optional();
```

Every Phase 2 domain validation file imports these three schemas.

### 9.2 Domain validation pattern (to replicate)

Each domain creates:
- `domainIdParamSchema` — `{ id: objectIdSchema }` (for route param validation)
- `createSchema` — required fields + optional admin-only fields + `.strict()` (blocks mass assignment)
- `updateSchema` (PUT) — all required fields + `.strict()`
- `patchSchema` (PATCH) — all fields optional + `.strict()`
- `listSchema` — extends `paginationSchema` with `search`, `isActive`, domain-specific filters
- Exported types via `z.infer`

### 9.3 `.strict()` mass-assignment protection (critical pattern)

All schemas use `.strict()` to reject unknown fields. This prevents:
- `teacherId` spoofing on create (for non-admin)
- `role` escalation via body injection
- `isActive` tampering via body on non-admin endpoints

Verified by tests: `subject.validation.test.ts:63-70` ("should reject unknown fields (mass assignment)").

### 9.4 What Phase 3 domains can reuse

- `objectIdSchema` — for all foreign key fields (studentId, classId, courseId, etc.)
- `paginationSchema` — for all list endpoints
- `searchSchema` — for all searchable list endpoints
- `UserRole` enum — for role validation
- `.strict()` pattern — for mass-assignment protection
- The `isActive` boolean preprocess pattern — for boolean query params

### 9.5 Date validation

Dates are validated as `z.string().datetime()` in Phase 2 (e.g., `startDate`/`endDate` on Class). The service converts with `new Date(data.startDate)`. Phase 3 domains that need dates (Assignment.dueDate, Exam.scheduledDate) can follow this pattern.

---

## 10. Current Database Conventions

### 10.1 Model initialization convention

```typescript
const Subject = models.Subject || model<ISubject>("Subject", subjectSchema);
```
Uses `models.X` check to prevent re-compilation errors in Next.js hot reload.

### 10.2 Common model options

```typescript
{
  timestamps: true,     // createdAt, updatedAt
  versionKey: false,    // disables __v
}
```

### 10.3 Soft-delete convention

| Aspect | Pattern |
|--------|---------|
| Field | `isActive: { type: Boolean, default: true, index: true }` |
| Repository method | `softDelete(id)` → `findByIdAndUpdate(id, { isActive: false }, { new: true })` |
| Service check | `if (!entity || !entity.isActive) → 404 NOT_FOUND` |
| List filter | Service adds `filter.isActive = true` to all list queries |

### 10.4 Repository pattern (shared by all domains)

```typescript
export class XRepository {
  async create(data: Partial<IX>): Promise<IX>         // Model.create(data)
  async findById(id: string): Promise<IX | null>       // Model.findById(id)
  async update(id, updateData): Promise<IX | null>     // Model.findByIdAndUpdate(id, updateData, { new: true })
  async softDelete(id: string): Promise<IX | null>     // sets isActive: false
  async exists(filter): Promise<boolean>               // Model.exists(filter)
  async totalCount(filter): Promise<number>            // Model.countDocuments(filter)
  async findAllPaginated(filter, page, limit, sortBy, sortOrder): Promise<IX[]>  // lean() with sort/skip/limit
}
```

### 10.5 ObjectId references

All foreign keys use `Schema.Types.ObjectId` with `ref: "ModelName"`:
```typescript
teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
```

### 10.6 Indexes

| Collection | Unique indexes | Non-unique indexes |
|-----------|---------------|-------------------|
| Subject | `{ name: 1, teacherId: 1 }` (compound unique), `{ code: 1 }` | `{ teacherId: 1 }`, `{ isActive: 1 }` |
| Course | `{ code: 1 }` | `{ subjectId: 1 }`, `{ teacherId: 1 }`, `{ isActive: 1 }` |
| Class | `{ code: 1 }`, `{ name: 1, teacherId: 1 }` | `{ courseId: 1 }`, `{ teacherId: 1 }`, `{ isActive: 1 }` |
| User | email is unique (not via index declaration, via `unique: true` on field) | `{ email: 1 }`, `{ providerId: 1 }` (sparse), `{ refreshToken: 1 }` |

### 10.7 Naming conventions

- Models: PascalCase singular (`Subject`, `Course`, `Class`, `User`)
- Collections: plural lowercase (Mongoose default: `subjects`, `courses`, `classes`, `users`)
- Repositories: `XRepository` class + `xRepository` singleton export
- Services: `XService` class + `xService` singleton export
- Controllers: `XController` class + `xController` singleton export
- Types: `IX` interface (e.g., `ISubject`, `ICourse`, `IClass`, `IUser`)
- Validations: `createSchema`, `updateSchema`, `patchSchema`, `listSchema`, `idParamSchema` + `z.infer` types

### 10.8 User repository specifics

`userRepository` has a richer interface than domain repositories:
- `findByEmail` — selects `+password +refreshToken` (for auth flows)
- `findById` — selects `+password`
- `findByIdSafe` — selects `-password -refreshToken` (for RBAC checks)
- `findByGoogleId` — for OAuth
- `updateLastLogin` — resets `loginAttempts` and `lockUntil`
- `incrementLoginAttempts` — account lockout logic
- `exists(email)` — duplicate check
- `findAllPaginated` — returns `{ users, total }` (includes total count)

---

## 11. Frontend Readiness

### 11.1 Current frontend source state

| Extension | Count |
|-----------|-------|
| `.js` | 0 (cleaned) |
| `.jsx` | 0 |
| `.ts` | 52 |
| `.tsx` | 34 |

### 11.2 Frontend architecture (actual)

- **Framework**: Next.js 16 App Router (Turbopack)
- **UI**: Ant Design v6 + CSS Modules
- **State**: Redux Toolkit (`authSlice` for auth state, `uiSlice` for sidebar/theme) + AuthContext wrapper
- **API**: Axios `apiClient` with `withCredentials: true`, 401→refresh→retry interceptors with refresh lock
- **Forms**: React Hook Form + Zod schemas
- **Auth flow**: Session restored via `GET /api/auth/profile` on mount; cookies managed entirely by browser

### 11.3 Frontend infrastructure verified present

| Capability | Files | Status |
|-----------|-------|--------|
| API services | `src/services/api/` (auth only) | EXISTS |
| API hooks | `src/hooks/useMutation.ts`, `src/hooks/auth/*` | EXISTS |
| Authentication | `AuthContext.tsx`, `authSlice.ts`, `useAuth.ts` | EXISTS |
| Protected dashboard | `(dashboard)/layout.tsx` (auth guard) | EXISTS |
| Reusable DataTable | `components/common/DataTable/` (4 files) | EXISTS |
| Reusable ConfirmDialog | `components/common/ConfirmDialog/` (3 files) | EXISTS |
| Loading/Error/Empty states | `components/common/` | EXISTS |
| Forms + validation | React Hook Form + Zod (`auth.schemas.ts`) | EXISTS |
| Notifications (UI) | `useNotification.ts` (AntD message wrapper) | EXISTS |
| Confirmation dialogs | `ConfirmDialog.tsx` | EXISTS |
| Routing | App Router with `(auth)` and `(dashboard)` groups | EXISTS |
| Navigation | Config-driven sidebar (`navigation.ts`, `roleAccess.ts`) | EXISTS |

### 11.4 Frontend route files (actual)

| Route | Status |
|-------|--------|
| `/` | EXISTS (landing) |
| `/login` | EXISTS |
| `/dashboard` | EXISTS (stub — shows welcome message) |
| `/dashboard/profile` | EXISTS |
| `/dashboard/profile/edit` | EXISTS |
| `/dashboard/profile/change-password` | EXISTS |
| `/dashboard/classes` | MISSING |
| `/dashboard/courses` | MISSING |
| `/dashboard/subjects` | MISSING |
| `/dashboard/assignments` | MISSING |
| `/dashboard/grades` | MISSING |
| `/dashboard/attendance` | MISSING |
| `/dashboard/timetable` | MISSING |
| `/dashboard/announcements` | MISSING |
| `/dashboard/admin/users` | MISSING |

### 11.5 Frontend API client contract (actual)

- `src/config/api/constants.ts` defines `API_ROUTES` with **only** auth routes (`/api/auth/login`, `/api/auth/register`, etc.).
- `src/services/api/index.ts` exports only `./auth`.
- **No API services exist for Subject, Course, Class, or any other domain.**
- Axios interceptor (401→refresh→retry) is domain-agnostic — it will automatically handle any new endpoint. No interceptor changes needed.

### 11.6 Nav config (actual — role filtering is stubbed)

`src/config/navigation/navigation.ts` — only 2 items: Dashboard + Profile, both visible to all 4 roles. `src/config/navigation/roleAccess.ts` implements `filterNavItems()` but there are no domain-specific nav items to filter yet. The role filtering infrastructure exists but is not exercised by any feature routes.

### 11.7 What frontend work is blocked

The frontend has **complete infrastructure** to consume any new backend API (axios, hooks, DataTable, forms, auth guard, protected routes). What's missing is simply the API service layer + feature pages for each domain. No infrastructure changes are needed — new domains just add to `services/api/` and `src/app/(dashboard)/`.

---

## 12. Phase 3 Candidate Domains

Based strictly on the actual repository and the dependency chain established by Phase 2:

| # | Domain | Current State | Dependencies | RBAC (planned) | Ownership | Priority |
|---|--------|--------------|--------------|----------------|-----------|----------|
| 1 | **Enrollment** | MISSING | Subject→Course→Class (Phase 2) | Admin/Teacher enroll; Student/Parent view own | Created by admin/teacher; student reads own | **HIGH** |
| 2 | **Assignment** | MISSING | Class, Enrollment | Teacher create (own classes); Student view/submit; Parent view | `createdBy` (teacher); scoped to class/course | **HIGH** |
| 3 | **Submission** | MISSING | Assignment, Enrollment | Student submit own; Teacher view class submissions; Admin all | `studentId` owns; teacher views by class | **HIGH** |
| 4 | **Exam** | MISSING | Class, Enrollment | Teacher create (own); Student/Parent view | `createdBy` (teacher) | **MEDIUM** |
| 5 | **Attendance** | MISSING | Class, Enrollment | Teacher record (own classes); Student/Parent view own | `recordedBy` (teacher) | **HIGH** |
| 6 | **Grade** | MISSING | Assignment, Submission, Enrollment | Teacher grade; Student/Parent view own | `gradedBy` (teacher) | **HIGH** |
| 7 | **Timetable** | MISSING | Class, Course | Teacher create (own); Student/Parent view (scoped) | `createdBy` (teacher) | **MEDIUM** |
| 8 | **Announcement** | MISSING | None (optional Class/Course targeting) | Admin/Teacher create; all view | `createdBy` (teacher/admin) | **LOW-MEDIUM** |
| 9 | **Analytics** | MISSING | All data domains | Role-scoped aggregations | Read-only | **LOW** |
| 10 | **Notification (LMS)** | MISSING | All domains (event-triggered) | System-created; recipient views own | `userId` (recipient) | **LOW** |
| 11 | **Course Material** | MISSING | Course | Teacher upload; Student/Parent view | `uploadedBy` (teacher) | **LOW** (needs upload infra) |
| 12 | **Settings** | MISSING | User | Admin system; User own | `updatedBy` | **LOW** |

**Rationale for prioritization:**
- **Enrollment** is the foundation — without it, there is no mechanism to associate students with classes/courses. Every downstream domain (Assignment, Submission, Exam, Attendance, Grade, Timetable) requires knowing which students belong to which classes.
- **Assignment + Submission** are the core learning delivery loop — they depend on Enrollment.
- **Attendance** and **Grade** depend on Enrollment (to know which students to track).
- **Exam** is a parallel to Assignment but lower priority (Assignments are more fundamental).
- **Timetable** depends on Class/Course existing (Phase 2 done) but benefits from Enrollment.
- **Announcement**, **Notification**, **Analytics**, **Course Material**, **Settings** are cross-cutting/later-stage.

### 12.1 Recommended Phase 3 scope

Based on the dependency chain and the actual repository, Phase 3 should contain:

| Stage | Domain | Justification |
|-------|--------|---------------|
| Phase 3A | **Foundation** | User model relationship fields (student linking), Enrollment validation schemas, repository pattern adaptation |
| Phase 3B | **Enrollment** | First data domain — links students to classes/courses |
| Phase 3C | **(Deferred)** | Assignments/Submissions — deferred to Phase 4 (depends on Enrollment) |
| Phase 3D | **(Deferred)** | Exams — deferred to Phase 4 |
| Phase 3E | **Security/Integration** | RBAC expansion for STUDENT/PARENT read access, middleware route additions, CSRF coverage |
| Phase 3F | **Validation** | Full test suite for Enrollment, integration verification |

---

## 13. Recommended Phase 3 Scope

### Phase 3A — Foundation (types & infrastructure)

**Goal:** Establish the data model and validation infrastructure for Enrollment, and extend the User model to support student identity.

#### User model extension

The current `User` model has no student-specific fields. Phase 3A must add:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `studentId` | String (unique, nullable) | No (optional) | Unique student identifier; nullable for non-students |
| `parentIds` | [ObjectId → User] (default: []) | No | Links to parent users; supports multiple parents |

**Open decision:** The `parentIds` array on Student is the simplest approach but requires a decision on whether to also maintain a reverse `childrenIds` on Parent. Given the audit shows no relationship infrastructure exists, the recommended approach is:

- Add `studentId?: string` (unique) to User — for student identification.
- Add `parentIds?: [ObjectId]` to User — for parent linking. A parent's User document does NOT need a reverse field; queries for "children of parent X" can query `User.find({ parentIds: X })`.
- This is a simple, queryable design that doesn't require a join collection.

**Constraint:** This extends the existing User model only — no new model. The `studentId` field is server-controlled (generated by backend on user creation, not client-supplied via registration).

#### Enrollment validation

Follow the exact pattern from `subject.validation.ts`:
- `enrollmentIdParamSchema` — `{ id: objectIdSchema }`
- `createEnrollmentSchema` — `{ studentId, classId, courseId, status? }` + `.strict()`
- `updateEnrollmentSchema` (PUT) — same required fields + `.strict()`
- `patchEnrollmentSchema` (PATCH) — all optional + `.strict()`
- `enrollmentListSchema` — extends `paginationSchema` with `studentId`, `classId`, `courseId`, `status` filters

**Key validation rule:** `studentId`, `classId`, and `courseId` must be valid ObjectIds. The service must verify the referenced entities exist and are active.

### Phase 3B — Enrollment domain

**Goal:** Link students to classes/courses.

#### Model: Enrollment

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | — | auto | Primary key |
| `studentId` | ObjectId → User | Yes | — | References a User with role STUDENT |
| `classId` | ObjectId → Class | Yes | — | References an active Class |
| `courseId` | ObjectId → Course | Yes | — | References the Course that the Class belongs to |
| `status` | String (enum: ACTIVE, DROPPED, COMPLETED) | Yes | ACTIVE | Enrollment status |
| `enrolledAt` | Date | Yes | `new Date()` | When enrolled (server-controlled) |
| `createdAt` | Date | — | auto | timestamps |
| `updatedAt` | Date | — | auto | timestamps |

**Indexes:**
- `{ studentId: 1, classId: 1 }` — compound unique (prevents duplicate enrollment)
- `{ studentId: 1 }` — for querying by student
- `{ classId: 1 }` — for querying by class
- `{ courseId: 1 }` — for querying by course
- `{ status: 1 }` — for filtering active/dropped

**Soft-delete:** `isActive: Boolean` field (following Phase 2 convention) — set to false on "delete" rather than physical removal. This preserves audit trail.

**Server-controlled fields:** `enrolledAt`, `studentId` (cannot be spoofed — must come from the authenticated request or admin-specified), `courseId` (derived/verified from classId).

#### Repository: EnrollmentRepository

Follow the exact pattern from `class.repository.ts`:
- `create(data)`, `findById(id)`, `update(id, updateData)`, `softDelete(id)`
- `exists(filter)`, `totalCount(filter)`, `findAllPaginated(filter, page, limit, sortBy, sortOrder)`
- **New**: `findByStudent(studentId, isActive)` — returns all enrollments for a student
- **New**: `findByClass(classId, isActive)` — returns all enrollments for a class
- **New**: `findByStudentAndClass(studentId, classId)` — for duplicate check

#### Service: EnrollmentService

**RBAC:**
- `verifyAuthorized(currentUserId)` — allows ADMIN and TEACHER to enroll/manage; allows STUDENT/PARENT to view own.
- Different from `verifyTeacher` — this must allow STUDENT/PARENT for read operations.

**Methods:**

| Method | Allowed roles | Ownership check |
|--------|---------------|-----------------|
| `createEnrollment` | ADMIN, TEACHER | Admin/teacher creates enrollment for a student |
| `listEnrollments` | ADMIN, TEACHER, STUDENT, PARENT | Student sees own; teacher sees students in own classes; admin sees all |
| `getEnrollmentById` | ADMIN, TEACHER, STUDENT, PARENT | Student can only see own enrollment |
| `updateEnrollment` | ADMIN, TEACHER | Only admin/teacher can modify enrollment status |
| `patchEnrollment` | ADMIN, TEACHER | Same |
| `deleteEnrollment` (soft-delete) | ADMIN, TEACHER | Only admin/teacher |

**Ownership logic:**
- A STUDENT can only view their own enrollments (`studentId === requestorId`).
- A TEACHER can view enrollments where the Class's `teacherId === requestorId` — requires checking the Class model.
- A PARENT can view enrollments where the Student's `parentIds` includes `requestorId` — requires checking the User model.
- `courseId` is **never accepted from the request body** — it is derived from the `classId` by looking up the Class. This prevents inconsistency (a student enrolled in a class must also be enrolled in that class's course).

### Phase 3C — (Deferred to Phase 4)

Assignments and Submissions are deferred. They depend on Enrollment being complete so that "which students can submit" can be determined.

### Phase 3D — (Deferred to Phase 4)

Exams are deferred. They follow the same pattern as Assignments but are lower priority.

### Phase 3E — Security & Integration

**Middleware changes needed:**
- Add `/api/enrollments` to `protectedRoutes` so authentication is required.
- `/api/enrollments/:id` is automatically covered by the prefix match (`matchesRoute` uses `pathname.startsWith`).
- CSRF applies to POST/PUT/PATCH/DELETE on these routes (already handled by `CSRF_STATE_CHANGING_METHODS`).

**RBAC changes needed:**
- The current `verifyTeacher` pattern blocks STUDENT/PARENT entirely. Phase 3 requires a new authorization helper that allows STUDENT/PARENT for read operations.
- Pattern: `verifyEnrolledOrTeacherOrAdmin(currentUserId, studentId?, classId?)` — checks if the requestor is admin/teacher, or if they are the student/parent being queried.

**IDOR protection:**
- All get-by-id operations must scope by `studentId` (for student/parent requestors).
- All list operations must scope by role (student sees only own, teacher sees own classes' students).
- Return `404 NOT_FOUND` (not 403) for resources the user shouldn't see.

### Phase 3F — Validation & Exit Criteria

**Test requirements (following established patterns):**

Service tests (`src/services/__tests__/enrollment.service.test.ts`):
- Admin can enroll student in class
- Teacher can enroll student in own class's course
- Teacher cannot enroll student in another teacher's class
- STUDENT can list own enrollments
- STUDENT cannot create enrollment
- PARENT can view child's enrollments (if parentIds includes requestor)
- STUDENT cannot access another student's enrollment (IDOR)
- Duplicate enrollment rejected (unique constraint)
- Soft-delete sets isActive=false, idempotent
- Admin can update enrollment status
- Teacher can update, Student cannot
- Nonexistent classId → 404
- Nonexistent studentId → 404

Middleware/security tests (`src/__tests__/phase3.middleware.security.test.ts`):
- `/api/enrollments` requires auth (401 without token)
- `/api/enrollments/:id` requires auth
- CSRF required for POST/PUT/PATCH/DELETE
- STUDENT token accepted (middleware authenticates; service enforces RBAC)

Validation tests (`src/validations/__tests__/enrollment.validation.test.ts`):
- ObjectId validation on studentId, classId, courseId
- `.strict()` rejects unknown fields (mass assignment)
- Status enum validation
- Pagination defaults

**Exit criteria:**
- 313+ existing tests still pass (no regressions)
- New tests: ~40+ assertions across service, validation, and security
- TypeScript: PASS
- ESLint: PASS
- Build: PASS

---

## 14. Dependency Graph

```text
User (role: STUDENT, teacherId)
  │
  ├── Subject (Phase 2 — COMPLETE)
  │     │
  │     └── teacherId → User
  │           │
  │           └── Course (Phase 2 — COMPLETE)
  │                 │
  │                 ├── subjectId → Subject
  │                 ├── teacherId → User
  │                 │
  │                 └── Class (Phase 2 — COMPLETE)
  │                       │
  │                       ├── courseId → Course
  │                       └── teacherId → User
  │                             │
  │                             └── Enrollment (Phase 3 — PLANNED)
  │                                   │
  │                                   ├── studentId → User (role: STUDENT)
  │                                   ├── classId → Class
  │                                   └── courseId → Course (DERIVED from Class)
  │
  └── Admin (/api/admin/users) (Phase 1 — COMPLETE)
        └── teacherId → User (for ownership checks)
```

**Phase 3 forward dependency chain:**

```text
Enrollment (Phase 3B)
  │
  ├── Assignment (Phase 4) — needs Class + Enrollment
  │     │
  │     └── Submission (Phase 4) — needs Assignment + Enrollment
  │
  ├── Exam (Phase 4) — needs Class + Enrollment
  │
  ├── Attendance (Phase 5) — needs Class + Enrollment
  │
  ├── Grade (Phase 6) — needs Assignment/Exam + Enrollment
  │
  ├── Timetable (Phase 7) — needs Class + Enrollment
  │
  ├── Announcement (Phase 8) — needs User + Class/Course
  │
  └── Notification (Phase 9) — needs ALL above (event-triggered)
        └── Analytics (Phase 10) — aggregation over all domains
```

### Actual relationship chain (post-Phase 2)

```text
User
 ↓ teacherId
Subject
 ↓ subjectId
Course (also ↓ teacherId → User)
 ↓ courseId
Class (also ↓ teacherId → User)
 ↓ (NEW — Phase 3)
Enrollment (studentId → User, classId → Class, courseId → Course)
```

### Verification of non-disruptive addition

The proposed Enrollment model does **NOT** change any existing Subject/Course/Class contracts:
- `Class` model is unchanged — Enrollment references `classId` (read-only lookup). No `studentIds` array is added to Class (the proposal in the outdated capability plan to add `studentIds` to Class is **not** adopted — Enrollment is the linking table instead).
- `Course` model is unchanged — Enrollment references `courseId` (derived from Class lookup).
- `Subject` model is unchanged.
- `User` model gets two optional fields (`studentId`, `parentIds`) — these are additive and nullable, so existing queries are unaffected.

---

## 15. Data Model Plans

### 15.1 Enrollment model (proposed for Phase 3B)

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | auto-generated | — | Primary key |
| `studentId` | ObjectId → User | Yes | — | Must reference a User with `role: STUDENT`; must be active |
| `classId` | ObjectId → Class | Yes | — | Must reference an active Class |
| `courseId` | ObjectId → Course | Yes (server-derived) | — | Derived from `classId.courseId`; never client-supplied |
| `status` | String (enum) | Yes | ACTIVE | ACTIVE, DROPPED, COMPLETED |
| `enrolledAt` | Date | Yes (server-controlled) | `new Date()` | Never client-supplied |
| `isActive` | Boolean | — | true | Soft-delete flag (Phase 2 convention) |
| `createdAt` | Date | auto | — | timestamps |
| `updatedAt` | Date | auto | — | timestamps |

**Indexes:**
- `{ studentId: 1, classId: 1 }` — compound unique (prevents duplicate enrollment)
- `{ studentId: 1, isActive: 1 }` — efficient student enrollment queries
- `{ classId: 1, isActive: 1 }` — efficient class roster queries
- `{ status: 1 }` — status filtering

**Uniqueness:** A student can only be enrolled once in a given class. The compound unique index on `{ studentId, classId }` enforces this at the database level.

### 15.2 User model extension (proposed for Phase 3A)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `studentId` | String (unique, nullable) | No | null | Unique student identifier; generated server-side |
| `parentIds` | [ObjectId → User] | No | [] | Array of parent User references |

**Why not add `studentIds` to Class?** The existing Class model has no `studentIds` field. Adding it would denormalize enrollment data and create consistency issues. The Enrollment model is the single source of truth for student-class linkage.

### 15.3 Future domain models (documented for reference, not Phase 3)

#### Assignment (Phase 4 — not in scope for Phase 3)

| Field | Type | Notes |
|-------|------|-------|
| `title` | String (required) | — |
| `description` | String (nullable) | — |
| `classId` | ObjectId → Class (required) | Scoped to teacher's own classes |
| `courseId` | ObjectId → Course (required) | Derived from classId |
| `dueDate` | Date (required) | `z.string().datetime()` validated |
| `maxPoints` | Number | — |
| `submissionType` | String (enum: FILE, TEXT, LINK, QUIZ) | — |
| `allowLateSubmissions` | Boolean | default false |
| `latePenaltyPercent` | Number | default 0 |
| `createdBy` | ObjectId → User (required) | Teacher who created |
| `published` | Boolean | default false |
| `isActive` | Boolean | default true (soft-delete) |

#### Submission (Phase 4)

| Field | Type | Notes |
|-------|------|-------|
| `assignmentId` | ObjectId → Assignment (required) | — |
| `studentId` | ObjectId → User (required) | Submitting student |
| `content` | String (nullable) | Text content |
| `attachments` | [String] | File URLs (needs upload infra) |
| `submittedAt` | Date | — |
| `status` | String (enum: DRAFT, SUBMITTED, LATE, MISSING) | — |
| `isActive` | Boolean | default true (soft-delete) |

Indexes: compound unique `{ assignmentId, studentId }`.

---

## 16. API Plans

### 16.1 Phase 3B — Enrollment endpoints

| Method | Path | Purpose | Auth | RBAC | Body |
|--------|------|---------|------|------|------|
| GET | `/api/enrollments` | List enrollments (scoped by role) | Yes | ADMIN: all; TEACHER: own classes' students; STUDENT: own; PARENT: children's | Query: `?page=&limit=&classId=&studentId=&status=` |
| POST | `/api/enrollments` | Create enrollment | Yes | ADMIN or TEACHER only | `{ studentId, classId, status? }` — `courseId` derived server-side |
| GET | `/api/enrollments/:id` | Get enrollment by ID | Yes | ADMIN, TEACHER (if student in own class), STUDENT (if own), PARENT (if child's) | — |
| PUT | `/api/enrollments/:id` | Update enrollment (full) | Yes | ADMIN or TEACHER only | `{ studentId, classId, status }` |
| PATCH | `/api/enrollments/:id` | Update enrollment (partial) | Yes | ADMIN or TEACHER only | `{ status? }` |
| DELETE | `/api/enrollments/:id` | Soft-delete enrollment | Yes | ADMIN or TEACHER only | — |

**Query parameter scoping:**
- STUDENT: `?studentId` is ignored; always scoped to `requestorId`.
- TEACHER: `?classId` filters to own classes; if no classId provided, returns all students in all classes taught by this teacher.
- PARENT: list is scoped to students where `parentIds` includes `requestorId`.
- ADMIN: can filter by any `studentId`, `classId`, `status`.

**Server-controlled fields (never in request body):**
- `courseId` — derived from `classId` lookup
- `enrolledAt` — set to `new Date()` on creation
- `_id` — auto-generated by MongoDB

### 16.2 Future API endpoints (Phase 4+ — documented for dependency understanding)

#### Assignment (`/api/assignments`)

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| GET | `/api/assignments` | List (scoped by role) | Yes | Teacher: own classes; Student: enrolled classes; Admin: all |
| POST | `/api/assignments` | Create | Yes | Teacher or Admin |
| GET | `/api/assignments/:id` | Detail | Yes | Scoped by class enrollment |
| PUT/PATCH | `/api/assignments/:id` | Update | Yes | Owner teacher or Admin |
| DELETE | `/api/assignments/:id` | Soft-delete | Yes | Owner teacher or Admin |

#### Submission (`/api/submissions`)

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| GET | `/api/submissions` | List (scoped) | Yes | Teacher: class submissions; Student: own; Admin: all |
| POST | `/api/submissions` | Submit | Yes | Student (own, enrolled only) |
| GET | `/api/submissions/:id` | Detail | Yes | Owner student, or teacher of class, or admin |
| PUT/PATCH | `/api/submissions/:id` | Update | Yes | Owner student (if not graded), or teacher |
| DELETE | `/api/submissions/:id` | Delete | Yes | Owner student, or teacher |

### 16.3 Middleware changes required

Current `protectedRoutes` in `src/middleware.ts:10`:
```typescript
const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout", "/api/subjects", "/api/courses", "/api/classes"];
```

**For Phase 3B**, add:
```typescript
const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout", "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments"];
```

The `/api/enrollments/:id` path is automatically covered by the prefix match (`matchesRoute` checks `pathname === route || pathname.startsWith(route + "/")`).

No admin route changes needed — Enrollment is not admin-only (STUDENT/PARENT can read).

---

## 17. RBAC/Security Plans

### 17.1 Required RBAC for Enrollment (Phase 3B)

| Role | Create | Read (list) | Read (by ID) | Update | Delete |
|------|--------|-------------|--------------|--------|--------|
| ADMIN | ✓ | ✓ (all) | ✓ (all) | ✓ | ✓ |
| TEACHER | ✓ (own classes) | ✓ (own classes' students) | ✓ (if student in own class) | ✓ (own classes) | ✓ (own classes) |
| STUDENT | ✗ | ✓ (own only) | ✓ (own only) | ✗ | ✗ |
| PARENT | ✗ | ✓ (children's) | ✓ (children's) | ✗ | ✗ |

### 17.2 Ownership model

| Resource | Owner field | Rule |
|----------|-------------|------|
| Enrollment | `studentId` | Student owns their own enrollment; can only read |
| Enrollment | `classId.teacherId` | Teacher owns enrollments in their classes (read all, create, update, delete) |
| Enrollment (parent view) | `studentId.parentIds` | Parent reads enrollments where student's `parentIds` includes parent |

### 17.3 IDOR protection

- **Student accessing another student's enrollment**: Service checks `enrollment.studentId === requestorId`. Returns `404 NOT_FOUND` (not 403) to prevent enumeration.
- **Teacher accessing class outside ownership**: Service checks if the enrollment's `classId` belongs to a Class whose `teacherId === requestorId`. Returns `404`.
- **Parent accessing non-child's enrollment**: Service checks if `enrollment.studentId.parentIds` includes `requestorId`. Returns `404`.
- **courseId spoofing in body**: `courseId` is **never** accepted from the request body. It is derived server-side from `classId` lookup. The `createEnrollmentSchema` and `updateEnrollmentSchema` use `.strict()` to reject any `courseId` field in the body.

### 17.4 Server-controlled fields

| Field | Why server-controlled |
|-------|----------------------|
| `courseId` | Derived from `classId` lookup — prevents inconsistency |
| `enrolledAt` | Timestamp of enrollment — should reflect server time, not client |
| `_id` | MongoDB auto-generates |
| `status` (on read-only access) | STUDENT/PARENT cannot modify status |

### 17.5 Strict validation

- All schemas use `.strict()` to reject unknown fields.
- `studentId`, `classId` validated with `objectIdSchema`.
- `status` validated with `z.enum(["ACTIVE", "DROPPED", "COMPLETED"])`.
- `courseId` is **not** in any input schema (body) — it is server-derived.

### 17.6 Soft-delete

- `isActive: Boolean (default: true)` field on Enrollment.
- `softDelete(id)` → sets `isActive: false`.
- List/get operations filter by `isActive: true`.
- Idempotent: repeated soft-delete returns the already-inactive record.

### 17.7 CSRF requirements

CSRF is already handled by middleware for all protected routes with state-changing methods (POST, PUT, PATCH, DELETE). Adding `/api/enrollments` to `protectedRoutes` automatically applies CSRF protection. No additional CSRF logic needed.

### 17.8 Repository query scoping

The Enrollment repository must support:
- `findAllPaginated(filter, ...)` — for admin/teacher scoped lists
- `findByStudent(studentId, isActive)` — for student self-view
- `findByClass(classId, isActive)` — for teacher class rosters
- `findByStudentAndClass(studentId, classId)` — for duplicate check
- All queries must scope by `isActive: true` at the repository level.

---

## 18. Validation Plans

### 18.1 Reusable infrastructure

| Schema | Source | Reuse for Enrollment |
|--------|--------|----------------------|
| `objectIdSchema` | `validations/objectId.ts` | ✓ For `studentId`, `classId` |
| `paginationSchema` | `validations/objectId.ts` | ✓ For list endpoint |
| `searchSchema` | `validations/objectId.ts` | ✓ (if search needed) |
| `.strict()` pattern | Phase 2 schemas | ✓ Rejects mass assignment |
| `UserRole` enum | `types/user.types.ts` | ✓ Role validation |

### 18.2 New schemas (Phase 3A)

`src/validations/enrollment.validation.ts`:

```typescript
import { z } from "zod";
import { objectIdSchema, paginationSchema, searchSchema } from "./objectId";

export const enrollmentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const statusEnum = z.enum(["ACTIVE", "DROPPED", "COMPLETED"]);

export const createEnrollmentSchema = z.object({
  studentId: objectIdSchema,
  classId: objectIdSchema,
  status: statusEnum.optional().default("ACTIVE"),
})
.strict();  // Rejects courseId, enrolledAt, isActive from body

export const updateEnrollmentSchema = z.object({
  studentId: objectIdSchema,
  classId: objectIdSchema,
  status: statusEnum,
})
.strict();

export const patchEnrollmentSchema = z.object({
  status: statusEnum.optional(),
})
.strict();  // Students can only patch status (but service blocks students from patching)

export const enrollmentListSchema = paginationSchema.extend({
  studentId: objectIdSchema.optional(),
  classId: objectIdSchema.optional(),
  status: statusEnum.optional(),
  isActive: z.preprocess(
    (val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      if (val === undefined || val === null) return undefined;
      return val;
    },
    z.boolean().optional(),
  ).optional(),
});

export type EnrollmentIdParam = z.infer<typeof enrollmentIdParamSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type PatchEnrollmentInput = z.infer<typeof patchEnrollmentSchema>;
export type EnrollmentListQuery = z.infer<typeof enrollmentListSchema>;
```

### 18.3 Validation test requirements

Tests for `src/validations/__tests__/enrollment.validation.test.ts`:
- `objectIdSchema` accepts/rejects valid/invalid ObjectIds
- `createEnrollmentSchema`: accepts valid input, rejects missing fields, rejects `courseId` (not in schema), rejects unknown fields (mass assignment), accepts optional `status`, defaults to ACTIVE
- `updateEnrollmentSchema`: rejects missing required fields, rejects `courseId`, rejects unknown fields
- `patchEnrollmentSchema`: accepts partial, rejects unknown fields, rejects `studentId`/`classId` in PATCH
- `enrollmentListSchema`: defaults page/limit, accepts filters, rejects invalid status

---

## 19. Testing Strategy

### 19.1 Current test infrastructure (actual)

| Aspect | Implementation |
|--------|---------------|
| Test runner | `node:test` via `npx tsx --test` (package.json `"test": "npx tsx --test"`) |
| Test library | Native Node.js `node:test` + `node:assert` (NO Jest) |
| Test files | `*.test.ts` in `__tests__/` directories |
| Mocking | In-memory mock objects (manual mocks, NOT sinon/mocking library) — repositories are monkey-patched on the singleton instance |
| DB | NO mongodb-memory-server — tests use mocked repository singletons; no real DB connection |
| Environment | `MONGODB_URI` must be set for `connectDB` in `apiHandler`, but service-level tests bypass `apiHandler` and mock repositories directly |

### 19.2 Test file inventory (14 files, ~300 test cases)

| File | Test count | Coverage area |
|------|-----------|---------------|
| `src/__tests__/phase2e.middleware.security.test.ts` | 11 | Middleware route protection, token validation, header spoof protection |
| `src/__tests__/phase2e.service.security.test.ts` | 19 | RBAC & ownership enforcement, IDOR, soft-delete |
| `src/services/__tests__/subject.service.test.ts` | 26 | Subject CRUD, RBAC, ownership |
| `src/services/__tests__/course.service.test.ts` | 32 | Course CRUD, RBAC, ownership, cross-resource verification |
| `src/services/__tests__/class.service.test.ts` | 43 | Class CRUD, RBAC, ownership, date validation, cross-resource |
| `src/services/__tests__/admin.service.test.ts` | 29 | Admin user management, RBAC, sanitization |
| `src/validations/__tests__/subject.validation.test.ts` | 22 | Subject Zod schemas, strict mode, mass assignment |
| `src/validations/__tests__/course.validation.test.ts` | 23 | Course Zod schemas |
| `src/validations/__tests__/admin.validation.test.ts` | 29 | Admin Zod schemas |
| `src/validations/__tests__/auth.validation.test.ts` | 8 | Auth Zod schemas |
| `src/lib/__tests__/cors.test.ts` | 4 | CORS middleware behavior |
| `src/lib/__tests__/csrf.test.ts` | 36 | CSRF token generation, validation, timing-safe comparison |
| `src/lib/__tests__/userSanitization.test.ts` | 13 | User field stripping, null handling |
| `src/utils/__tests__/handleMongoError.test.ts` | 5 | Duplicate key → 409 conversion |
| **TOTAL** | **~300** | |

Note: The Phase 2 release stated "313/313 tests" — this count includes tests nested within `describe` blocks that may use different indentation patterns (`it` at various nesting levels). The exact count depends on how `node:test` discovers and counts tests. The baseline of 313 is confirmed by the Phase 2 release.

### 19.3 Test patterns to replicate (Phase 3)

#### Service test pattern

```typescript
// 1. Import service, repositories, types, AppError
import { enrollmentService } from "@/services/enrollment.service";
import { enrollmentRepository } from "@/repositories/enrollment.repository";
import { userRepository } from "@/repositories/user.repository";
// ...

// 2. Define mock data
const mockTeacher = { _id: "...", role: UserRole.TEACHER, isActive: true, ... };
const mockStudent = { _id: "...", role: UserRole.STUDENT, isActive: true, parentIds: [...], ... };
const mockClass = { _id: "...", teacherId: "..." as ObjectId, courseId: "..." as ObjectId, isActive: true };

// 3. Define default mock repository
const defaultMock = {
  findById: async (id: string) => mockEnrollments.find(...),
  create: async (data: Partial<IEnrollment>) => ({ ...mockEnrollments[0], ...data }),
  ...
};

// 4. installMockRepo() — monkey-patch singletons
function installMockRepo() {
  const repo = enrollmentRepository as unknown as Record<string, unknown>;
  const source = { ...defaultMock, ...mockOverrides };
  repo.findById = source.findById;
  // ...
}

// 5. Tests use beforeEach to reset + install mocks
beforeEach(() => { mockOverrides = {}; installMockRepo(); });

// 6. Test RBAC, ownership, idempotency, cross-resource checks
it("STUDENT cannot create enrollment", async () => { ... });
```

#### Validation test pattern

```typescript
// Uses safeParse + assert on result.success
it("should reject unknown fields (mass assignment)", () => {
  const result = createEnrollmentSchema.safeParse({ studentId, classId, courseId: "hijack" });
  assert.equal(result.success, false);
});
```

#### Middleware test pattern

```typescript
// Tests middleware directly with NextRequest
// Verifies: 401 without token, 403 for non-admin on admin routes,
// 200 for valid token on protected routes, header spoof protection
it("should require auth for POST /api/enrollments", async () => {
  const req = makeRequest("POST", "/api/enrollments");
  const response = await middleware(req);
  assert.equal(response.status, 401);
});
```

### 19.4 Test count projection for Phase 3

| Test file | Projected tests |
|-----------|----------------|
| `src/services/__tests__/enrollment.service.test.ts` | 25-30 |
| `src/validations/__tests__/enrollment.validation.test.ts` | 15-20 |
| `src/__tests__/phase3.middleware.security.test.ts` | 8-12 |
| **Total (estimated)** | **~50-62 new tests** |

### 19.5 Frontend testing

The frontend currently has **no test infrastructure** — `package.json` has no `test` script, no test dependencies (no Jest, Vitest, or Playwright). The frontend testing strategy is out of scope for Phase 3 (backend planning phase).

---

## 20. Implementation Sequence

### Phase 3A — Foundation (prerequisite)

| Step | Task | Files to create/modify |
|------|------|----------------------|
| 1 | Add `studentId` and `parentIds` fields to User model | `src/models/user.model.ts`, `src/types/user.types.ts` |
| 2 | Create Enrollment validation schemas | `src/validations/enrollment.validation.ts` |
| 3 | Create Enrollment type interface | `src/types/enrollment.types.ts` |
| 4 | Add error message constants | `src/constants/errorMessages.ts` (add ENROLLMENT_NOT_FOUND, INVALID_ENROLLMENT, etc.) |

### Phase 3B — Enrollment domain

| Step | Task | Files to create |
|------|------|----------------|
| 1 | Create Enrollment model | `src/models/enrollment.model.ts` |
| 2 | Create Enrollment repository | `src/repositories/enrollment.repository.ts` |
| 3 | Create Enrollment service | `src/services/enrollment.service.ts` |
| 4 | Create Enrollment controller | `src/controllers/enrollment.controller.ts` |
| 5 | Create API routes | `src/app/api/enrollments/route.ts`, `src/app/api/enrollments/[id]/route.ts` |
| 6 | Update middleware protected routes | `src/middleware.ts` (add `/api/enrollments`) |

### Phase 3E — Security & Integration

| Step | Task | Files |
|------|------|-------|
| 1 | Verify RBAC for STUDENT/PARENT read access | `src/services/enrollment.service.ts` |
| 2 | Verify IDOR protection | `src/services/enrollment.service.ts` |
| 3 | Verify CSRF coverage | `src/middleware.ts` (automatic via prefix match) |
| 4 | Verify mass assignment protection | Validation schemas (`.strict()`) |

### Phase 3F — Validation

| Step | Task | Files to create |
|------|------|----------------|
| 1 | Service tests | `src/services/__tests__/enrollment.service.test.ts` |
| 2 | Validation tests | `src/validations/__tests__/enrollment.validation.test.ts` |
| 3 | Security/middleware tests | `src/__tests__/phase3.middleware.security.test.ts` |
| 4 | Run full test suite | `npm test` — verify 313 + N pass |
| 5 | TypeScript check | `npx tsc --noEmit` |
| 6 | Lint check | `npm run lint` |
| 7 | Build check | `npm run build` |

### Why not Assignments/Exams in Phase 3?

Assignments and Submissions depend on Enrollment existing — without knowing which students are enrolled in a class, there's no way to scope submission access. They are deferred to Phase 4 (after Enrollment is complete) to maintain the dependency chain:

```
Phase 2: Subject → Course → Class  (DONE)
Phase 3: Enrollment                 (NEXT)
Phase 4: Assignment + Submission    (after Enrollment)
Phase 5: Attendance                 (after Enrollment)
Phase 6: Grades & Results           (after Assignments/Exams)
```

---

## 21. Risks / Blockers

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **User model change required** — adding `studentId` and `parentIds` modifies the core auth model. Any production data must be migrated. | HIGH | Fields are nullable/optional with defaults — existing users are unaffected. Migration is additive (no data loss). |
| 2 | **RBAC pattern change** — Phase 2's `verifyTeacher` blocks STUDENT/PARENT entirely. Phase 3 requires a new `verifyEnrolledOrTeacherOrAdmin` that allows student/parent read access. This is a new authorization helper, not a redesign. | MEDIUM | Follow the same service-level pattern (verify user, check role, scope query). No middleware changes needed beyond adding the route prefix. |
| 3 | **Parent-child relationship design** — the `parentIds` array on Student is simple but queries for "all children of parent X" require a collection scan (`User.find({ parentIds: X })`). No index on array elements unless a multikey index is added. | LOW | Add a multikey index on `parentIds` field. Documented as a known consideration. |
| 4 | **courseId derivation** — Enrollment derives `courseId` from the Class's `courseId`. This requires a repository lookup at creation time, adding a DB round-trip. | LOW | Acceptable trade-off for data consistency. The lookup is cached by MongoDB for active classes. |
| 5 | **STUDENT/PARENT can't access Phase 2 APIs** — The current RBAC blocks STUDENT/PARENT from Subject/Course/Class endpoints. This is correct for Phase 2 (those are teacher-only resources) but means students cannot yet "see" their classes/courses. Phase 3 (Enrollment) is the first domain where STUDENT/PARENT get read access. | LOW (by design) | Enrollment introduces the first read-access pattern for STUDENT/PARENT. Phase 2 resources remain teacher-only. |
| 6 | **No test infrastructure changes needed** — The existing `node:test` + `tsx` approach works for all new domains. No Jest or mongodb-memory-server needed. | NONE | Tests use the same in-memory mock repository pattern. |
| 7 | **User model `permissions` field is unused** — The `permissions: string[]` field on User exists but is never used. Phase 3 should not build on it. | INFO | Keep using role-based checks (`user.role`) consistent with Phase 2. Do not introduce permission codes in Phase 3. |
| 8 | **Single refresh token per user** — The User model stores one `refreshToken` (not an array). Multi-device sessions invalidate each other. This is a pre-existing constraint, unchanged by Phase 3. | LOW (pre-existing) | Document as known limitation; do not address in Phase 3. |
| 9 | **Email service is a stub** — `emailService.ts` only logs. No real email sending. Phase 3 (Enrollment) does not require email, so this is not a blocker. | NONE for Phase 3 | Out of scope. |

---

## 22. Explicit Out-of-Scope List

The following are **explicitly NOT** part of Phase 3 planning or implementation:

1. **Assignment, Submission, Exam, Quiz, Question** — deferred to Phase 4 (depend on Enrollment)
2. **Attendance** — deferred to Phase 5 (depends on Enrollment)
3. **Grade/Result** — deferred to Phase 6 (depends on Assignment/Exam)
4. **Timetable/Schedule** — deferred to Phase 7 (depends on Enrollment)
5. **Announcement** — deferred to Phase 8 (low priority, no dependency on Enrollment)
6. **Notification (LMS)** — deferred to Phase 9 (event-triggered, depends on all domains)
7. **Analytics** — deferred to Phase 10 (aggregation over all domains)
8. **Course Material/File upload** — deferred (requires file storage infrastructure: S3/Cloudinary)
9. **Settings** — deferred (low priority)
10. **Lesson, Chapter, Module** — not in the canonical 15-domain plan; "Course" is the content container. If course content structure is needed, it's a separate future phase.
11. **Microservices, event buses, queues, GraphQL, WebSockets** — explicitly excluded per planning constraints. Architecture remains Next.js App Router + MongoDB + Mongoose + TypeScript + Zod + JWT.
12. **Frontend implementation** — no feature pages, API services, or hooks for Subject/Course/Class/Enrollment are created. Frontend infrastructure exists but is unused until backend APIs are ready.
13. **Jest, mongodb-memory-server** — the existing `node:test` runner is sufficient; no test framework migration.
14. **`permissions` field implementation** — the unused `permissions: string[]` on User is not activated. Role-based checks remain the pattern.
15. **Multi-device session support** — single refresh token per user remains the design.

---

## 23. Phase 3 Readiness Assessment

### Readiness checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Dependencies are understood | ✓ | Enrollment depends on User (STUDENT role), Class (Phase 2), Course (Phase 2). All verified from source. |
| Required relationships are understood | ✓ | Student→User, Class→Course→Subject→User chain confirmed. User model needs `studentId` + `parentIds` extension. |
| Security model is defined | ✓ | RBAC: ADMIN/TEACHER create; STUDENT/PARENT read own. IDOR: 404 for non-owned. CSRF: automatic via middleware. Ownership: `studentId` + `classId.teacherId` + `studentId.parentIds`. |
| API contracts are planned | ✓ | 6 endpoints (GET/POST/GET/:id/PUT/:id/PATCH/:id/DELETE) with full request/response/RBAC documented. `courseId` derived server-side, not in body. |
| Data models are planned | ✓ | Enrollment model with 8 fields, 5 indexes, soft-delete, server-controlled `enrolledAt`/`courseId`. User extension with `studentId`/`parentIds`. |
| Implementation sequence is clear | ✓ | Phase 3A (foundation) → 3B (Enrollment) → 3E (security) → 3F (validation). No circular dependencies. |
| Architecture is reusable | ✓ | Same Route→Controller→Service→Repository→Model pattern. Same `apiHandler`, `AppError`, `sendResponse`, Zod validation, mock-repository test pattern. |
| Existing tests won't regress | ✓ | No changes to Phase 1/2 code. New middleware route addition is additive (prefix match). User model extension is additive (nullable fields). |
| Frontend is unblocked | ✓ | Frontend has axios client, hooks, DataTable, auth guard, protected routes — all ready. No infrastructure changes needed. Just needs API services + feature pages (future work). |

### Blockers (resolved)

| Potential blocker | Resolution |
|-------------------|------------|
| No enrollment model exists | Will be created in Phase 3B (new file, no disruption to existing) |
| User model lacks student fields | Additive nullable fields (`studentId`, `parentIds`) — no data migration risk |
| STUDENT/PARENT blocked by `verifyTeacher` | New `verifyEnrolledOrTeacherOrAdmin` helper for Enrollment only; does not modify Phase 2 services |
| No parent-child relationship | `parentIds: [ObjectId]` on User — simple, queryable with multikey index |
| Frontend has no domain API services | Pre-existing gap — frontend is prepared to add them once backend APIs exist |

### Remaining decisions (deferred, not needed for Phase 3)

1. **Multi-device sessions** (single vs. multiple refresh tokens) — not needed for Enrollment.
2. **Permission codes vs. role-based** — Phase 3 uses role-based (consistent with Phase 2).
3. **File upload infrastructure** — not needed for Enrollment.
4. **Email provider** — not needed for Enrollment.
5. **UUID vs. ObjectId** — current pattern uses MongoDB ObjectId; Enrollment follows suit.

---

PHASE 3 READY FOR IMPLEMENTATION

---

*End of Phase 3 Planning Document*

**Note on prior documentation:** The `BACKEND_FEATURE_CAPABILITY_PLAN.md` (dated 2026-08-27) was written before Phase 2 implementation and describes the Phase 1 baseline (only User model exists). This document supersedes it for Phase 3 planning, based on direct inspection of the actual Phase 2-completed repository. The canonical 15-domain list and high-level phase numbering (Phases 1-10) from that document remain valid for long-term roadmap reference, but the "NOT IMPLEMENTED" statuses for Subject/Course/Class in that document are now outdated.