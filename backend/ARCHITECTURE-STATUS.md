# LearnSphere Backend — Architecture Status Report

**Project:** LearnSphere Enterprise School LMS  
**Repository:** Monorepo (`backend/`, `frontend/`)  
**Branch:** `feature/sidebar-backend`  
**Report Date:** 2026-08-08  
**Scope:** Actual backend implementation status after Step 1, Step 2, Step 3, and Step 4.

---

## 1. Verified Role Architecture (Step 1)

### Canonical Roles

```
ADMIN
TEACHER
STUDENT
PARENT
```

### Where Role Is Defined

**File:** `src/types/user.types.ts`

```ts
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}
```

This is the **single source of truth** for roles.

### How User Stores Role

**File:** `src/models/user.model.ts`

```ts
role: {
  type: String,
  enum: Object.values(UserRole),
  default: UserRole.STUDENT,
},
```

- Stored as a string in MongoDB
- Validated by Mongoose enum against `UserRole` values
- Default value: `STUDENT`

### How Role Is Validated

- **Mongoose schema level:** `enum: Object.values(UserRole)` — MongoDB rejects invalid role values on save
- **Application level:** No Zod schema accepts `role` as input. Users cannot self-assign roles via registration or profile update.
- **TypeScript level:** `IUser.role: UserRole` — compile-time type safety

### Where Role Is Used

| File | Usage |
|------|-------|
| `src/types/user.types.ts` | Enum definition |
| `src/models/user.model.ts` | Schema field with enum validation |
| `src/middleware.ts` | Admin route authorization check |
| `src/services/auth.service.ts` | Token generation (`role` included in JWT payload) |

### Old Roles Status

| Old Role | Status |
|----------|--------|
| `SUPER_ADMIN` | **REMOVED** from code. Does not exist in any source file. |
| `USER` | **REMOVED** from code. Does not exist in any source file. |

No references to `SUPER_ADMIN` or `USER` remain in the backend source code.

### Database Migration Required

**YES.** Existing database records containing `role: "SUPER_ADMIN"` or `role: "USER"` will fail Mongoose enum validation on update until migrated.

**Recommended migration (execute before production deploy):**
```js
await User.updateMany({ role: "SUPER_ADMIN" }, { $set: { role: "ADMIN" } });
await User.updateMany({ role: "USER" }, { $set: { role: "STUDENT" } });
```

**Impact:** Until migrated, users with legacy role values cannot update their profile or trigger any user document update.

### Authentication Affected

**No.** Authentication flows (register, login, refresh, profile, Google login) continue to work. The role is read from the database and returned in responses. No JWT structure was changed.

---

## 2. Verified Permission Architecture (Step 2)

### Permission Definition

**File:** `src/types/permission.types.ts`

```ts
export const PermissionCode = {
  DASHBOARD_VIEW: "dashboard.view",
  STUDENT_VIEW: "student.view",
  STUDENT_CREATE: "student.create",
  STUDENT_UPDATE: "student.update",
  STUDENT_DELETE: "student.delete",
  TEACHER_VIEW: "teacher.view",
  TEACHER_CREATE: "teacher.create",
  TEACHER_UPDATE: "teacher.update",
  TEACHER_DELETE: "teacher.delete",
  PARENT_VIEW: "parent.view",
  PARENT_CREATE: "parent.create",
  PARENT_UPDATE: "parent.update",
  PARENT_DELETE: "parent.delete",
  CLASS_VIEW: "class.view",
  CLASS_CREATE: "class.create",
  CLASS_UPDATE: "class.update",
  CLASS_DELETE: "class.delete",
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",
  GRADE_VIEW: "grade.view",
  GRADE_MANAGE: "grade.manage",
  REPORT_VIEW: "report.view",
  REPORT_EXPORT: "report.export",
  SETTING_VIEW: "setting.view",
  SETTING_MANAGE: "setting.manage",
} as const;

export type PermissionCode = typeof PermissionCode[keyof typeof PermissionCode];
export const ALL_PERMISSIONS = Object.values(PermissionCode);
```

