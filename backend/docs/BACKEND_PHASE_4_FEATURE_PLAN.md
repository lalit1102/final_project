# LearnSphere Backend — Phase 4 Feature Plan

## Planning-Only Document (Read-Only Audit)

**Status:** AUDIT ONLY — No backend, frontend, or configuration files were modified.
**Branch:** `feature/backend-feature-planning`
**Checkpoint commit:** `1a8f4e1` — Phase 3 remediation complete (470/470 tests, TypeScript, ESLint, build, security audit all pass)
**Audit date:** 2026-08-28

---

## 1. Executive Summary

Phase 3 (Enrollment domain + Student/Parent relationships + security remediation) is officially complete and verified. The audit confirms a mature, layered backend architecture (`Route → Controller → Service → Repository → Model → MongoDB`) with a comprehensive test suite (470 tests via `node:test` + `tsx`), TypeScript strict mode, ESLint, and a successful production build.

Phase 4's recommended scope is **Learning Content + Assignments + Submissions** — the core pedagogical delivery loop. This chain depends on the completed Phase 3 Enrollment domain (to determine which students can submit) and extends the existing Subject → Course → Class → Enrollment relationship graph into actual instructional content delivery.

**Key finding:** All existing infrastructure (auth, RBAC, validation, repository pattern, test framework, frontend API client, DataTable, forms) is fully reusable. No architectural changes are required.

---

## 2. Current Git / Repository State

| Check | Value |
|-------|-------|
| Branch | `feature/backend-feature-planning` |
| HEAD commit | `1a8f4e1` — `fix(backend): remediate phase 3 security findings` |
| Previous checkpoint | `d75a1fa` — `feat: implement Phase 3B - Enrollment domain` |
| Working tree | CLEAN |
| Test baseline | 470/470 PASS, 0 fail, 0 skipped |
| TypeScript | 0 errors |
| ESLint | 0 errors, 30 pre-existing warnings |
| Build | Compiled successfully |

### Phase 3 remediation verified (commit `1a8f4e1`)

| Remediation | File | Verified |
|-------------|------|----------|
| Partial unique enrollment index | `models/enrollment.model.ts:50` | `{ unique: true, partialFilterExpression: { isActive: true } }` — inactive enrollments no longer block re-enrollment |
| Parent student role query fix | `repositories/user.repository.ts:24` | `role: UserRole.STUDENT` (was lowercase `"student"`) |
| `isActive` RBAC scoping | `services/enrollment.service.ts:161-176` | Only ADMIN can filter by `isActive=false`; STUDENT/PARENT/TEACHER always get `isActive: true` |
| Enrollment duplicate-key handling | `services/enrollment.service.ts:273-275, 316-318` | MongoDB code 11000 intercepted before `handleMongoError`, returns `ENROLLMENT_EXISTS` at 409 |
| Dead code removal | `services/enrollment.service.ts`, `repositories/enrollment.repository.ts` | `verifyParentOwnsStudent` and `findByStudent` removed (confirmed unused) |
| `z.nativeEnum` convention | `validations/enrollment.validation.ts:9` | Changed from `z.enum(Object.values(...))` to `z.nativeEnum(EnrollmentStatus)` |
| `courseId` list filter | `validations/enrollment.validation.ts:36`, `controllers/enrollment.controller.ts:21`, `services/enrollment.service.ts:110, 138-164` | Added to `enrollmentListSchema`, controller param extraction, and service filter logic |

---

## 3. Current Backend Capabilities

### 3.1 Authentication

| Feature | Implementation |
|---------|---------------|
| Register | `POST /api/auth/register` — email/password, bcrypt 12 rounds |
| Login | `POST /api/auth/login` — credential check, JWT issuance, refresh token rotation |
| Refresh | `POST /api/auth/refresh` — refresh token rotation with reuse detection |
| Logout | `POST /api/auth/logout` — clears cookies, revokes refresh token |
| Profile | `GET/PUT /api/auth/profile` — view/update own profile |
| Change password | `POST /api/auth/change-password` — verifies current, hashes new, revokes sessions |
| Forgot password | `POST /api/auth/forgot-password` — JWT reset token via email stub |
| Reset password | `POST /api/auth/reset-password` — JWT reset token verification |
| Google auth | `POST /api/auth/google` — OAuth2 ID token verification |

### 3.2 Phase 1 — Infrastructure (complete)

| Component | File | Details |
|-----------|------|---------|
| AppError | `utils/AppError.ts` | Custom error class with `statusCode`, `errors[]`, `isOperational` |
| apiHandler | `utils/apiHandler.ts` | Route wrapper: `connectDB → rateLimit → handler → catch(500)` |
| apiResponse | `utils/apiResponse.ts` | `sendResponse(data, message, errors)` → `{ success, message, data, errors, timestamp }` |
| handleMongoError | `utils/AppError.ts` | Converts code 11000 → 409 (currently returns `USER_EXISTS` message) |
| rateLimiter | `utils/rateLimiter.ts` | `rate-limiter-flexible`, 100 req/60s/IP |
| logger | `utils/logger.ts` | Winston, JSON format |
| CSRF | `lib/csrf.ts` / `lib/csrf.server.ts` | Double-submit cookie pattern, timing-safe comparison |
| DB connection | `lib/db.ts` | Mongoose cached singleton |
| JWT (server) | `lib/jwt.ts` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` |
| JWT (edge) | `lib/edgeJwt.ts` | `verifyEdgeAccessToken` via `jose` for middleware |
| Password | `lib/password.ts` | bcryptjs, 12 rounds |
| CORS | `middleware.ts` | `FRONTEND_ORIGIN` reflection, `credentials: true` |
| Env config | `config/env.ts` | `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` required |

### 3.3 Phase 2 — Academic Structure (complete)

**Subject** (`src/models/subject.model.ts`)
| Field | Type |
|-------|------|
| `name` | String (required, trim, max 200) |
| `code` | String (required, unique, uppercase, max 20, index) |
| `description` | String (nullable, max 1000, trim) |
| `teacherId` | ObjectId → User (required, index) |
| `isActive` | Boolean (default true, index) |
| `createdAt`, `updatedAt` | Date (timestamps) |
Indexes: `{ code: 1 }` unique, `{ name: 1, teacherId: 1 }` unique, `{ teacherId: 1 }`

**Course** (`src/models/course.model.ts`)
| Field | Type |
|-------|------|
| `name` | String (required, trim, max 200) |
| `code` | String (required, unique, uppercase, max 20, index) |
| `description` | String (nullable, max 1000, trim) |
| `subjectId` | ObjectId → Subject (required, index) |
| `teacherId` | ObjectId → User (required, index) |
| `isActive` | Boolean (default true, index) |
| `createdAt`, `updatedAt` | Date (timestamps) |
Indexes: `{ code: 1 }` unique, `{ subjectId: 1 }`

**Class** (`src/models/class.model.ts`)
| Field | Type |
|-------|------|
| `name` | String (required, trim, max 200) |
| `code` | String (required, unique, uppercase, max 30, index) |
| `description` | String (nullable, max 1000, trim) |
| `courseId` | ObjectId → Course (required, index) |
| `teacherId` | ObjectId → User (required, index) |
| `startDate` | Date (nullable) |
| `endDate` | Date (nullable) |
| `isActive` | Boolean (default true, index) |
| `createdAt`, `updatedAt` | Date (timestamps) |
Indexes: `{ code: 1 }` unique, `{ name: 1, teacherId: 1 }` unique, `{ courseId: 1 }`, `{ teacherId: 1 }`

**Relationship chain (established):**
```
User (role: TEACHER)
  ↓ teacherId
Subject
  ↓ subjectId
Course (also has teacherId → User)
  ↓ courseId
Class (also has teacherId → User)
  ↓ classId