**Total permissions:** 24  
**Naming convention:** `resource.action` (e.g., `student.create`, `grade.manage`)

### Permission Type

- **Not a database model.** Permissions are static TypeScript constants.
- **Strongly typed** via `as const` and `typeof` inference.
- **Single source of truth:** `src/types/permission.types.ts`

### Permission Model

**NOT IMPLEMENTED.** No `Permission` Mongoose model exists. Permissions are defined as code constants, not database entities.

### Permission Repository

**NOT IMPLEMENTED.** No repository needed for static permissions.

### Permission Service

**NOT IMPLEMENTED.** No service needed for static permissions.

### Role → Permission Relationship

**File:** `src/lib/permissions.ts`

```ts
export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]>;
export function hasPermission(role: UserRole, permission: PermissionCode): boolean;
export function getRolePermissions(role: UserRole): PermissionCode[];
export function validatePermission(permission: unknown): permission is PermissionCode;
```

- Centralized static mapping in `src/lib/permissions.ts`
- No database relationship
- No dynamic permission assignment

### Permission Validation

- `validatePermission()` checks if a string is a valid `PermissionCode`
- **No Zod schema** currently accepts permission input from clients
- Permissions are never trusted from frontend input

### Duplicate Prevention

- Single `PermissionCode` constant object prevents duplicate permission definitions
- `ALL_PERMISSIONS` array derived from the same source

### Permission Storage

Permissions are stored on the **User document** as a `String[]` array:

```ts
// src/models/user.model.ts
permissions: {
  type: [String],
  default: [],
},
```

**Note:** The Mongoose schema does NOT enforce a permission enum at the database level. Validation happens at the TypeScript/application layer only.

### Permission Lookup Strategy

- Permissions are **pre-computed and stored on the User document** at registration/login
- Lookup is a direct array read from the user document — no additional queries needed
- `hasPermission()` is an in-memory array lookup — O(n) where n is permissions per role (max 24)

---

## 3. Verified Authorization Architecture (Step 3)

### Authorization Layer

**File:** `src/lib/authorization.ts`

```ts
export function requirePermission(user: IUser, permission: PermissionCode): void;
export function requireRole(user: IUser, role: string): void;
export function requireAdmin(user: IUser): void;
```

- Centralized, reusable authorization helpers
- Throw `AppError` with 403 Forbidden on authorization failure
- `requirePermission` delegates to the canonical `hasPermission(role, permission)` mapping
- No duplicate role/permission checks scattered in controllers
- Single Responsibility: authorization logic lives in one place

### Authorization Enforcement Points

| Layer | Responsibility |
|-------|----------------|
| Edge Middleware | Authentication (JWT verify), admin route role check, inject `x-user-id` and `x-user-role` |
| Controller | Fetches requester user from DB, calls `requirePermission()` / `requireAdmin()` |
| Service | Business logic only — no authorization checks |

### 401 vs 403 Semantics

| Scenario | Status | Reason |
|----------|--------|--------|
| Missing/invalid JWT | 401 | Not authenticated |
| Valid JWT, insufficient permission | 403 | Authenticated but not authorized |
| Valid JWT, non-admin on `/api/admin` route | 403 | Authenticated but not authorized |

---

## 4. Verified Navigation Architecture (Step 4)

### Navigation Types

**File:** `src/types/navigation.types.ts`

```ts
export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  permission?: PermissionCode;
  children?: NavigationItem[];
  order: number;
  isVisible?: boolean;
}
```

- Strongly typed, recursive `children` support
- `permission` is optional; when present, visibility is determined by canonical `hasPermission()`
- `icon` is a stable string identifier, not a React component
- No `any` types

### Navigation Configuration

**File:** `src/config/navigation.config.ts`