Enrollment.studentId → User (role: STUDENT)
Enrollment.classId → Class
Enrollment.courseId → Course
```

### 3.4 Phase 3 — Enrollment + Student/Parent (complete)

**Enrollment** (`src/models/enrollment.model.ts`)
| Field | Type |
|-------|------|
| `studentId` | ObjectId → User (required, index) |
| `classId` | ObjectId → Class (required, index) |
| `courseId` | ObjectId → Course (required, index) |
| `status` | String (enum: ACTIVE, DROPPED, COMPLETED; default: ACTIVE) |
| `enrolledAt` | Date (default: `new Date()`, server-controlled) |
| `isActive` | Boolean (default: true, index) |
| `createdAt`, `updatedAt` | Date (timestamps) |
Indexes: `{ studentId: 1, classId: 1 }` partial unique (`isActive: true`), `{ studentId: 1, isActive: 1 }`, `{ classId: 1, isActive: 1 }`, `{ courseId: 1, isActive: 1 }`, `{ status: 1 }`, `{ studentId: 1, classId: 1, isActive: 1 }`

**User extensions (Phase 3A)**
| Field | Type |
|-------|------|
| `studentId` | String (unique, sparse, nullable) — student identifier |
| `parentIds` | [ObjectId → User] (default: []) — links to parent users |

**Enrollment API routes:**
| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/enrollments` | Yes | ADMIN/TEACHER/STUDENT/PARENT (role-scoped) |
| POST | `/api/enrollments` | Yes | ADMIN/TEACHER only |
| GET | `/api/enrollments/:id` | Yes | ADMIN/TEACHER/STUDENT/PARENT (ownership) |
| PUT | `/api/enrollments/:id` | Yes | ADMIN/TEACHER only |
| PATCH | `/api/enrollments/:id` | Yes | ADMIN/TEACHER only |
| DELETE | `/api/enrollments/:id` | Yes | ADMIN/TEACHER only (soft-delete) |