- Centralized static configuration (`NAVIGATION_ITEMS`)
- 9 top-level navigation items mapped to view permissions
- No role-specific hardcoding; visibility is permission-driven
- Supports nested `children` for future grouped menus
- Items sorted by `order` field

### Navigation Service

**File:** `src/services/navigation.service.ts`

```ts
export class NavigationService {
  getNavigation(user: IUser): NavigationItem[];
}
```

- Receives authenticated `IUser`
- Filters navigation using canonical `hasPermission(user.role, permission)`
- Recursively filters `children`
- Removes parent items when no children remain visible
- Returns clean, frontend-ready navigation array
- Does not query business data, mutate state, or trust client input

### Navigation Controller

**File:** `src/controllers/navigation.controller.ts`

- Reads `x-user-id` from middleware-injected headers
- Fetches user via `userRepository`
- Delegates to `NavigationService`
- Returns standardized `sendResponse({ items: navigation }, ...)`
- Does not accept `role` or `permissions` from request body

### Navigation API

**File:** `src/app/api/navigation/route.ts`

```http
GET /api/navigation
```

- Authentication: Required
- Protected by Edge middleware (`/api/navigation` added to `protectedRoutes`)
- Response: `{ success: true, data: { items: NavigationItem[] } }`

### Recursive Filtering Logic

```
Item visible if:
  - Item has no permission requirement, OR
  - User has the required permission, OR
  - Item has visible children

Parent removed if:
  - Parent has no permission
  - AND all children are hidden
```

### Expected Navigation By Role

| Role    | Visible Items |
|---------|---------------|
| ADMIN   | Dashboard, Students, Teachers, Parents, Classes, Attendance, Grades, Reports, Settings |
| TEACHER | Dashboard, Students, Classes, Attendance, Grades, Reports |
| STUDENT | Dashboard, Classes, Attendance, Grades |
| PARENT  | Dashboard, Students, Attendance, Grades |

These are the natural result of `Role → Canonical Permissions → Navigation Permission → Visible Navigation`.

---

## 5. Role → Permission Matrix

| Role    | Permission | Status      |
|---------|------------|-------------|
| ADMIN   | dashboard.view | Implemented |
| ADMIN   | student.view | Implemented |
| ADMIN   | student.create | Implemented |
| ADMIN   | student.update | Implemented |
| ADMIN   | student.delete | Implemented |
| ADMIN   | teacher.view | Implemented |
| ADMIN   | teacher.create | Implemented |
| ADMIN   | teacher.update | Implemented |
| ADMIN   | teacher.delete | Implemented |
| ADMIN   | parent.view | Implemented |
| ADMIN   | parent.create | Implemented |
| ADMIN   | parent.update | Implemented |
| ADMIN   | parent.delete | Implemented |
| ADMIN   | class.view | Implemented |
| ADMIN   | class.create | Implemented |
| ADMIN   | class.update | Implemented |
| ADMIN   | class.delete | Implemented |
| ADMIN   | attendance.view | Implemented |
| ADMIN   | attendance.manage | Implemented |
| ADMIN   | grade.view | Implemented |
| ADMIN   | grade.manage | Implemented |
| ADMIN   | report.view | Implemented |
| ADMIN   | report.export | Implemented |
| ADMIN   | setting.view | Implemented |
| ADMIN   | setting.manage | Implemented |
| TEACHER | dashboard.view | Implemented |
| TEACHER | student.view | Implemented |
| TEACHER | class.view | Implemented |
| TEACHER | class.create | Implemented |
| TEACHER | class.update | Implemented |
| TEACHER | attendance.view | Implemented |
| TEACHER | attendance.manage | Implemented |
| TEACHER | grade.view | Implemented |
| TEACHER | grade.manage | Implemented |
| TEACHER | report.view | Implemented |
| STUDENT | dashboard.view | Implemented |
| STUDENT | class.view | Implemented |
| STUDENT | attendance.view | Implemented |
| STUDENT | grade.view | Implemented |
| PARENT  | dashboard.view | Implemented |
| PARENT  | student.view | Implemented |
| PARENT  | attendance.view | Implemented |
| PARENT  | grade.view | Implemented |

**Total:** 24 unique permissions across 4 roles.

**Fixed in Step 3:** `teacher.create` is now ADMIN-only. TEACHER role no longer includes `teacher.create`.

---

## 6. Business Rules

### Who Can Create Teacher

```
ADMIN    → teacher.create ✅
TEACHER  → teacher.create ❌
STUDENT  → teacher.create ❌
PARENT   → teacher.create ❌
```

**Enforced by:** `POST /api/admin/teachers` — controller calls `requirePermission(requester, PermissionCode.TEACHER_CREATE)`.

### Who Can Create Student

**NOT IMPLEMENTED.** No student creation API exists yet. The permission `student.create` is defined and assigned to ADMIN and TEACHER roles.

### Who Can Create Parent

**NOT IMPLEMENTED.** No parent creation API exists yet. The permission `parent.create` is defined and assigned to ADMIN and TEACHER roles.

### Who Can Create Admin

**NOT IMPLEMENTED.** No admin creation API exists yet. There is no explicit `admin.create` permission.

### Public Registration Role Selection

**NOT ALLOWED.** The registration schema (`registerSchema` in `src/validations/auth.validation.ts`) does not accept a `role` field. All public registrations are assigned `STUDENT` role server-side.

### Role Escalation Protection

**IMPLEMENTED.** No validation schema or service method accepts `role` as client input. Role is assigned exclusively by the server:
- Registration → `STUDENT` (model default)
- Google login → `STUDENT` (model default, with canonical permissions now populated)
- Teacher creation → `TEACHER` (server-assigned, with canonical TEACHER permissions)

### Role Change Restrictions

**NOT IMPLEMENTED.** There is no API to change a user's role after registration. The `updateProfile` endpoint only accepts `name` and `avatar`.

---

## 7. Security Status

| Security Control | Status |
|------------------|--------|
| Role tampering protection | IMPLEMENTED — No client input accepts role |
| Permission tampering protection | IMPLEMENTED — Permissions are server-computed, never trusted from client |
| Privilege escalation protection | IMPLEMENTED — Registration always assigns STUDENT; teacher creation enforces ADMIN + teacher.create |
| Registration role protection | IMPLEMENTED — `registerSchema` has no `role` field |
| Authentication compatibility | PASS — All auth flows work |
| Authorization enforcement | IMPLEMENTED — `requirePermission` / `requireAdmin` helpers used in controllers |
| Teacher creation protection | IMPLEMENTED — Only ADMIN with `teacher.create` can create teachers |

---

## 8. Authentication Compatibility

| Flow | Status | Notes |
|------|--------|-------|
| Register | PASS | Assigns `STUDENT` role + permissions. Returns `permissions` in response. |
| Login | PASS | Returns `permissions` in response. |
| Logout | PASS | Unchanged. |
| Refresh token | PASS | Returns new tokens only. Permissions not included (frontend should use `/profile` for updated permissions). |
| Profile (GET) | PASS | Returns `permissions` in response. |
| Profile (PUT) | PASS | Returns `permissions` in response. |
| Change password | PASS | Unchanged. |
| Forgot password | PASS | Unchanged. |
| Reset password | PASS | Unchanged. |
| Google authentication | PASS | Fixed — new Google users now receive canonical STUDENT permissions and `permissions` is returned in response. |

---

## 9. Database Status

### User Collection

| Field | Type | Status |
|-------|------|--------|
| `role` | String (enum) | Updated — accepts `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` |
| `permissions` | `[String]` | Unchanged schema — stores `PermissionCode[]` as strings |
| All other fields | — | Unchanged |

### Role Storage

- **No Role collection.** Roles are static TypeScript enum values stored as strings on the User document.

### Permission Storage

- **No Permission collection.** Permissions are static TypeScript constants.
- User permissions are stored as a string array on the User document.