**RBAC pattern established in Phase 3:**
- `verifyAuthorized(currentUserId)` — allows all 4 roles (unlike Phase 2's `verifyTeacher` which blocks STUDENT/PARENT)
- ADMIN can filter by `studentId`, `classId`, `courseId`, `status`, `isActive`
- TEACHER scoped to own classes (via `findClassIdsByTeacher`)
- STUDENT scoped to own enrollments (`filter.studentId = requestorId`)
- PARENT scoped to children's enrollments (via `findStudentsByParentId`)
- STUDENT/PARENT/TEACHER can never see `isActive=false` records (IGNORED, not rejected)
- IDOR protection: returns 404 (not 403) for cross-tenant access

---

## 4. User / Role Relationship Graph (Actual)

```
User
  │ (role: ADMIN)
  ├── Full access to all domains
  │
  │ (role: TEACHER)
  ├── owns → Subject (teacherId)
  ├── owns → Course (teacherId, scoped by subjectId → Subject)
  ├── owns → Class (teacherId, scoped by courseId → Course)
  └── manages → Enrollment (scoped to classes where Class.teacherId === self)
  │
  │ (role: STUDENT)
  ├── linked via → Enrollment.studentId
  ├── parentIds → [User (role: PARENT)]
  └── enrolled in classes via Enrollment
  │
  │ (role: PARENT)
  └── parentIds links → [User (role: STUDENT)]
      → can view children's enrollments
```

### Key relationships

| Source | Field | Target | Purpose |
|--------|-------|--------|---------|
| User.studentId | String | (unique student code) | Student identification |
| User.parentIds | [ObjectId] | User (PARENT) | Parent-child linking |
| Subject.teacherId | ObjectId | User (TEACHER) | Ownership |
| Course.subjectId | ObjectId | Subject | Curriculum hierarchy |
| Course.teacherId | ObjectId | User (TEACHER) | Ownership |
| Class.courseId | ObjectId | Course | Curriculum hierarchy |
| Class.teacherId | ObjectId | User (TEACHER) | Ownership |
| Enrollment.studentId | ObjectId | User (STUDENT) | Student-class link |
| Enrollment.classId | ObjectId | Class | Class reference |
| Enrollment.courseId | ObjectId | Course | Derived from class, cached for query |

---

## 5. Current API Inventory

### Auth APIs (10 endpoints)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| POST | `/api/auth/register` | No | Public |
| POST | `/api/auth/login` | No | Public |
| POST | `/api/auth/refresh` | No (cookie) | Public |
| POST | `/api/auth/logout` | Yes | Any authenticated |
| GET | `/api/auth/profile` | Yes | Any authenticated |
| PUT | `/api/auth/profile` | Yes | Any authenticated |
| POST | `/api/auth/change-password` | Yes | Any authenticated |
| POST | `/api/auth/forgot-password` | No | Public |
| POST | `/api/auth/reset-password` | No | Public |
| POST | `/api/auth/google` | No | Public |

### Admin APIs (5 endpoints)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/admin/users` | Yes | ADMIN only |
| GET | `/api/admin/users/:id` | Yes | ADMIN only |
| PUT | `/api/admin/users/:id` | Yes | ADMIN only |
| PATCH | `/api/admin/users/:id` | Yes | ADMIN only |
| DELETE | `/api/admin/users/:id` | Yes | ADMIN only |

### Phase 2 APIs (30 endpoints)

| Domain | Method | Endpoint | Auth | RBAC |
|--------|--------|----------|------|------|
| Subject | GET | `/api/subjects` | Yes | TEACHER/ADMIN |
| Subject | POST | `/api/subjects` | Yes | TEACHER/ADMIN |
| Subject | GET | `/api/subjects/:id` | Yes | TEACHER/ADMIN (own) |
| Subject | PUT | `/api/subjects/:id` | Yes | TEACHER/ADMIN (own) |
| Subject | PATCH | `/api/subjects/:id` | Yes | TEACHER/ADMIN (own) |
| Subject | DELETE | `/api/subjects/:id` | Yes | TEACHER/ADMIN (own) |
| Course | GET | `/api/courses` | Yes | TEACHER/ADMIN |
| Course | POST | `/api/courses` | Yes | TEACHER/ADMIN |
| Course | GET | `/api/courses/:id` | Yes | TEACHER/ADMIN (own) |
| Course | PUT | `/api/courses/:id` | Yes | TEACHER/ADMIN (own) |
| Course | PATCH | `/api/courses/:id` | Yes | TEACHER/ADMIN (own) |
| Course | DELETE | `/api/courses/:id` | Yes | TEACHER/ADMIN (own) |
| Class | GET | `/api/classes` | Yes | TEACHER/ADMIN |
| Class | POST | `/api/classes` | Yes | TEACHER/ADMIN |
| Class | GET | `/api/classes/:id` | Yes | TEACHER/ADMIN (own) |
| Class | PUT | `/api/classes/:id` | Yes | TEACHER/ADMIN (own) |
| Class | PATCH | `/api/classes/:id` | Yes | TEACHER/ADMIN (own) |
| Class | DELETE | `/api/classes/:id` | Yes | TEACHER/ADMIN (own) |

### Phase 3 APIs (6 endpoints)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/enrollments` | Yes | ADMIN/TEACHER/STUDENT/PARENT (role-scoped) |
| POST | `/api/enrollments` | Yes | ADMIN/TEACHER |
| GET | `/api/enrollments/:id` | Yes | ADMIN/TEACHER/STUDENT/PARENT (ownership) |
| PUT | `/api/enrollments/:id` | Yes | ADMIN/TEACHER |
| PATCH | `/api/enrollments/:id` | Yes | ADMIN/TEACHER |
| DELETE | `/api/enrollments/:id` | Yes | ADMIN/TEACHER (soft-delete) |

### Middleware-protected routes (current)

From `src/middleware.ts:10`:
```typescript
const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout", "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments"];
const adminRoutes = ["/api/admin"];
```

| Route group | Auth | Role | CSRF (state-changing) |
|-------------|------|------|----------------------|
| `/api/subjects`, `/api/courses`, `/api/classes` (+ `:id`) | Yes | TEACHER/ADMIN (service) | Yes |
| `/api/enrollments` (+ `:id`) | Yes | Role-scoped (service) | Yes |
| `/api/admin/*` | Yes | ADMIN (middleware) | Yes |
| All other `/api/*` | No | — | No |

---

## 6. RBAC / Security Model (Actual)

### 6.1 Identity propagation

Middleware (`src/middleware.ts:76-102`) verifies the access token JWT via `jose`, then sets:
```typescript
requestHeaders.set("x-user-id", decoded.userId);
requestHeaders.set("x-user-role", decoded.role);
```
Controllers read `x-user-id` from headers — client-supplied headers are overwritten (not trusted).

### 6.2 Two RBAC enforcement layers

| Layer | Mechanism | Enforced By |
|-------|-----------|-------------|
| Middleware | `decoded.role !== UserRole.ADMIN` → 403 (for `/api/admin/*`) | Cookie/JWT verification |
| Service | `verifyAuthorized()` or `verifyTeacher()` checks role in database | Service method |

### 6.3 RBAC patterns established

| Pattern | Used By |
|---------|---------|
| `verifyTeacher(currentUserId)` — blocks STUDENT/PARENT at 403 | Phase 2 (Subject, Course, Class) |
| `verifyAuthorized(currentUserId)` — allows all roles, returns role | Phase 3 (Enrollment) |
| `verifyAdmin(currentUserId)` — admin-only check | Phase 1 (Admin) |

### 6.4 Ownership patterns

| Domain | Ownership check | IDOR returns |
|--------|----------------|-------------|
| Subject/Course/Class | `entity.teacherId === requestorId` | 404 NOT_FOUND |
| Enrollment | `isStudentOrParentAuthorized()` | 404 NOT_FOUND |
| User (admin) | ADMIN only via middleware | 403 FORBIDDEN |

### 6.5 Security properties

- IDOR: Returns 404 (not 403) to prevent resource enumeration
- Mass assignment: All Zod schemas use `.strict()` — unknown fields rejected
- CSRF: Double-submit cookie pattern via `x-csrf-token` header
- Rate limiting: 100 req/60s per IP via `apiHandler`
- Server-controlled fields: `enrolledAt`, `courseId` (derived from class), `status` defaults — never accepted from request body
- Strict validation: ObjectIds validated with 24-char hex regex

---

## 7. Database Conventions (Actual)

| Convention | Implementation |
|-----------|----------------|
| Model init | `models.X \|\| model<IX>("X", xSchema)` — prevents re-compilation in hot reload |
| Schema options | `{ timestamps: true, versionKey: false }` |
| Ids | `Schema.Types.ObjectId` with `ref: "ModelName"`, `index: true` |
| Soft-delete | `isActive: Boolean` (default: true, index: true) |
| Unique indexes | Declared via `schema.index({ field: 1 }, { unique: true })` or `unique: true` on field |
| Partial unique | `{ unique: true, partialFilterExpression: { isActive: true } }` (Enrollment) |
| Collection naming | Mongoose default: plural lowercase (e.g., `enrollments`) |
| Enum storage | String value: `enum: Object.values(EnrollmentStatus)` |

### Index patterns

| Type | Example | Used |
|------|---------|------|
| Field index | `{ isActive: true }` on field | Subject, Course, Class, Enrollment |
| Compound unique | `{ name: 1, teacherId: 1 }, { unique: true }` | Subject |
| Compound non-unique | `{ studentId: 1, isActive: 1 }` | Enrollment |
| Partial unique | `{ studentId: 1, classId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }` | Enrollment |
| Sparse | `sparse: true` on `studentId` | User |

---

## 8. Validation Conventions (Actual)

### Reusable schemas (`src/validations/objectId.ts`)

```typescript
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const searchSchema = z.string().trim().min(1).max(100).optional();
```

### Domain validation pattern

Each domain has:
- `idParamSchema` — `{ id: objectIdSchema }`
- `createSchema` — required fields + optional admin-only fields + `.strict()`
- `updateSchema` (PUT) — all required fields + `.strict()`
- `patchSchema` (PATCH) — all fields optional + `.strict()`
- `listSchema` — extends `paginationSchema` with domain-specific filters
- Exported types via `z.infer<typeof schema>`

### Enum validation

- Phase 2: `z.nativeEnum(UserRole)` (admin.validation.ts)
- Phase 3: `z.nativeEnum(EnrollmentStatus)` (enrollment.validation.ts, after remediation)

### Boolean query param

```typescript
isActive: z.preprocess(
  (val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === undefined || val === null) return undefined;
    return val;
  },
  z.boolean().optional()
).optional()
```

---

## 9. Test Infrastructure (Actual)

| Item | Value |
|------|-------|
| Test runner | `node:test` via `npx tsx --test` (`npm test`) |
| Assertion library | Node.js built-in `node:assert` |
| Test organization | Co-located `__tests__` directories alongside source |
| Test mocking | Manual monkey-patching of repository singletons |
| Env vars required | `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| Current test count | 470 (470 pass, 0 fail, 0 skipped, 98 suites) |

### Test suite breakdown (470 total)

| Suite | Location | Tests |
|-------|----------|-------|
| Subject service | `services/__tests__/subject.service.test.ts` | ~34 |
| Subject validation | `validations/__tests__/subject.validation.test.ts` | ~20 |
| Course service | `services/__tests__/course.service.test.ts` | ~34 |
| Course validation | `validations/__tests__/course.validation.test.ts` | ~20 |
| Class service | `services/__tests__/class.service.test.ts` | ~34 |
| Class validation | `validations/__tests__/class.validation.test.ts` | ~20 |
| Enrollment service | `services/__tests__/enrollment.service.test.ts` | ~50 |
| Enrollment validation | `validations/__tests__/enrollment.validation.test.ts` | ~34 |
| Phase 2E middleware security | `__tests__/phase2e.middleware.security.test.ts` | ~19 |
| Phase 2E service security | `__tests__/phase2e.service.security.test.ts` | ~34 |
| Phase 3 middleware security | `__tests__/phase3.middleware.security.test.ts` | ~17 |
| Admin service | `services/__tests__/admin.service.test.ts` | ~31 |
| Admin validation | `validations/__tests__/admin.validation.test.ts` | ~29 |
| User sanitization | `lib/__tests__/userSanitization.test.ts` | ~13 |
| HandleMongoError | `utils/__tests__/handleMongoError.test.ts` | ~6 |
| CORS | `lib/__tests__/cors.test.ts` | ~6 |
| CSRF | `lib/__tests__/csrf.test.ts` | ~6 |
| Auth validation | `validations/__tests__/auth.validation.test.ts` | ~15 |
| Course validation (additional) | `validations/__tests__/course.validation.test.ts` | ~20 |

### Test patterns

1. **Service tests**: Mock repository singletons, call service methods, assert on results and error throwing
2. **Validation tests**: Use `schema.safeParse()`, assert `result.success` and `result.error`
3. **Middleware security tests**: Simulate HTTP requests with mocked JWT tokens and headers
4. **Service security tests**: Test RBAC, IDOR, cross-tenant access with mocked repository
5. **No mongodb-memory-server**: All tests use mocks — DB connection not required

---

## 10. Frontend Readiness

### 10.1 Existing architecture

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router + React 19 |
| UI | Ant Design v6 + CSS Modules |
| State | Redux Toolkit (`authSlice`, `uiSlice`) + AuthContext |
| API | Axios (`apiClient` with `withCredentials: true`) + 401→refresh→retry interceptor |
| Forms | React Hook Form + Zod |
| Reusable components | DataTable, ConfirmDialog, LoadingState, ErrorState, EmptyState |
| Routing | App Router with `(auth)` and `(dashboard)` groups; auth guard in `(dashboard)/layout.tsx` |

### 10.2 Frontend API client

- `src/services/api/index.ts` — re-exports `./auth` only
- `src/services/api/auth/index.ts` — all auth API functions
- `src/config/api/constants.ts` — `API_ROUTES` with auth routes only
- Axios interceptors automatically handle 401→refresh→retry — **no changes needed** for new endpoints
- `withCredentials: true` — cookies sent automatically for all domains

### 10.3 Navigation config

- `src/config/navigation/navigation.ts` — only Dashboard + Profile nav items
- `src/config/navigation/roleAccess.ts` — `filterNavItems()` by role
- Role filtering infrastructure exists but has nothing to filter yet

### 10.4 Blocked frontend routes

| Route | Frontend exists? | Backend API exists? | Blocked? |
|-------|-----------------|---------------------|----------|
| `/dashboard/classes` | NO | YES | Frontend blocked |
| `/dashboard/courses` | NO | YES | Frontend blocked |
| `/dashboard/subjects` | NO | YES | Frontend blocked |
| `/dashboard/enrollments` | NO | YES | Frontend blocked |
| `/dashboard/assignments` | NO | NO | Backend + frontend blocked |

### 10.5 Reusable infrastructure

All infrastructure exists for new domains:
- `useMutation` hook (generic)
- `DataTable` component (reusable)
- `ConfirmDialog` component (reusable)
- Form patterns (RHF + Zod)
- Axios interceptors (automatic 401 retry)
- Role-based navigation filtering

---

## 11. Missing LMS Domain Audit

| Domain | Status | Evidence |
|--------|--------|----------|
| User (extended) | EXISTS | `user.model.ts` with `studentId`, `parentIds` |
| Subject | EXISTS | Phase 2 — `subject.model.ts` |
| Course | EXISTS | Phase 2 — `course.model.ts` |
| Class | EXISTS | Phase 2 — `class.model.ts` |
| Enrollment | EXISTS | Phase 3 — `enrollment.model.ts` |
| Admin/User Management | EXISTS | Phase 1 — `admin.service.ts`, `/api/admin/users` |
| Assignment | MISSING | No model, route, or validation |
| Submission | MISSING | No model, route, or validation |
| Exam | MISSING | No model, route, or validation |
| Question | MISSING | No model, route, or validation |
| Lesson | MISSING | No model, route, or validation |
| Chapter | MISSING | No model, route, or validation |
| Module | MISSING | No model, route, or validation |
| Attendance | MISSING | No model, route, or validation |
| Grade | MISSING | No model, route, or validation |
| Result | MISSING | No model, route, or validation |
| Schedule | MISSING | No model, route, or validation |
| Timetable | MISSING | No model, route, or validation |
| Announcement | MISSING | No model, route, or validation |
| Notification (LMS) | MISSING | Frontend `useNotification` is UI toast only |
| Course Material | MISSING | No file upload model or document model |
| Analytics/Dashboard | PARTIAL | Frontend dashboard stub; no `/api/analytics` backend |
| Report | MISSING | No reporting endpoints |
| Settings | MISSING | No settings endpoints |
| File upload | MISSING | No file upload infrastructure (busboy, multer, etc.) |

---

## 12. Phase 4 Candidate Domains

| # | Domain | Current State | Dependencies | Required Relationships | RBAC | Ownership | Complexity | Priority |
|---|--------|--------------|--------------|----------------------|------|-----------|------------|----------|
| 1 | **Assignment** | MISSING | Class, Enrollment | Assignment → Class, Course, User(teacher) | Teacher create; Student view/submit; Parent view | `createdBy` (teacher) | Medium-High | **HIGH** |
| 2 | **Submission** | MISSING | Assignment, Enrollment | Submission → Assignment, User(student) | Student submit/view own; Teacher view class; Admin all | `studentId` owns | Medium | **HIGH** |
| 3 | **Grade** | MISSING | Assignment, Submission, Enrollment | Grade → Student, Assignment/Exam, User(teacher) | Teacher grade; Student/view own; Parent view | `gradedBy` (teacher) | Medium | **HIGH** |
| 4 | **Exam** | MISSING | Class, Enrollment | Exam → Class, Course, User(teacher) | Teacher create; Student/Parent view | `createdBy` (teacher) | Medium-High | **MEDIUM** |
| 5 | **Attendance** | MISSING | Class, Enrollment | Attendance → Class, Course, Student records | Teacher mark/view; Student/Parent view own | `recordedBy` (teacher) | Medium | **MEDIUM-HIGH** |
| 6 | **Timetable** | MISSING | Class, Course | Timetable → Class, Course, User(teacher) | Teacher create; Student/Parent view | `createdBy` (teacher) | Medium | MEDIUM |
| 7 | **Announcement** | MISSING | User (targeting) | Announcement → User(teacher/author) | Admin/Teacher create; all view | `createdBy` | Medium | LOW-MEDIUM |
| 8 | **Notification (LMS)** | MISSING | All domains (event-triggered) | Notification → User(recipient) | System-created; recipient views own | `userId` (recipient) | Medium | LOW |
| 9 | **Lesson/Chapter** | MISSING | Course | Lesson → Course, Chapter | Teacher create; Student/Parent view | `createdBy` | Medium | MEDIUM |
| 10 | **Course Material** | MISSING | Course | Material → Course, User(teacher) | Teacher upload; Student/Parent view | `uploadedBy` | High (needs upload infra) | LOW |
| 11 | **Analytics** | PARTIAL | All data domains | Read-only aggregation | Admin/Teacher (own data) | Role-scoped | Medium-High | LOW |
| 12 | **Settings** | MISSING | User | Setting → User | Admin (system); User (own) | `updatedBy` | Low | LOW |

### Recommended Phase 4 candidates

**Primary recommendation: Assignment + Submission pipeline**

Rationale:
1. **Dependencies satisfied**: Class (Phase 2) and Enrollment (Phase 3) both exist. Assignment needs Class/Course for targeting; Submission needs Assignment and Enrollment to know which students can submit.
2. **Pedagogical core**: Assignments + Submissions form the core learning delivery loop — students receive work, submit it, teachers review and grade.
3. **RBAC pattern reuse**: The Phase 3 `verifyAuthorized` pattern (allowing STUDENT/PARENT for reads, TEACHER/ADMIN for writes) can be directly reused for Assignment (teacher creates, student views) and Submission (student creates own, teacher views class).
4. **Repository pattern reuse**: Both follow the exact same `create/findById/update/softDelete/exists/totalCount/findAllPaginated` pattern established by Subject/Course/Class/Enrollment.
5. **Validation reuse**: Same Zod patterns (`objectIdSchema`, `paginationSchema`, `searchSchema`, `.strict()`, `z.nativeEnum` for status enums, `z.string().datetime()` for dates).
6. **Frontend readiness**: Axios interceptors, DataTable, forms, and role-based navigation all exist. New API services follow the exact pattern of `services/api/auth/index.ts`.

**Secondary recommendation: Grade**

Rationale:
1. Depends on Assignment and Submission (both in Phase 4A/4B).
2. Reuses the Enrollment relationship for scoping (teacher grades, student views own).
3. Can be implemented in Phase 4C after Assignment + Submission are complete.
4. The `Grade` model can reference either `assignmentId` or `examId` (nullable), making it flexible for future Exam domain.

**Deferred candidates (out of Phase 4 scope):**
- **Exam**: Can be planned but should come after Assignment/Submission/Grade are established, since Exam is a parallel pedagogical domain.
- **Attendance**: Medium priority, depends on Enrollment (which exists), but less pedagogically critical than Assignment/Submission/Grade.
- **Timetable**: Independent of Enrollment but benefits from knowing enrolled students.
- **Announcement/Notification**: Cross-cutting, system-triggered domains — better deferred.
- **Lesson/Chapter/Module**: Content organization within a Course — valid but secondary to the pedagogical loop.
- **Course Material**: Requires file upload infrastructure (busboy/multer) which doesn't exist — high complexity, deferred.
- **Analytics/Reporting**: Requires all data domains as aggregation sources — deferred.
- **Settings**: Low priority utility domain.

---

## 13. Recommended Phase 4 Scope

### Phase 4A — Assignment Domain

**Goal:** Implement the Assignment model, repository, service, controller, validation, and API routes.

**Dependency chain:** Already satisfied by Phase 2 + Phase 3.

**Model: Assignment**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | — | auto | Primary key |
| `title` | String (trim, max 200) | Yes | — | Assignment title |
| `description` | String (max 5000) | No | null | Rich text or markdown |
| `classId` | ObjectId → Class | Yes | — | Target class (defines who can submit) |
| `courseId` | ObjectId → Course | Yes | — | Derived from class (same pattern as Enrollment.courseId) |
| `dueDate` | Date | Yes | — | Submission deadline |
| `maxPoints` | Number | Yes | — | Maximum possible score (for grading) |
| `status` | String (enum: DRAFT, PUBLISHED, ARCHIVED) | Yes | DRAFT | `z.nativeEnum` |
| `allowLateSubmissions` | Boolean | No | false | Whether late submissions accepted |
| `latePenaltyPercent` | Number | No | 0 | Penalty percentage per day |
| `submissionType` | String (enum: FILE, TEXT, LINK, NONE) | No | TEXT | How students submit |
| `attachments` | [String] | No | [] | File URLs (future upload infrastructure) |
| `createdBy` | ObjectId → User (TEACHER) | Yes | — | Creator (always from JWT, never from body for TEACHER) |
| `publishedAt` | Date | No | null | When published (null = draft) |
| `isActive` | Boolean | No | true | Soft-delete flag |
| `createdAt`, `updatedAt` | Date | — | auto | Timestamps |

**Indexes:**
- `{ classId: 1, dueDate: -1 }` — list assignments by class
- `{ createdBy: 1 }` — teacher's assignments
- `{ courseId: 1 }` — by course
- `{ status: 1 }` — filter by draft/published
- `{ dueDate: 1 }` — deadline queries
- `{ classId: 1, courseId: 1 }` — compound for scoping

### Phase 4B — Submission Domain

**Goal:** Implement the Submission model, repository, service, controller, validation, and API routes. Submission depends on Assignment (Phase 4A) and Enrollment (Phase 3).

**Model: Submission**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | — | auto | Primary key |
| `assignmentId` | ObjectId → Assignment | Yes | — | Parent assignment |
| `studentId` | ObjectId → User (STUDENT) | Yes | — | Submitting student (from JWT) |
| `classId` | ObjectId → Class | Yes | — | Derived from Assignment.classId (for scoping) |
| `content` | String (max 50000) | No | null | Text submission content |
| `attachments` | [String] | No | [] | File URLs |
| `submittedAt` | Date | Yes | `new Date()` | Server-controlled timestamp |
| `status` | String (enum: DRAFT, SUBMITTED, LATE, MISSING) | Yes | DRAFT | `z.nativeEnum` |
| `isLate` | Boolean | No | false | Calculated: `submittedAt > dueDate` |
| `gradedAt` | Date | No | null | When graded (if graded) |
| `isActive` | Boolean | No | true | Soft-delete flag |
| `createdAt`, `updatedAt` | Date | — | auto | Timestamps |

**Indexes:**
- `{ assignmentId: 1, studentId: 1 }` — compound unique (one submission per assignment per student)
- `{ studentId: 1, submittedAt: -1 }` — student's submissions
- `{ assignmentId: 1, status: 1 }` — teacher's submissions by assignment
- `{ classId: 1 }` — by class (for teacher scoping)
- `{ isLate: 1 }` — late submission filtering
- `{ status: 1 }` — status queries

**RBAC:**
| Role | Create | Read (list) | Read (by ID) | Update | Delete |
|------|--------|-------------|--------------|--------|--------|
| ADMIN | No | ✅ all | ✅ all | ✅ | ✅ (soft-delete) |
| TEACHER | No (students submit) | ✅ class submissions | ✅ class submissions | ✅ (add notes) | ✅ (soft-delete) |
| STUDENT | ✅ own only | ✅ own only | ✅ own only | ✅ own (while DRAFT) | No |
| PARENT | No | ✅ children's | ✅ children's | No | No |

### Phase 4C — Grade Domain

**Goal:** Implement the Grade model and API. Depends on Assignment (4A), Submission (4B), and Enrollment (Phase 3).

**Model: Grade**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | — | auto | Primary key |
| `studentId` | ObjectId → User (STUDENT) | Yes | — | Graded student |
| `assignmentId` | ObjectId → Assignment | No | null | Source assignment |
| `submissionId` | ObjectId → Submission | No | null | Source submission |
| `points` | Number | Yes | — | Awarded score |
| `maxPoints` | Number | Yes | — | Maximum possible (from assignment) |
| `percentage` | Number | No | — | Calculated: `points / maxPoints * 100` |
| `feedback` | String (max 2000) | No | null | Teacher feedback |
| `gradedBy` | ObjectId → User (TEACHER) | Yes | — | Who graded (from JWT) |
| `gradedAt` | Date | Yes | `new Date()` | Server-controlled |
| `isActive` | Boolean | No | true | Soft-delete flag |
| `createdAt`, `updatedAt` | Date | — | auto | Timestamps |

**Indexes:**
- `{ studentId: 1, assignmentId: 1 }` — compound unique (one grade per student per assignment)
- `{ studentId: 1, gradedAt: -1 }` — student's grades
- `{ assignmentId: 1 }` — all grades for an assignment
- `{ gradedBy: 1 }` — teacher's grades
- `{ classId: 1 }` — compound for scoping (derived from assignment)

**RBAC:**
| Role | Create/Update | Read (list) | Read (by ID) | Delete |
|------|---------------|-------------|--------------|--------|
| ADMIN | ✅ | ✅ all | ✅ all | ✅ (soft-delete) |
| TEACHER | ✅ grade | ✅ own classes | ✅ own classes | ✅ (soft-delete) |
| STUDENT | No | ✅ own | ✅ own | No |
| PARENT | No | ✅ children's | ✅ children's | No |

### Phase 4D — Security / Integration / Testing

**Security tasks:**
1. Add `/api/assignments`, `/api/submissions`, `/api/grades` to `protectedRoutes` in `middleware.ts`
2. Implement `verifyAuthorized` pattern (reuse from Enrollment) for read access by STUDENT/PARENT
3. Implement `verifyTeacher` pattern (reuse from Phase 2) for write access
4. Enforce `courseId` derivation from `classId` (look up Class, get its `courseId`)
5. Enforce `studentId` server-controlled for Submission (from JWT, not body)
6. Enforce `submittedAt` server-controlled (set to `new Date()` in service)
7. Enforce `gradedBy` server-controlled (from JWT)
8. Enforce `gradedAt` server-controlled (set to `new Date()` in service)
9. Handle duplicate-key race conditions for Submission (one submission per student per assignment) and Grade (one grade per student per assignment) with domain-specific error messages
10. Use partial unique indexes where applicable (`{ assignmentId: 1, studentId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }`)

**Testing:**
- Service tests: ~40 tests per domain (RBAC, IDOR, ownership, duplicate, soft-delete, courseId derivation)
- Validation tests: ~30 tests per domain (ObjectId, strict mode, mass assignment, enums, pagination)
- Middleware security tests: ~15 tests per domain (route protection, CSRF, role access, header spoof)
- **Projected total after Phase 4:** ~670+ tests

---

## 14. Dependency Graph

```
User (role: ADMIN/TEACHER/STUDENT/PARENT)
  │
  ├── Subject
  │     │ (teacherId → User)
  │     └──→ Course
  │           │ (subjectId → Subject, teacherId → User)
  │           └──→ Class
  │                 │ (courseId → Course, teacherId → User)
  │                 │
  │                 └──→ Enrollment
  │                       │ (studentId → User, classId → Class, courseId → Course)
  │                       │
  │                       └──→ Assignment  ← Phase 4A
  │                             │ (classId → Class, courseId → Course, createdBy → User)
  │                             │
  │                             └──→ Submission  ← Phase 4B
  │                                   │ (assignmentId → Assignment, studentId → User)
  │                                   │
  │                                   └──→ Grade  ← Phase 4C
  │                                         │ (assignmentId → Assignment, submissionId → Submission, studentId → User, gradedBy → User)
  │
  │
  └ PARENT
    ↓
  STUDENT
    ↓
  ENROLLMENT
    ↓
  ASSIGNMENT
    ↓
  SUBMISSION
    ↓
  GRADE
```

### Role relationship map

| Role | Owns | Manages | Views (scoped) |
|------|------|---------|----------------|
| ADMIN | Global | All domains | All |
| TEACHER | Subjects, Courses, Classes (own) | Enrollments (own classes), Assignments (own), Submissions (own class), Grades (own class) | Own resources + student data in own classes |
| STUDENT | — | — | Own enrollments, own assignments, own submissions, own grades |
| PARENT | — | — | Children's enrollments, children's assignments, children's submissions, children's grades |

---

## 15. API Plans

### Phase 4A — Assignment APIs (`src/app/api/assignments/`)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/assignments` | Yes | ADMIN (all), TEACHER (own classes), STUDENT (enrolled classes), PARENT (children's classes) |
| POST | `/api/assignments` | Yes | ADMIN, TEACHER |
| GET | `/api/assignments/:id` | Yes | ADMIN, TEACHER (own), STUDENT (enrolled), PARENT (children enrolled) |
| PUT | `/api/assignments/:id` | Yes | ADMIN, TEACHER (own) |
| PATCH | `/api/assignments/:id` | Yes | ADMIN, TEACHER (own) |
| DELETE | `/api/assignments/:id` | Yes | ADMIN, TEACHER (own) — soft-delete |

**List query params:**
| Param | Type | Purpose | Role scoping |
|-------|------|---------|-------------|
| `page` | number (default 1) | Pagination | All |
| `limit` | number (default 20, max 100) | Page size | All |
| `classId` | ObjectId | Filter by class | TEACHER: must own class; STUDENT: must be enrolled; PARENT: must have child enrolled |
| `courseId` | ObjectId | Filter by course | TEACHER: must teach course; STUDENT: must be enrolled in course |
| `status` | Enum (DRAFT, PUBLISHED, ARCHIVED) | Filter by status | STUDENT/PARENT: only PUBLISHED visible |
| `search` | string | Search title/description | All (scoped) |
| `isActive` | boolean | Filter active/inactive | ADMIN only (default: true for others) |

**POST/PUT body (strict):**
| Field | Type | Required | Role |
|-------|------|----------|------|
| `title` | string (trim, max 200) | Yes | TEACHER, ADMIN |
| `description` | string (max 5000) | No | TEACHER, ADMIN |
| `classId` | ObjectId | Yes | TEACHER, ADMIN |
| `dueDate` | datetime string | Yes | TEACHER, ADMIN |
| `maxPoints` | number | Yes | TEACHER, ADMIN |
| `status` | Enum | No (default DRAFT) | TEACHER, ADMIN |
| `allowLateSubmissions` | boolean | No (default false) | TEACHER, ADMIN |
| `latePenaltyPercent` | number | No (default 0) | TEACHER, ADMIN |
| `submissionType` | Enum (FILE, TEXT, LINK, NONE) | No (default TEXT) | TEACHER, ADMIN |
| `attachments` | [string] | No | TEACHER, ADMIN |

**Server-controlled (never in body):**
- `courseId` — derived from `Class.courseId` lookup
- `createdBy` — from JWT `x-user-id`
- `publishedAt` — set when `status` changes to PUBLISHED
- `enrolledAt` / `createdAt` / `updatedAt` — Mongoose timestamps

### Phase 4B — Submission APIs (`src/app/api/submissions/`)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/submissions` | Yes | ADMIN (all), TEACHER (own class), STUDENT (own), PARENT (children's) |
| POST | `/api/submissions` | Yes | ADMIN, STUDENT (own) |
| GET | `/api/submissions/:id` | Yes | ADMIN, TEACHER (own class), STUDENT (own), PARENT (children's) |
| PATCH | `/api/submissions/:id` | Yes | ADMIN, STUDENT (own, if DRAFT), TEACHER (can add notes) |
| DELETE | `/api/submissions/:id` | Yes | ADMIN, STUDENT (own, if DRAFT) — soft-delete |

**List query params:**
| Param | Type | Purpose | Role scoping |
|-------|------|---------|-------------|
| `page`, `limit` | number | Pagination | All |
| `assignmentId` | ObjectId | Filter by assignment | TEACHER: must own; STUDENT: must belong to assignment's class; PARENT: children must be enrolled |
| `studentId` | ObjectId | Filter by student | ADMIN/TEACHER only; STUDENT/PARENT: ignored (hardcoded to own) |
| `classId` | ObjectId | Filter by class | TEACHER: must own; STUDENT: must be enrolled |
| `status` | Enum | Filter by status | All (scoped) |
| `search` | string | Search content | All (scoped) |
| `isActive` | boolean | Filter active/inactive | ADMIN only (default: true for others) |

**POST body (strict):**
| Field | Type | Required | Role |
|-------|------|----------|------|
| `assignmentId` | ObjectId | Yes | STUDENT, ADMIN |
| `content` | string (max 50000) | No (if submissionType is TEXT) | STUDENT |
| `attachments` | [string] | No | STUDENT |

**Server-controlled (never in body):**
- `studentId` — from JWT `x-user-id`
- `classId` — derived from `Assignment.classId`
- `submittedAt` — `new Date()` when status changes to SUBMITTED
- `isLate` — calculated from `submittedAt > assignment.dueDate`
- `status` — default DRAFT, transitions to SUBMITTED on first submission
- `gradedAt` — set by teacher grading (Phase 4C)

### Phase 4C — Grade APIs (`src/app/api/grades/`)

| Method | Endpoint | Auth | RBAC |
|--------|----------|------|------|
| GET | `/api/grades` | Yes | ADMIN, TEACHER (own class), STUDENT (own), PARENT (children's) |
| POST | `/api/grades` | Yes | ADMIN, TEACHER |
| GET | `/api/grades/:id` | Yes | ADMIN, TEACHER (own class), STUDENT (own), PARENT (children's) |
| PUT | `/api/grades/:id` | Yes | ADMIN, TEACHER (own class) |
| PATCH | `/api/grades/:id` | Yes | ADMIN, TEACHER (own class) |
| DELETE | `/api/grades/:id` | Yes | ADMIN, TEACHER (own class) — soft-delete |

**List query params:**
| Param | Type | Purpose | Role scoping |
|-------|------|---------|-------------|
| `page`, `limit` | number | Pagination | All |
| `studentId` | ObjectId | Filter by student | ADMIN/TEACHER only; STUDENT/PARENT: hardcoded to own/children |
| `assignmentId` | ObjectId | Filter by assignment | TEACHER: must own; STUDENT/PARENT: must be enrolled |
| `classId` | ObjectId | Filter by class | TEACHER: must own; STUDENT: must be enrolled |
| `search` | string | Search feedback | All (scoped) |
| `isActive` | boolean | Filter active/inactive | ADMIN only (default: true for others) |

**POST/PUT body (strict):**
| Field | Type | Required | Role |
|-------|------|----------|------|
| `studentId` | ObjectId | Yes | TEACHER, ADMIN |
| `assignmentId` | ObjectId | Yes | TEACHER, ADMIN |
| `points` | number | Yes | TEACHER, ADMIN |
| `maxPoints` | number | Yes | TEACHER, ADMIN |
| `feedback` | string (max 2000) | No | TEACHER, ADMIN |

**Server-controlled (never in body):**
- `gradedBy` — from JWT `x-user-id`
- `gradedAt` — `new Date()`
- `percentage` — calculated: `points / maxPoints * 100`
- `classId` — derived from `Assignment.classId`
- `submissionId` — optional link to Submission (if exists)

---

## 16. RBAC / Security Plans

### 16.1 Role capabilities

| Role | Create Assignment | View Assignment | Update/Delete Assignment | Create Submission | View Submission | Submit Own | View Grade | Create Grade |
|------|-------------------|-----------------|-------------------------|-------------------|-----------------|------------|------------|--------------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TEACHER | ✅ (own classes) | ✅ (own classes') | ✅ (own classes') | No | ✅ (own classes') | No | ✅ (own classes') | ✅ (own classes') |
| STUDENT | No | ✅ (enrolled) | No | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | No |
| PARENT | No | ✅ (children's) | No | No | ✅ (children's) | No | ✅ (children's) | No |

### 16.2 Ownership models

**Assignment:**
- `createdBy` → User (TEACHER) — from JWT, never from body for TEACHER
- `classId` → Class — verified teacher owns class (via `verifyTeacherOwnsClass`)
- `courseId` → Course — derived from Class, not from body

**Submission:**
- `studentId` → User (STUDENT) — from JWT `x-user-id`, never from body
- `assignmentId` → Assignment — verified assignment exists and student is enrolled in its class
- `classId` → Class — derived from Assignment.classId

**Grade:**
- `studentId` → User (STUDENT) — from body (admin/teacher specifies) or derived
- `assignmentId` → Assignment — verified teacher owns assignment's class
- `gradedBy` → User (TEACHER) — from JWT `x-user-id`
- `classId` → Class — derived from Assignment

### 16.3 IDOR protection

Same pattern as Phase 3 Enrollment:
- STUDENT/PARENT get 404 (not 403) for resources they don't own
- TEACHER gets 404 for assignments/submissions/grades outside their classes
- Query parameter `studentId` is ignored for STUDENT/PARENT (hardcoded to own ID)
- Query parameter `classId` for TEACHER is verified against `findClassIdsByTeacher`

### 16.4 Mass-assignment protection

- All schemas use `.strict()`
- `courseId`, `createdBy`, `gradedBy` never in body schemas
- `submittedAt`, `gradedAt`, `enrolledAt` never in body schemas
- `studentId` for Submission — derived from JWT, not accepted in POST body
- `isLate` — calculated in service, not from body
- `percentage` — calculated in service, not from body

### 16.5 Soft-delete and `isActive` RBAC

Same pattern as Phase 3 remediation:
- STUDENT/PARENT/TEACHER always get `isActive: true` (ignores `?isActive=false`)
- Only ADMIN can filter by `isActive=false`

### 16.6 Duplicate-key handling

| Domain | Duplicate scenario | Partial unique index |
|--------|-------------------|---------------------|
| Submission | Student submits same assignment twice | `{ assignmentId: 1, studentId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }` |
| Grade | Student graded twice on same assignment | `{ studentId: 1, assignmentId: 1 }, { unique: true, partialFilterExpression: { isActive: true } }` |
| Assignment | No uniqueness constraint needed (title can repeat across classes) | N/A |

### 16.7 Middleware requirements

Add to `protectedRoutes` in `middleware.ts`:
```typescript
const protectedRoutes = [
  "/api/auth/change-password", "/api/auth/profile", "/api/auth/logout",
  "/api/subjects", "/api/courses", "/api/classes", "/api/enrollments",
  "/api/assignments",          // NEW
  "/api/submissions",          // NEW
  "/api/grades",               // NEW
];
```

---

## 17. Data Model Plans (Summarized)

### Assignment model

| Field | Type | Schema option |
|-------|------|---------------|
| `_id` | ObjectId | auto |
| `title` | String | trim, min 1, max 200 |
| `description` | String | max 5000, nullable |
| `classId` | ObjectId → Class | required, index |
| `courseId` | ObjectId → Course | required, index, derived |
| `dueDate` | Date | required |
| `maxPoints` | Number | required, min 0 |
| `status` | String (enum) | DRAFT/PUBLISHED/ARCHIVED, default DRAFT |
| `allowLateSubmissions` | Boolean | default false |
| `latePenaltyPercent` | Number | default 0, min 0, max 100 |
| `submissionType` | String (enum) | FILE/TEXT/LINK/NONE, default TEXT |
| `attachments` | [String] | default [] |
| `createdBy` | ObjectId → User | required, index |
| `publishedAt` | Date | nullable, index |
| `isActive` | Boolean | default true, index |
| createdAt, updatedAt | Date | timestamps |

### Submission model

| Field | Type | Schema option |
|-------|------|---------------|
| `_id` | ObjectId | auto |
| `assignmentId` | ObjectId → Assignment | required, index |
| `studentId` | ObjectId → User | required, index |
| `classId` | ObjectId → Class | required, index, derived |
| `content` | String | max 50000, nullable |
| `attachments` | [String] | default [] |
| `submittedAt` | Date | default `new Date()`, server-controlled |
| `status` | String (enum) | DRAFT/SUBMITTED/LATE/MISSING, default DRAFT |
| `isLate` | Boolean | default false, calculated |
| `gradedAt` | Date | nullable |
| `isActive` | Boolean | default true, index |
| createdAt, updatedAt | Date | timestamps |

### Grade model

| Field | Type | Schema option |
|-------|------|---------------|
| `_id` | ObjectId | auto |
| `studentId` | ObjectId → User | required, index |
| `assignmentId` | ObjectId → Assignment | required, index |
| `submissionId` | ObjectId → Submission | nullable, index |
| `classId` | ObjectId → Class | required, index, derived |
| `points` | Number | required |
| `maxPoints` | Number | required |
| `percentage` | Number | calculated |
| `feedback` | String | max 2000, nullable |
| `gradedBy` | ObjectId → User | required, index |
| `gradedAt` | Date | default `new Date()`, server-controlled |
| `isActive` | Boolean | default true, index |
| createdAt, updatedAt | Date | timestamps |

---

## 18. Validation Plans

### Assignment validation

| Schema | Fields (strict) |
|--------|----------------|
| `createAssignmentSchema` | `title` (string, trim, max 200), `description` (string, max 5000, optional, nullable), `classId` (ObjectId), `dueDate` (datetime string), `maxPoints` (number, min 0), `status` (nativeEnum, optional, default DRAFT), `allowLateSubmissions` (boolean, optional, default false), `latePenaltyPercent` (number, optional, default 0), `submissionType` (nativeEnum, optional, default TEXT), `attachments` (string array, optional, default []), `courseId` REJECTED (strict), `createdBy` REJECTED (strict) |
| `updateAssignmentSchema` (PUT) | All required fields same as create |
| `patchAssignmentSchema` (PATCH) | All fields optional |
| `assignmentListSchema` | `paginationSchema.extend({ search, classId, courseId, status, isActive })` |
| `assignmentIdParamSchema` | `{ id: objectIdSchema }` |
| `AssignmentStatus` enum | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `SubmissionType` enum | `FILE`, `TEXT`, `LINK`, `NONE` |

### Submission validation

| Schema | Fields (strict) |
|--------|----------------|
| `createSubmissionSchema` | `assignmentId` (ObjectId), `content` (string, max 50000, optional, nullable), `attachments` (string array, optional), `studentId` REJECTED (strict — server-controlled), `classId` REJECTED (strict — derived), `submittedAt` REJECTED (strict — server-controlled), `status` REJECTED (strict — server-controlled), `isLate` REJECTED (strict — calculated) |
| `updateSubmissionSchema` (PUT) | Same as create |
| `patchSubmissionSchema` (PATCH) | `content` (optional), `attachments` (optional), `status` (optional — DRAFT→SUBMITTED transition) |
| `submissionListSchema` | `paginationSchema.extend({ assignmentId, studentId (admin/teacher only), classId, status, search, isActive })` |
| `submissionIdParamSchema` | `{ id: objectIdSchema }` |
| `SubmissionStatus` enum | `DRAFT`, `SUBMITTED`, `LATE`, `MISSING` |

### Grade validation

| Schema | Fields (strict) |
|--------|----------------|
| `createGradeSchema` | `studentId` (ObjectId), `assignmentId` (ObjectId), `points` (number), `maxPoints` (number), `feedback` (string, max 2000, optional, nullable), `submissionId` (ObjectId, optional), `classId` REJECTED (strict — derived), `gradedBy` REJECTED (strict — server-controlled), `gradedAt` REJECTED (strict — server-controlled), `percentage` REJECTED (strict — calculated) |
| `updateGradeSchema` (PUT) | Same as create |
| `patchGradeSchema` (PATCH) | `points` (optional), `maxPoints` (optional), `feedback` (optional) |
| `gradeListSchema` | `paginationSchema.extend({ studentId, assignmentId, classId, search, isActive })` |
| `gradeIdParamSchema` | `{ id: objectIdSchema }` |

---

## 19. Test Strategy

### Current baseline: 470 tests

### Projected Phase 4 tests

| Domain | Service tests | Validation tests | Security/middleware tests | Total |
|--------|---------------|------------------|--------------------------|-------|
| Assignment | ~45 | ~35 | ~15 | ~95 |
| Submission | ~45 | ~35 | ~15 | ~95 |
| Grade | ~40 | ~30 | ~15 | ~85 |
| **Phase 4 subtotal** | ~130 | ~100 | ~45 | ~275 |

### Total projected after Phase 4: ~745 tests

### Test categories per domain

| Category | Tests | Coverage |
|----------|-------|----------|
| CRUD (create/list/get/update/patch/delete) | ~6 per role | Full lifecycle |
| RBAC (role-based access) | ~4 per role | ADMIN/TEACHER/STUDENT/PARENT |
| IDOR (cross-tenant) | ~5 per domain | Student→another student, parent→another parent, teacher→another teacher's class |
| Ownership | ~3 per domain | CreatedBy/teacherId scoping |
| Duplicate prevention | ~2 per domain | Service-level + DB-level |
| Mass assignment | ~3 per domain | Strict schema, server-controlled fields |
| courseId derivation | ~2 per domain | Not accepted from body |
| Server-controlled fields | ~2 per domain | enrolledAt/submittedAt/gradedAt/gradedBy |
| Soft-delete | ~3 per domain | Idempotency, inactive filtering |
| isActive RBAC | ~4 per domain | STUDENT/PARENT/TEACHER ignored, ADMIN allowed |
| Re-enrollment after soft-delete | ~1 per domain | When applicable |
| Query param bypass | ~3 per domain | studentId/classId/courseId ignored for non-admin |
| ObjectId validation | ~3 per domain | Invalid IDs, nonexistent IDs |
| Pagination | ~3 per domain | Defaults, max, page boundaries |
| CSRF | ~1 per domain | Middleware security |
| Forged headers | ~1 per domain | x-user-id/x-user-role overwrite |

### Test runner command

```
$env:MONGODB_URI="mongodb://localhost:27017/test"; $env:JWT_ACCESS_SECRET="test-access-secret"; $env:JWT_REFRESH_SECRET="test-refresh-secret"; npm test
```

---

## 20. Frontend Impact

### After Phase 4A (Assignment):
- `GET /api/assignments` — Teacher can list assignments for own classes; Student can see published assignments for enrolled classes
- `POST /api/assignments` — Teacher can create assignments (requires `classId`, `courseId` derived)
- CRUD endpoints for assignment management
- **Frontend readiness**: All infrastructure exists (DataTable, forms, hooks, axios interceptors)

### After Phase 4B (Submission):
- `POST /api/submissions` — Student can submit to assignments
- `GET /api/submissions` — Student sees own submissions; Teacher sees class submissions
- PATCH to update draft submissions before due date
- **Frontend readiness**: All infrastructure exists

### After Phase 4C (Grade):
- `POST /api/grades` — Teacher can grade submissions
- `GET /api/grades` — Student/Parent can view grades
- **Frontend readiness**: All infrastructure exists

### What frontend work remains deferred:
- `src/services/api/` needs `assignments.ts`, `submissions.ts`, `grades.ts` API service files
- `src/config/api/constants.ts` needs `API_ROUTES.assignments`, `.submissions`, `.grades`
- Frontend pages under `src/app/(dashboard)/assignments/`, `/submissions/`, `/grades/`
- Navigation items for Assignments, Submissions, Grades in `navigation.ts`
- **No infrastructure changes needed** — only additive API service + route pages

### Reusable frontend patterns:
- `useMutation<TData, TError>` hook — generic for all mutations
- `DataTable` component — for paginated lists
- `ConfirmDialog` component — for delete confirmation
- `useNotification` hook — for success/error toast messages
- Axios interceptors — automatic 401→refresh→retry for all new endpoints
- Role-based navigation filtering — `filterNavItems()` already exists

---

## 21. Risks / Blockers

### Actual blockers resolved by Phase 3
| Risk | Status | Resolution |
|------|--------|-----------|
| No student-class linkage | RESOLVED | Enrollment model links students to classes |
| No parent-child relationship | RESOLVED | `parentIds` on User model, `findStudentsByParentId` repository method |
| STUDENT/PARENT cannot access any API | RESOLVED | `verifyAuthorized()` in Enrollment allows all 4 roles; STUDENT/PARENT scoped in service |

### Remaining considerations for Phase 4
| Item | Status | Mitigation |
|------|--------|-----------|
| File upload infrastructure | Not yet available | Phase 4A Assignment model includes `attachments: [String]` (URLs only); actual file upload endpoints are out of Phase 4 scope |
| No notification system | Not yet available | Grade/exam event notifications deferred to later phase; not a blocker for core domain |
| No calendar/scheduling for due dates | Not yet available | `dueDate` DateTime field on Assignment; UI can render it; backend does not push reminders |
| Frontend API service layer | Not yet implemented for LMS domains | Infrastructure exists (axios, hooks); only service files + pages need creating (frontend team task) |
| `permissions` field on User unused | Pre-existing | No action needed; role-based auth is sufficient for all Phase 4 domains |
| `handleMongoError` returns `USER_EXISTS` for all 11000 errors | Phase 3 remediation pattern | Phase 4 should intercept duplicate-key errors at service level (like Enrollment does) before `handleMongoError` processes them |
| No soft-delete cascade | Pre-existing pattern | Enrollment's soft-delete does not cascade to related submissions/grades — Phase 4 should document this behavior (assignments with no active students may be hidden) |

### No critical blockers
All dependencies for Phase 4A (Assignment) are satisfied by the current codebase:
- ✅ Class model exists (Phase 2)
- ✅ Course model exists (Phase 2)
- ✅ Enrollment model exists (Phase 3)
- ✅ `verifyAuthorized` / `verifyTeacher` patterns established
- ✅ Repository pattern established
- ✅ Validation conventions established
- ✅ Middleware pattern established
- ✅ Test infrastructure established
- ✅ Frontend infrastructure established

---

## 22. Out-of-Scope

The following are explicitly NOT part of Phase 4:

| Item | Reason |
|------|--------|
| Microservices | Current architecture is monolithic Next.js API — no service-split needed |
| Event buses / queues | No async processing required for core LMS domains |
| GraphQL | REST API convention is established and consistent |
| WebSockets / real-time | No real-time requirements for assignments/submissions/grades |
| Caching layer | No caching infrastructure exists; not needed for core functionality |
| File upload infrastructure | Out of scope; `attachments` will store URLs only |
| Email/SMS notifications | Email service is a stub; notification system deferred |
| Analytics/Reporting | Deferred; requires all data domains as aggregation sources |
| Settings domain | Deferred; low priority utility domain |
| Timetable/Schedule | Deferred; can be implemented independently but lower priority than core pedagogical loop |
| Announcement system | Deferred; cross-cutting domain |
| LMS Notification system | Deferred; system-triggered notifications require event infrastructure |
| Course Material/Lesson/Chapter/Module | Deferred; content organization secondary to pedagogical actions |
| Multi-device token management | No session device tracking needed; JWT rotation is sufficient |
| Mobile app | Out of scope |
| Internationalization | No i18n infrastructure; out of scope |
| Dark mode backend | UI-only concern; no backend changes needed |

---

## 23. Implementation Sequence

### Phase 4A (Assignment)
1. Create `src/types/assignment.types.ts` — `IAssignment`, `AssignmentStatus`, `SubmissionType` enums
2. Create `src/models/assignment.model.ts` — Mongoose schema following class/course conventions
3. Create `src/repositories/assignment.repository.ts` — CRUD + `findAllPaginated` + `findByClass` + `findByTeacher`
4. Create `src/validations/assignment.validation.ts` — create/update/patch/list schemas (strict, nativeEnum)
5. Create `src/services/assignment.service.ts` — `verifyAuthorized`/`verifyTeacher` pattern, courseId derivation, RBAC
6. Create `src/controllers/assignment.controller.ts` — CRUD controller with `handleError` pattern
7. Create `src/app/api/assignments/route.ts` + `[id]/route.ts` — API routes wrapped in `apiHandler`
8. Add `/api/assignments` to `protectedRoutes` in `middleware.ts`
9. Create test files — service, validation, middleware security tests

### Phase 4B (Submission)
1. Create `src/types/submission.types.ts` — `ISubmission`, `SubmissionStatus` enum
2. Create `src/models/submission.model.ts` — with partial unique index `{ assignmentId, studentId }`
3. Create `src/repositories/submission.repository.ts` — CRUD + enrollment-scoped queries
4. Create `src/validations/submission.validation.ts` — strict schemas, studentId not in body
5. Create `src/services/submission.service.ts` — `studentId` from JWT, `classId` derived from assignment, duplicate-key 409 handling
6. Create `src/controllers/submission.controller.ts` — CRUD controller
7. Create `src/app/api/submissions/route.ts` + `[id]/route.ts` — API routes
8. Add `/api/submissions` to `protectedRoutes`
9. Create test files

### Phase 4C (Grade)
1. Create `src/types/grade.types.ts` — `IGrade`
2. Create `src/models/grade.model.ts` — with partial unique index `{ studentId, assignmentId }`
3. Create `src/repositories/grade.repository.ts`
4. Create `src/validations/grade.validation.ts`
5. Create `src/services/grade.service.ts` — `gradedBy` from JWT, `percentage` calculated, `gradedAt` server-controlled
6. Create `src/controllers/grade.controller.ts`
7. Create `src/app/api/grades/route.ts` + `[id]/route.ts`
8. Add `/api/grades` to `protectedRoutes`
9. Create test files

### Phase 4D (Security / Integration)
1. Verify all middleware-protected routes include new domains
2. Verify CSRF coverage on all new state-changing endpoints
3. Verify RBAC scoping for STUDENT/PARENT/TEACHER on all new list endpoints
4. Verify IDOR protection on all get-by-id endpoints
5. Verify `courseId` derivation from `classId` in Assignment and Submission
6. Verify `studentId` server-control on Submission
7. Verify `gradedBy` server-control on Grade
8. Verify `submittedAt`/`gradedAt`/`publishedAt` server-control
9. Verify duplicate-key race handling returns domain-specific 409
10. Verify `isActive` RBAC: STUDENT/PARENT/TEACHER always active-only, ADMIN can filter

### Phase 4E (Exit validation)
1. Run full test suite: `npm test` — expect 700+ tests passing
2. Run `npx tsc --noEmit` — 0 errors
3. Run `npm run lint` — 0 errors, consistent warnings
4. Run `npm run build` — successful compilation
5. Verify no regressions in Phase 1/2/3 tests

---

## 24. Readiness Assessment

All prerequisites for Phase 4 implementation are satisfied:

- ✅ Actual dependencies understood (User → Subject → Course → Class → Enrollment → Assignment → Submission → Grade)
- ✅ Relationships clearly defined (existing models provide all required foreign keys)
- ✅ RBAC sufficiently planned (reuse `verifyAuthorized` for reads, `verifyTeacher` for writes)
- ✅ IDOR/security model sufficiently planned (404 returns, role-scoped queries, strict validation)
- ✅ API contracts sufficiently defined (standard CRUD + list/filter pattern)
- ✅ Data models sufficiently defined (tables in this document)
- ✅ Validation requirements defined (strict schemas, nativeEnum, server-controlled fields)
- ✅ Implementation sequence clear (4A → 4B → 4C → 4D → 4E)
- ✅ No critical blockers remaining

PHASE 4 READY FOR IMPLEMENTATION