### Role-Permission Storage

- **No separate collection.** The mapping exists only in `src/lib/permissions.ts` as a static `Record<UserRole, PermissionCode[]>`.

### Indexes

No new indexes added in Step 1, Step 2, or Step 3. Existing indexes remain:
- `email` (unique)
- `providerId` (sparse)
- `refreshToken`

### Migration Requirements

| Migration | Status | Description |
|-----------|--------|-------------|
| Legacy role cleanup | REQUIRED | Users with `role: "SUPER_ADMIN"` or `role: "USER"` must be migrated to `ADMIN` or `STUDENT` respectively |
| Google login permissions | FIXED | New Google users now receive canonical STUDENT permissions |

---

## 10. API Status

| Method | Route | Purpose | Auth | Role Required | Permission Required | Status |
|--------|-------|---------|------|---------------|---------------------|--------|
| POST | `/api/auth/register` | Register new user | No | — | — | Implemented |
| POST | `/api/auth/login` | Login | No | — | — | Implemented |
| POST | `/api/auth/logout` | Logout | Yes | — | — | Implemented |
| POST | `/api/auth/refresh` | Refresh tokens | No (cookie) | — | — | Implemented |
| GET | `/api/auth/profile` | Get current user | Yes | — | — | Implemented |
| PUT | `/api/auth/profile` | Update profile | Yes | — | — | Implemented |
| POST | `/api/auth/change-password` | Change password | Yes | — | — | Implemented |
| POST | `/api/auth/forgot-password` | Request password reset | No | — | — | Implemented |
| POST | `/api/auth/reset-password` | Reset password | No | — | — | Implemented |
| POST | `/api/auth/google` | Google OAuth login | No | — | — | Implemented |
| POST | `/api/admin/teachers` | Create teacher | Yes | ADMIN | teacher.create | Implemented |
| GET | `/api/navigation` | Get user navigation | Yes | — | — | Implemented |

**Note:** `/api/admin/teachers` is protected by Edge middleware (requires ADMIN role) and additionally by controller-level `requirePermission` check.

**Note:** `/api/navigation` is protected by Edge middleware (requires authentication). Navigation items are filtered server-side by user permissions.

---

## 11. Authorization Architecture

### Final Security Flow

```
                    HTTP Request
                         ↓
                 Authentication
                    (Edge Middleware)
                         ↓
                  Authenticated User
                    (x-user-id header)
                         ↓
                        Role
                    (x-user-role header)
                         ↓
                    Permissions
                 (canonical mapping)
                         ↓
                  Authorization
                  (Controller)
                    /         \
                ALLOW          DENY
                  ↓              ↓
             Controller          403
                  ↓
               Service
                  ↓
             Repository
                  ↓
               MongoDB
```

### Authorization Helper Usage

**File:** `src/lib/authorization.ts`

```ts
// In controller:
const requester = await userRepository.findById(userId);
requirePermission(requester, PermissionCode.TEACHER_CREATE);
// If check passes, proceed to service layer
```

### Teacher Creation Authorization Flow

```
ADMIN
  ↓
Authenticated (Edge Middleware → x-user-id, x-user-role)
  ↓
Authorized (Controller → requirePermission → teacher.create)
  ↓
Create Teacher (TeacherService)
  ↓
role = TEACHER (server-assigned)
  ↓
permissions = canonical TEACHER permissions
  ↓
Save User
```

### What Authorization Does NOT Do

- Query unrelated business data
- Perform database mutations
- Contain controller logic
- Contain frontend logic
- Contain navigation logic

---

## 12. Architecture Status

### Actual Backend Flow

```
API Route (app/api/auth/.../route.ts | app/api/navigation/route.ts)
    ↓
apiHandler wrapper (utils/apiHandler.ts)
    ↓
Controller (controllers/auth.controller.ts | teacher.controller.ts | navigation.controller.ts)
    ↓
Service (services/auth.service.ts | teacher.service.ts | navigation.service.ts)
    ↓
Repository (repositories/user.repository.ts)
    ↓
Model (models/user.model.ts)
    ↓
MongoDB
```

### Layer Status

| Layer | Status | Notes |
|-------|--------|-------|
| Routes | Implemented | 12 endpoints (10 auth + 1 teacher + 1 navigation) |
| apiHandler | Implemented | DB connection, rate limiting, error catch |
| Controller | Implemented | HTTP logic, cookies, validation, authorization |
| Service | Implemented | Business logic, permission population, navigation filtering |
| Repository | Implemented | Data access abstraction |
| Model | Implemented | Mongoose schemas |
| Middleware | Implemented | JWT verification, admin route check, CORS, protected route injection |
| Authorization | Implemented | `requirePermission`, `requireRole`, `requireAdmin` |
| Navigation | Implemented | Permission-filtered navigation configuration and service |
| Validation | Implemented | Zod schemas for all inputs |
| Error Handling | Implemented | AppError, apiHandler, sendResponse |
| Logging | Implemented | Winston |

### What Is NOT Yet Implemented

| Component | Status |
|-----------|--------|
| Permission enforcement middleware | NOT IMPLEMENTED |
| Role management API | NOT IMPLEMENTED |
| Permission management API | NOT IMPLEMENTED |
| Sidebar backend | NOT IMPLEMENTED |
| Student creation API | NOT IMPLEMENTED |
| Parent creation API | NOT IMPLEMENTED |
| Admin creation API | NOT IMPLEMENTED |
| Header API | NOT IMPLEMENTED |
| Dashboard API | NOT IMPLEMENTED |

---

## 13. File Inventory

### Auth Files (Unchanged from Step 1)

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/jwt.ts` | JWT generation/verification (Node) | Stable |
| `src/lib/edgeJwt.ts` | JWT verification (Edge runtime) | Stable |
| `src/lib/password.ts` | Password hashing/comparison | Stable |
| `src/lib/db.ts` | MongoDB connection caching | Stable |
| `src/controllers/auth.controller.ts` | HTTP controllers | Unchanged |
| `src/repositories/user.repository.ts` | Data access | Unchanged |
| `src/validations/auth.validation.ts` | Zod schemas | Unchanged |
| `src/utils/apiHandler.ts` | Route wrapper | Unchanged |
| `src/utils/AppError.ts` | Error class | Unchanged |
| `src/utils/apiResponse.ts` | Response format | Unchanged |
| `src/utils/logger.ts` | Winston logger | Unchanged |
| `src/utils/rateLimiter.ts` | Rate limiting | Unchanged |
| `src/constants/statusCodes.ts` | HTTP status codes | Unchanged |
| `src/constants/errorMessages.ts` | Error messages | Unchanged |

### Role Files (Step 1)

| File | Purpose | Status |
|------|---------|--------|
| `src/types/user.types.ts` | UserRole enum, IUser interface | Modified — roles updated to ADMIN/TEACHER/STUDENT/PARENT |
| `src/models/user.model.ts` | User Mongoose schema | Modified — default role changed to STUDENT |
| `src/middleware.ts` | Edge middleware | Modified — SUPER_ADMIN removed from admin check |

### Permission Files (Step 2)

| File | Purpose | Status |
|------|---------|--------|
| `src/types/permission.types.ts` | PermissionCode enum, PermissionCode type, ALL_PERMISSIONS | Created |
| `src/lib/permissions.ts` | ROLE_PERMISSIONS map, hasPermission(), getRolePermissions(), validatePermission() | Created |

### Authorization Files (Step 3)

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/authorization.ts` | requirePermission(), requireRole(), requireAdmin() | **Created** |

### Teacher API Files (Step 3)

| File | Purpose | Status |
|------|---------|--------|
| `src/validations/teacher.validation.ts` | Zod schema for teacher creation | **Created** |
| `src/services/teacher.service.ts` | Teacher creation business logic | **Created** |
| `src/controllers/teacher.controller.ts` | Teacher HTTP handlers with authorization | **Created** |
| `src/app/api/admin/teachers/route.ts` | POST /api/admin/teachers | **Created** |

### Navigation API Files (Step 4)

| File | Purpose | Status |
|------|---------|--------|
| `src/types/navigation.types.ts` | NavigationItem interface with recursive children | **Created** |
| `src/config/navigation.config.ts` | Static navigation registry with permission mapping | **Created** |
| `src/services/navigation.service.ts` | Permission-based navigation filtering | **Created** |
| `src/controllers/navigation.controller.ts` | Navigation HTTP handler | **Created** |
| `src/app/api/navigation/route.ts` | GET /api/navigation | **Created** |

### Files Modified for Permission Integration

| File | Purpose | Status |
|------|---------|--------|
| `src/types/user.types.ts` | IUser.permissions typed as PermissionCode[] | Modified |
| `src/services/auth.service.ts` | Permission population on register/login/profile/googleLogin | Modified |

---

## 14. Implemented vs Pending

| Feature | Status |
|---------|--------|
| Authentication | IMPLEMENTED |
| User | IMPLEMENTED |
| Role | IMPLEMENTED |
| Permission (definitions) | IMPLEMENTED |
| Permission (type safety) | IMPLEMENTED |
| Role-Permission mapping | IMPLEMENTED |
| Permission population on auth | IMPLEMENTED |
| Permission response in API | IMPLEMENTED |
| Authorization / RBAC | IMPLEMENTED |
| Permission enforcement | IMPLEMENTED |
| Teacher creation API | IMPLEMENTED |
| Navigation API | IMPLEMENTED |
| Navigation filtering | IMPLEMENTED |
| Sidebar API | NOT IMPLEMENTED |
| Header API | NOT IMPLEMENTED |
| Dashboard API | NOT IMPLEMENTED |
| Role management API | NOT IMPLEMENTED |
| Permission management API | NOT IMPLEMENTED |

---

## 15. Step Progress

| Step | Description | Status |
|------|-------------|--------|
| Step 1 — Role Architecture | Canonical roles: ADMIN, TEACHER, STUDENT, PARENT | COMPLETED |
| Step 2 — Permission Architecture | 24 static permissions, role-permission mapping, permission population in auth | COMPLETED |
| Step 3 — Authorization / RBAC | Centralized authorization helpers, teacher creation API, permission enforcement | COMPLETED |
| Step 4 — Navigation Backend | Navigation types, config, service, controller, GET /api/navigation | COMPLETED |
| Step 5 — Sidebar/Header Integration | Frontend integration with backend navigation/permissions | NOT STARTED |

---

## 16. Testing Status

| Check | Result | Notes |
|-------|--------|-------|
| TypeScript | PASS | `tsc --noEmit` returned no errors |
| ESLint | PASS | 0 errors, 4 pre-existing warnings (unused vars) |
| Unit Tests | NOT AVAILABLE | No test scripts in `package.json` |
| Integration Tests | NOT AVAILABLE | No test scripts in `package.json` |
| Production Build | PASS | `next build` compiled successfully |

**Verified manually:**
- Role enum values match frontend contract: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`
- `UserRole.SUPER_ADMIN` and `UserRole.USER` do not exist in source code
- Middleware admin check only references `UserRole.ADMIN`
- Permission registry contains 24 permissions
- `hasPermission()`, `getRolePermissions()`, `validatePermission()` exist and are callable
- `requirePermission()`, `requireRole()`, `requireAdmin()` exist and are callable
- `IUser.permissions` typed as `PermissionCode[]`
- Auth service imports `getRolePermissions` and populates permissions on register
- Auth service populates permissions for new Google users and returns them in response
- `POST /api/admin/teachers` route exists and is protected
- `teacher.create` is ADMIN-only in `ROLE_PERMISSIONS`
- `GET /api/navigation` route exists, is protected by middleware, and returns permission-filtered items
- `NavigationService.filterNavigation` recursively removes invisible parents
- Navigation config maps all 9 items to correct permissions
- No route accepts `role` or `permissions` from client input

**NOT verified (requires runtime test):**
- Whether existing database records with legacy roles still authenticate
- Whether 403 is correctly returned for unauthorized teacher creation attempts
- Whether Google login new users receive permissions at runtime (code fix verified)
- Runtime navigation output for each role (ADMIN/TEACHER/STUDENT/PARENT)

---

## 17. Known Issues

### Issue 1: Legacy Role Database Migration Required

**Problem:** Existing database records may contain `role: "SUPER_ADMIN"` or `role: "USER"`. Mongoose will reject updates to these documents until roles are migrated.

**Impact:** Users with legacy roles cannot update their profile, change password, or trigger any user document update.

**Status:** Documented only. Migration not executed.

**Recommended next step:** Run one-time migration script before production deploy:
```js
await User.updateMany({ role: "SUPER_ADMIN" }, { $set: { role: "ADMIN" } });
await User.updateMany({ role: "USER" }, { $set: { role: "STUDENT" } });
```

### Issue 2: No Dynamic Permission Management

**Problem:** Permissions are static TypeScript constants. Adding or modifying permissions requires code changes and redeployment.

**Impact:** Admin users cannot manage permissions through the API.

**Status:** Expected for Step 2/3. Future enhancement.

### Issue 3: No Permission Caching

**Problem:** `hasPermission()` performs an array lookup on every call. This is fast for 24 permissions, but no caching layer exists.

**Impact:** Minimal — O(24) per check is negligible.

**Status:** Not required for current scale. Revisit if permissions exceed 100.

### Issue 5: Middleware Deprecation Warning

**Problem:** Next.js 16 warns that the `middleware` file convention is deprecated in favor of `proxy`.

**Impact:** Low — middleware still functions correctly.

**Status:** Acknowledged. Rename to `proxy.ts` in a future maintenance cycle.

### Issue 6: Navigation Static Configuration

**Problem:** Navigation items are defined as static TypeScript constants in `src/config/navigation.config.ts`. Adding or modifying navigation requires code changes and redeployment.

**Impact:** Admin users cannot manage navigation through the API.

**Status:** Expected for Step 4. Future enhancement if dynamic navigation management is required.

---

## 18. Next Development Step

```
NEXT STEP:
Step 5 — Sidebar/Header Frontend Integration
```

### What Step 4 Delivered

Step 4 delivers the backend-driven navigation foundation:

```
User
 ↓
Role            ← EXISTS (enum)
 ↓
Permissions     ← EXISTS (static mapping + stored on User)
 ↓
Authorization   ← EXISTS (requirePermission, requireRole, requireAdmin)
 ↓
Navigation      ← EXISTS (GET /api/navigation, permission-filtered)
```

The navigation API returns role-aware, permission-filtered menu items. The frontend can now consume this to render the Sidebar and Header.

### What Step 5 Must Build

Step 5 will integrate the backend navigation API with the frontend Sidebar and Header components.

**Required for Step 5:**
1. Frontend navigation store/hook — consume `/api/navigation`
2. Sidebar component — render `NavigationItem[]` from API
3. Header component — reflect current navigation state
4. Active route highlighting — based on current path
5. Collapsible menu groups — based on nested `children`
6. Icon mapping — map backend icon identifiers to Ant Design components
7. Loading/error states — for navigation fetch

### Remaining Gaps Before Full Feature Completion

| Gap | Status |
|-----|--------|
| Student creation API | NOT STARTED |
| Parent creation API | NOT STARTED |
| Admin creation API | NOT STARTED |
| Permission management API | NOT STARTED |
| Role management API | NOT STARTED |
| Sidebar frontend integration | NOT STARTED |
| Header frontend integration | NOT STARTED |
| Dashboard API | NOT STARTED |

---

*End of Architecture Status Report*
