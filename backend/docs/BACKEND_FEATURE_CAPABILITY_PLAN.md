# LearnSphere Backend Feature Capability Plan

## 1. Audit Scope

This document is a read-only planning audit of the LearnSphere Enterprise School LMS repository at `E:\final_project`.

It derives the **actual** backend capabilities from source code (not assumptions) and plans the backend feature APIs required for future LMS domains.

**Status:** AUDIT ONLY — NO backend, frontend, or configuration files were modified during this audit.

| Item | Detail |
|------|--------|
| Repository | `E:\final_project` (monorepo: `backend/` + `frontend/`) |
| Branch | `feature/backend-feature-planning` |
| Audit date | 2026-08-27 |
| Backend framework | Next.js 16.2.11 (App Router) |
| Backend runtime | Node.js / Edge Runtime (middleware) |
| Database | MongoDB (Mongoose 9.8.0) |
| JWT (server-side) | `jsonwebtoken` 9.0.3 |
| JWT (edge verify) | `jose` 6.2.6 |
| Password hashing | `bcryptjs` 3.0.3 (12 rounds) |
| Validation | `zod` 4.4.3 |
| Logging | `winston` 3.19.0 |
| Rate limiting | `rate-limiter-flexible` 11.2.0 (Redis in prod, memory in dev) |
| Frontend framework | Next.js 16 App Router + React 19 + TypeScript 5 + AntD v6 |

---

## 2. Current Git State

### Backend
- **CLEAN** — `git status --short -- backend/` returns no output.
- Backend source code was **NOT modified** by this audit.

### Frontend
- **81 `.js` deletions** (Step 13 cleanup — stale compiled artifacts with `.ts`/`.tsx` counterparts).
- **6 modified `.tsx` files** (pre-existing Steps 11–12 changes):
  - `frontend/src/components/navigation/Header/Header.tsx`
  - `frontend/src/components/navigation/Header/UserMenu.tsx`
  - `frontend/src/features/profile/components/ChangePasswordForm.tsx`
  - `frontend/src/features/profile/components/ProfileView.tsx`
  - `frontend/src/layouts/DashboardLayout.tsx`
- **3 modified `.ts` files** (pre-existing):
  - `frontend/src/components/common/index.ts`
  - `frontend/src/config/api/constants.ts`
  - `frontend/tsconfig.tsbuildinfo` (build cache)
- **2 untracked directories** (pre-existing, Steps 11–12):
  - `frontend/src/components/common/DataTable/`
  - `frontend/src/components/common/ConfirmDialog/`
- **1 modified non-source file**: `frontend/next-env.d.ts` (auto-generated Next.js artifact)

### Classification of all changes

| Change type | Count | Cause |
|-------------|-------|-------|
| `.js` deletions (frontend/src) | 81 | Step 13 cleanup (stale compiled artifacts) |
| `.tsx` modifications | 6 | Pre-existing Steps 11–12 (AntD fixes, DataTable/ConfirmDialog integration) |
| `.ts` modifications | 3 | Pre-existing (barrel export fix, API constants, build cache) |
| `next-env.d.ts` | 1 | Pre-existing (auto-generated) |
| Untracked dirs | 2 | Pre-existing Steps 11–12 |
| Backend changes | 0 | None |
| Package changes | 0 | None |

**Unexpected changes:** None.

**Git diff stat:**
```
90 files changed, 62 insertions(+), 2080 deletions(-)
```
(81 `.js` deletions + 6 `.tsx` modifications + 3 `.ts` modifications + `tsconfig.tsbuildinfo` + `next-env.d.ts`)

---

## 3. Frontend Source State

| Extension | Count |
|-----------|-------|
| `.js` | 0 |
| `.jsx` | 0 |
| `.ts` | 52 |
| `.tsx` | 34 |

### Route files verified present

| Route file | Status |
|-----------|--------|
| `src/app/page.tsx` | EXISTS |
| `src/app/layout.tsx` | EXISTS |
| `src/app/(auth)/layout.tsx` | EXISTS |
| `src/app/(auth)/login/page.tsx` | EXISTS |
| `src/app/(dashboard)/layout.tsx` | EXISTS |
| `src/app/(dashboard)/dashboard/page.tsx` | EXISTS |
| `src/app/(dashboard)/profile/page.tsx` | EXISTS |
| `src/app/(dashboard)/profile/edit/page.tsx` | EXISTS |
| `src/app/(dashboard)/profile/change-password/page.tsx` | EXISTS |

### Reusable components verified present

| Component | Files |
|-----------|-------|
| DataTable | `DataTable.tsx`, `DataTable.types.ts`, `DataTable.module.css`, `DataTable.utils.ts` |
| ConfirmDialog | `ConfirmDialog.tsx`, `ConfirmDialog.types.ts`, `ConfirmDialog.module.css` |

---

## 4. Architecture Summary

### Frontend architecture (actual)
- **Framework**: Next.js 16 App Router (Turbopack)
- **Runtime**: React 19.2.4
- **Language**: TypeScript 5 (strict)
- **UI**: Ant Design v6 + CSS Modules
- **Global state**: Redux Toolkit (both auth state via `authSlice.ts` AND UI state via `uiSlice.ts`)
- **Auth state**: AuthContext (React Context) wraps and dispatches to Redux `authSlice`
- **API**: Axios (`apiClient`) with `withCredentials: true`, 401→refresh→retry interceptors with refresh lock
- **Forms**: React Hook Form + Zod
- **Auth flow**: Session restored via `GET /api/auth/profile` on app load; login/logout via AuthContext dispatching Redux authSlice actions

### Authentication (actual)
- `AuthContext.tsx` — provides `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `refreshUser()`
- `useAuth.ts` — reads auth state from Redux `authSlice`, exposes logout mutation
- `services/api/auth/index.ts` — all auth API calls (login, register, logout, refresh, profile, changePassword, forgotPassword, resetPassword, googleLogin)
- `lib/axios/` — `client.ts`, `index.ts`, `interceptors.ts`, `refresh.ts`
- `store/slices/authSlice.ts` — Redux slice for auth state (status, user)

### State management (actual — note deviation from ARCHITECTURE.md)
- **Auth state**: Stored in Redux `authSlice.ts` (status: "unknown" | "authenticated" | "unauthenticated", user object)
- **UI state**: Stored in Redux `uiSlice.ts` (sidebar collapsed, theme mode)
- **AuthContext.tsx** wraps the Redux auth slice and adds session restoration logic
- *Deviation from ARCHITECTURE.md Section J*: The documentation says "Auth state (React Context — NOT Redux)" and "No Redux auth state", but the **actual implementation** uses Redux `authSlice` as the auth state source, with AuthContext as a consumer wrapper. This is functional and verified (tsc + build pass).

### API layer (actual)
- Axios client with `withCredentials: true` (cookie-based auth, no Authorization header)
- Response interceptor catches 401 → calls `/api/auth/refresh` → retries original request once
- Refresh lock prevents duplicate refresh calls on concurrent 401s
- No-refresh paths: `/auth/refresh`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/google`

### Routing (actual)
- Next.js App Router with route groups: `(auth)` (public auth pages), `(dashboard)` (protected dashboard)
- Protected routes: `(dashboard)/layout.tsx` checks `useAuth().isAuthenticated` → redirects to `/login` if not authenticated
- Route pages: `/`, `/login`, `/dashboard`, `/dashboard/profile`, `/dashboard/profile/edit`, `/dashboard/profile/change-password`
- No feature routes yet (Classes, Courses, Assignments, etc.)

### UI architecture (actual)
- DashboardLayout: Sidebar (config-driven, role-filtered), Header (UserMenu, ThemeToggle), Content, Footer
- Breadcrumb, LoadingState, ErrorState, EmptyState, SkeletonLoader, StatusTag, PageContainer
- DataTable (reusable data display component)
- ConfirmDialog (reusable confirmation dialog)
- Theme system: Light/Dark/System with toggle (Header), persisted in localStorage + Redux

---

## 5. Backend API Inventory

### Backend source tree

```
backend/src/
├── app/api/auth/
│   ├── change-password/route.ts
│   ├── forgot-password/route.ts
│   ├── google/route.ts
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── profile/route.ts
│   ├── refresh/route.ts
│   ├── register/route.ts
│   └── reset-password/route.ts
├── config/env.ts
├── constants/{statusCodes,errorMessages}.ts
├── controllers/auth.controller.ts
├── interfaces/response.interface.ts
├── lib/{db,edgeJwt,jwt,password}.ts
├── middleware.ts
├── models/user.model.ts
├── repositories/user.repository.ts
├── services/{auth,Email}.service.ts
├── types/{auth,user}.types.ts
└── utils/{apiHandler,apiResponse,AppError,logger,rateLimiter}.ts
```

### Confirmed API table

| Domain | Method | Endpoint | Auth Required | Role/RBAC | Backend Status |
|--------|--------|----------|---------------|-----------|----------------|
| Auth | POST | `/api/auth/register` | No | - | IMPLEMENTED |
| Auth | POST | `/api/auth/login` | No | - | IMPLEMENTED |
| Auth | POST | `/api/auth/refresh` | No (reads refreshToken cookie) | - | IMPLEMENTED |
| Auth | POST | `/api/auth/logout` | Yes (access token cookie) | Any authenticated | IMPLEMENTED |
| Auth | GET | `/api/auth/profile` | Yes (access token cookie) | Any authenticated | IMPLEMENTED |
| Auth | PUT | `/api/auth/profile` | Yes (access token cookie) | Any authenticated | IMPLEMENTED |
| Auth | POST | `/api/auth/change-password` | Yes (access token cookie) | Any authenticated | IMPLEMENTED |
| Auth | POST | `/api/auth/forgot-password` | No | - | IMPLEMENTED |
| Auth | POST | `/api/auth/reset-password` | No (reset token in body) | - | IMPLEMENTED |
| Auth | POST | `/api/auth/google` | No | - | IMPLEMENTED |
| Classes | ANY | `/api/classes` | — | — | **NOT AVAILABLE** |
| Courses | ANY | `/api/courses` | — | — | **NOT AVAILABLE** |
| Assignments | ANY | `/api/assignments` | — | — | **NOT AVAILABLE** |
| Grades | ANY | `/api/grades` | — | — | **NOT AVAILABLE** |
| Attendance | ANY | `/api/attendance` | — | — | **NOT AVAILABLE** |
| Admin | ANY | `/api/admin/*` | Yes (access token cookie) | ADMIN only (middleware check) | **NOT AVAILABLE** (middleware exists but no route handlers) |
| Teacher | ANY | `/api/teacher/*` | — | — | **NOT AVAILABLE** |
| Student | ANY | `/api/student/*` | — | — | **NOT AVAILABLE** |
| Timetable | ANY | `/api/timetable` | — | — | **NOT AVAILABLE** |
| Announcements | ANY | `/api/announcements` | — | — | **NOT AVAILABLE** |
| Notifications | ANY | `/api/notifications` | — | — | **NOT AVAILABLE** |
| Analytics/Dashboard | ANY | `/api/analytics` | — | — | **NOT AVAILABLE** |
| Settings | ANY | `/api/settings` | — | — | **NOT AVAILABLE** |

### Backend data model (actual)

**Only 1 model exists: `User`** (`src/models/user.model.ts`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (2–100, trim) | User's full name |
| `email` | String (unique, index) | User's email (lowercase) |
| `password` | String (select: false) | bcrypt hash (12 rounds), nullable for OAuth-only users |
| `provider` | String (enum: LOCAL, GOOGLE) | Auth provider |
| `providerId` | String (sparse index) | OAuth provider ID |
| `avatar` | String (nullable) | Avatar URL |
| `role` | String (enum: ADMIN, TEACHER, STUDENT, PARENT, default: STUDENT) | User role |
| `permissions` | [String] (default: []) | Unused — no permission system |
| `isActive` | Boolean (default: true) | Account status |
| `isVerified` | Boolean (default: false) | Email verification (not enforced) |
| `refreshToken` | String (select: false, nullable) | Active refresh token (single per user) |
| `lastLogin` | Date (nullable) | Last login timestamp |
| `loginAttempts` | Number (default: 0) | Failed login counter for lockout |
| `lockUntil` | Date (nullable) | Account lockout expiry |
| `passwordChangedAt` | Date (nullable) | Last password change |
| `createdAt` / `updatedAt` | Date | Timestamps (Mongoose `timestamps: true`) |

**No other models/collections exist.** There are no Class, Course, Assignment, Grade, Attendance, Enrollment, Timetable, Announcement, or Notification models.

### Backend infrastructure (actual)

| Component | File | Details |
|-----------|------|---------|
| Database | `lib/db.ts` | Mongoose connection (cached singleton), `MONGODB_URI` required |
| Middleware | `middleware.ts` | Next.js middleware on `/api/:path*` — CORS, OPTIONS preflight, access token verification via `jose`, role check for admin routes, sets `x-user-id` / `x-user-role` headers |
| Auth controller | `controllers/auth.controller.ts` | All auth operations, `handleError()` with ZodError/AppError handling, `setCookies()` / `clearCookies()` |
| Auth service | `services/auth.service.ts` | Business logic for register, login, refresh (rotation), logout, profile, changePassword, forgotPassword, resetPassword, googleLogin |
| Auth validation | `validations/auth.validation.ts` | Zod schemas: registerSchema, loginSchema, changePasswordSchema, resetPasswordSchema, updateProfileSchema, googleLoginSchema |
| Auth types | `types/auth.types.ts` | `JwtPayload` ({ userId, role, type }) |
| User types | `types/user.types.ts` | `UserRole` (ADMIN/TEACHER/STUDENT/PARENT), `AuthProvider` (LOCAL/GOOGLE), `IUser` interface |
| User repository | `repositories/user.repository.ts` | findByEmail, findById, findByGoogleId, create, update, updateLastLogin, exists, incrementLoginAttempts |
| Rate limiter | `utils/rateLimiter.ts` | 100 req/60s per IP, Redis in prod, memory in dev |
| API handler | `utils/apiHandler.ts` | Wrapper: connectDB → rateLimit → handler → catch(500) |
| Response helper | `utils/apiResponse.ts` | `sendResponse(data, message, errors)` → `{ success, message, data, errors, timestamp }` |
| AppError | `utils/AppError.ts` | Custom error with statusCode, errors, isOperational |
| Env config | `config/env.ts` | Validates MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET as required |
| JWT | `lib/jwt.ts` | `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` (type field enforcement) |
| Edge JWT | `lib/edgeJwt.ts` | `verifyEdgeAccessToken` via `jose.jwtVerify` (for middleware) |
| Password | `lib/password.ts` | `hashPassword` (bcrypt 12 rounds), `comparePassword` (has console.log debug in dev) |
| Logger | `utils/logger.ts` | Winston, JSON format, console transport |
| Email | `services/email.service.ts` | STUB — logs to logger, not actually sending emails |
| CORS | In `middleware.ts` | Reflects `FRONTEND_ORIGIN` (default `http://localhost:3000`), credentials: true |

### Protected routes (actual)

```typescript
// From middleware.ts
const protectedRoutes = ["/api/auth/change-password", "/api/auth/profile", "/api/auth/logout"];
const adminRoutes = ["/api/admin"];
```

| Route | Auth | Role |
|-------|------|------|
| `/api/auth/change-password` | Yes | Any authenticated |
| `/api/auth/profile` (GET) | Yes | Any authenticated |
| `/api/auth/profile` (PUT) | Yes | Any authenticated |
| `/api/auth/logout` | Yes | Any authenticated |
| `/api/admin/*` | Yes | ADMIN only |
| All other `/api/auth/*` | No | - |
| All other `/api/*` | No (not in protectedRoutes or adminRoutes) | - |

### Authentication / token contract (actual)

- Access token: JWT signed with `JWT_ACCESS_SECRET`, 15 min expiry, payload: `{ userId, role, type: "access" }`
- Refresh token: JWT signed with `JWT_REFRESH_SECRET`, 7 days expiry, payload: `{ userId, role, type: "refresh" }`
- Reset token: JWT signed with `JWT_ACCESS_SECRET`, 15 min expiry, payload: `{ userId, type: "reset" }`
- Token rotation: Refresh endpoint verifies DB rotation — old refresh tokens are invalidated
- Token reuse detection: If refresh token in DB doesn't match presented token → revoke all tokens, return 401
- Cookies: `accessToken` (15 min, httpOnly, sameSite=strict, path=/), `refreshToken` (7 days, httpOnly, sameSite=strict, path=/)
- Token type field: Enforced in both `jwt.ts` (server-side) and `edgeJwt.ts` (middleware) — prevents token substitution
- Account lockout: After 5 failed login attempts, locked for 15 minutes
- Rate limiting: 100 requests/60 seconds per IP (applied to all `/api/*` via `apiHandler`)

### Response contract (actual)

```typescript
// From interfaces/response.interface.ts
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: string;
}
```

All responses wrapped via `sendResponse(data, message?, errors?)`.

### Roles (actual)

```typescript
// From types/user.types.ts
enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

enum AuthProvider {
  LOCAL = "LOCAL",
  GOOGLE = "GOOGLE",
}
```

### Permissions (actual)

- The `User` model has a `permissions: string[]` field (default: `[]`), but it is **NOT USED** in any backend auth flow.
- Authorization is **role-based only** — no permission-code system exists.
- The `permissions` field is defined in the schema but no endpoint reads or enforces it.

---

## 6. Frontend Capability Inventory

### Current frontend capabilities

| Capability | Implementation | Backend Support |
|------------|----------------|-----------------|
| Authentication state | AuthContext + authSlice (Redux) | YES (`/api/auth/profile`) |
| Login | LoginForm.tsx + useLogin hook | YES |
| Register | Not in routes, but API service exists | YES |
| Logout | useAuth hook + useLogout | YES |
| Session restore | AuthContext on mount (`GET /api/auth/profile`) | YES |
| Profile view | ProfileView.tsx + `GET /api/auth/profile` | YES |
| Edit profile | ProfileForm.tsx + useUpdateProfile (`PUT /api/auth/profile`) | YES |
| Change password | ChangePasswordForm.tsx + useChangePassword | YES |
| Forgot password | `useForgotPassword` hook exists, but NO route page | YES |
| Reset password | `useResetPassword` hook exists, but NO route page | YES |
| Google Login | useGoogleLogin hook + GoogleLoginButton referenced in ARCHITECTURE.md | YES |
| Protected routing | `(dashboard)/layout.tsx` checks AuthContext | YES (frontend-only) |
| Dashboard shell | DashboardLayout.tsx (Sidebar, Header, Content, Footer) | N/A (UI only) |
| Sidebar | config-driven navigation (Dashboard, Profile) | N/A (frontend config) |
| Header | UserMenu, ThemeToggle, Breadcrumb | N/A (UI only) |
| Theme | Light/Dark/System, persisted in localStorage + Redux | N/A |
| Loading/Error/Empty states | LoadingState, ErrorState, EmptyState, SkeletonLoader, StatusTag | N/A |
| DataTable | Reusable component (untracked) | N/A (UI only) |
| ConfirmDialog | Reusable component (untracked) | N/A (UI only) |
| Form handling | React Hook Form + Zod schemas | N/A |
| Role-based nav | Navigation config filters by role, Sidebar renders filtered items | YES (role in profile response) |

### Existing frontend features requiring future backend APIs

| Feature | Frontend status | Required backend API | Backend ready? |
|---------|-----------------|---------------------|----------------|
| Classes list/detail | NOT implemented | `/api/classes` | NO |
| Courses list/detail | NOT implemented | `/api/courses` | NO |
| Assignments list/create/submit | NOT implemented | `/api/assignments` | NO |
| Grades/results | NOT implemented | `/api/grades` | NO |
| Attendance | NOT implemented | `/api/attendance` | NO |
| Timetable | NOT implemented | `/api/timetable` | NO |
| Announcements | NOT implemented | `/api/announcements` | NO |
| Notifications | NOT implemented | `/api/notifications` | NO |
| Admin panel | NOT implemented | `/api/admin/*` | NO (middleware check exists, no routes) |
| Analytics/dashboard | Dashboard is a stub | `/api/analytics` | NO |

---

## 7. Frontend ↔ Backend Capability Matrix

| Frontend Feature | Frontend Exists? | Backend API Exists? | Ready to Implement? | Blocking Dependency |
|------------------|------------------|---------------------|---------------------|---------------------|
| Authentication (session restore) | YES — AuthContext + authSlice | YES — `/api/auth/profile` | READY | None |
| Login | YES — LoginForm.tsx | YES — `/api/auth/login` | READY | None |
| Register | YES (API service only, no route page) | YES — `/api/auth/register` | READY | None (route page pending) |
| Logout | YES — useAuth.logout | YES — `/api/auth/logout` | READY | None |
| Profile view | YES — ProfileView.tsx | YES — `GET /api/auth/profile` | READY | None |
| Edit profile | YES — ProfileForm.tsx | YES — `PUT /api/auth/profile` | READY | None |
| Change password | YES — ChangePasswordForm.tsx | YES — `/api/auth/change-password` | READY | None |
| Forgot password | PARTIAL — hook exists, no route page | YES — `/api/auth/forgot-password` | READY | Route page pending |
| Reset password | PARTIAL — hook exists, no route page | YES — `/api/auth/reset-password` | READY | Route page pending |
| Google Login | YES — useGoogleLogin hook + API service | YES — `/api/auth/google` | READY | Route page pending |
| Dashboard shell | YES — DashboardLayout.tsx | N/A (UI only) | READY | None |
| Sidebar navigation | YES — config-driven (Dashboard, Profile) | N/A (frontend config) | READY | None |
| Theme system | YES — ThemeToggle, uiSlice | N/A | READY | None |
| Loading/Error/Empty states | YES — all state components | N/A | READY | None |
| DataTable | YES — component exists (untracked) | N/A | READY | None |
| ConfirmDialog | YES — component exists (untracked) | N/A | READY | None |
| Classes | NO | NO — `/api/classes` | **BLOCKED** | Backend Class API |
| Courses | NO | NO — `/api/courses` | **BLOCKED** | Backend Course API |
| Assignments | NO | NO — `/api/assignments` | **BLOCKED** | Backend Assignment API |
| Grades | NO | NO — `/api/grades` | **BLOCKED** | Backend Grade API |
| Attendance | NO | NO — `/api/attendance` | **BLOCKED** | Backend Attendance API |
| Timetable | NO | NO — `/api/timetable` | **BLOCKED** | Backend Timetable API |
| Announcements | NO | NO — `/api/announcements` | **BLOCKED** | Backend Announcement API |
| Notifications | NO | NO — `/api/notifications` | **BLOCKED** | Backend Notification API |
| Admin panel | NO | NO — `/api/admin/*` routes | **BLOCKED** | Backend Admin routes |
| Analytics/dashboard data | Partial (stub dashboard page) | NO — `/api/analytics` | **BLOCKED** | Backend Analytics API |

---

## 8. Authentication Architecture Verification

| Item | Status | Details |
|------|--------|---------|
| **AuthContext** | EXISTS & ACTIVE | `frontend/src/features/auth/contexts/AuthContext.tsx` — provides `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `refreshUser()`. On mount calls `GET /api/auth/profile`. |
| **useAuth** | EXISTS & ACTIVE | `frontend/src/hooks/useAuth.ts` — reads Redux `authSlice` state, exposes `logout` mutation |
| **authSlice.ts** | EXISTS & ACTIVE | `frontend/src/store/slices/authSlice.ts` (53 lines) — Redux slice with `setAuthenticated`, `setUnauthenticated`, `clearAuth` actions. **Imported by AuthContext, useAuth, interceptors, useProfile, useLogout, useGoogleLogin, rootReducer, slices/index** |
| **Redux auth state** | ACTIVE | AuthContext dispatches to `authSlice` — auth state lives in Redux, not pure Context |
| **Redux UI state** | ACTIVE | `uiSlice.ts` — sidebar collapsed, theme mode (light/dark/system) |
| **Is any change required?** | NO | The architecture is functional and verified (tsc + build pass). The deviation from ARCHITECTURE.md Section J is pre-existing and working. No changes needed. |

**Key finding**: ARCHITECTURE.md Section J states auth state should be in React Context only and "No Redux auth state." The **actual implementation** uses Redux `authSlice` as the auth state store, consumed by AuthContext. This is a working, tested pattern. No modification or fix is required — this is noted for documentation accuracy only.

---

## 9. Routing & Navigation Audit

### Existing frontend routes

| Route | File | Protected? |
|-------|------|------------|
| `/` | `src/app/page.tsx` | No (redirects to dashboard if authenticated — verified in build) |
| `/login` | `src/app/(auth)/login/page.tsx` | No (public auth route) |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Yes |
| `/dashboard/profile` | `src/app/(dashboard)/profile/page.tsx` | Yes |
| `/dashboard/profile/edit` | `src/app/(dashboard)/profile/edit/page.tsx` | Yes |
| `/dashboard/profile/change-password` | `src/app/(dashboard)/profile/change-password/page.tsx` | Yes |

### Existing navigation config

From `src/config/navigation/navigation.ts`:
```typescript
[
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: [ADMIN, TEACHER, STUDENT, PARENT] },
  { key: 'profile', label: 'Profile', path: '/dashboard/profile', icon: 'user', roles: [ADMIN, TEACHER, STUDENT, PARENT] },
]
```
- Only **Dashboard** and **Profile** navigation items exist.
- All 4 roles have access to both.

### Planned routes (per ARCHITECTURE.md Section D + navigation table)

| Planned route | Navigation item | Role requirement | Frontend route exists? | Backend API exists? |
|---------------|----------------|------------------|------------------------|---------------------|
| `/dashboard` | Dashboard | All roles | YES | N/A (UI only) |
| `/dashboard/profile` | Profile | All roles | YES | YES (`/api/auth/profile`) |
| `/dashboard/classes` | Classes | Teacher, Student (implied) | NO | NO — `/api/classes` missing |
| `/dashboard/courses` | Courses | Teacher, Student (implied) | NO | NO — `/api/courses` missing |
| `/dashboard/assignments` | Assignments | Teacher, Student (implied) | NO | NO — `/api/assignments` missing |
| `/dashboard/grades` | Grades | Teacher, Student (implied) | NO | NO — `/api/grades` missing |
| `/dashboard/attendance` | Attendance | Teacher, Student (implied) | NO | NO — `/api/attendance` missing |
| `/dashboard/timetable` | Timetable | All (implied) | NO | NO — `/api/timetable` missing |
| `/dashboard/announcements` | Announcements | All (implied) | NO | NO — `/api/announcements` missing |
| `/dashboard/notifications` | Notifications | All (implied) | NO | NO — `/api/notifications` missing |
| `/dashboard/admin/*` | Admin features | ADMIN only | NO | NO — `/api/admin/*` missing (middleware exists) |
| `/dashboard/analytics` | Analytics | Teacher, Admin (implied) | NO | NO — `/api/analytics` missing |

### Role-based navigation visibility rules (planned)

Per ARCHITECTURE.md Section D Table:
- **ADMIN**: All pages
- **TEACHER**: Dashboard, classes, assignments, grades, attendance
- **STUDENT**: Dashboard, my classes, assignments, results
- **PARENT**: Dashboard, children overview, reports

---

## 10. Data Layer Audit

### Axios architecture (verified)
- **Client**: `src/lib/axios/client.ts` — `axios.create` with `baseURL`, `timeout: 10000`, `withCredentials: true`, `Content-Type: application/json`
- **Interceptors**: `src/lib/axios/interceptors.ts` — request interceptor (passthrough), response interceptor (401→refresh→retry with `_retry` flag)
- **Refresh**: `src/lib/axios/refresh.ts` — module-level refresh lock (`refreshPromise`), `getOrCreateRefreshPromise`, `hasRefreshFailureBeenNotified`, `markRefreshFailureNotified`, `resetRefreshLock`
- **No-refresh paths**: `/api/auth/refresh`, `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/google`

### API service architecture (verified)
- `src/services/api/index.ts` — re-exports `./auth`
- `src/services/api/auth/index.ts` — all auth API functions (login, register, logout, refresh, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, googleLogin, getAuthErrorMessage)
- `src/services/api/auth/types.ts` — request/response type interfaces mirroring backend Zod schemas

### Hook architecture (verified)
- `src/hooks/useMutation.ts` — generic mutation hook with `execute`, `isLoading`, `isError`, `isSuccess`, `error`
- `src/hooks/useNotification.ts` — notification helper (wrapper around antd `message`)
- `src/hooks/storeHooks.ts` — `useAppDispatch`, `useAppSelector` typed hooks
- `src/hooks/auth/*.ts` — auth-specific hooks: `useLogin`, `useLogout`, `useRegister`, `useForgotPassword`, `useResetPassword`, `useUpdateProfile`, `useChangePassword`, `useGoogleLogin`, `useProfile`

### Error handling (verified)
- Axios interceptor catches 401 → triggers refresh flow
- `setUnauthenticated()` dispatched once on refresh failure (via `hasRefreshFailureBeenNotified` flag)
- Auth API service includes `getAuthErrorMessage()` to extract backend error messages

### Refresh flow (verified)
1. API request returns 401
2. Interceptor checks `_retry` flag (prevents infinite loops)
3. Interceptor checks `NO_REFRESH_PATHS` (excludes refresh/login/register/etc.)
4. If eligible: calls `getOrCreateRefreshPromise(client)` — shares single refresh call across concurrent 401s
5. On success: retries original request
6. On failure: dispatches `setUnauthenticated()` once, rejects with error

### Authentication credentials (verified)
- `withCredentials: true` on Axios instance
- No `Authorization` header set
- Cookies managed entirely by browser (httpOnly, sameSite=strict)
- Frontend reads auth state via `GET /api/auth/profile` only

---

## 11. LMS Feature Domain Planning

The domains below are derived from the ARCHITECTURE.md Section D visibility table and standard LMS requirements. None are currently implemented in the backend.

### Canonical feature domains (15 total)

The following 15 domains are the **canonical** feature-domain list for the LearnSphere LMLS. They are listed here for reference and used consistently throughout this document. Where domains are grouped for implementation purposes in the phase plan (Section 22), each phase will explicitly map its domains back to this canonical list.

1. **User Management**
2. **Classes**
3. **Courses**
4. **Subjects**
5. **Enrollment**
6. **Assignments**
7. **Submissions**
8. **Exams**
9. **Attendance**
10. **Grades & Results**
11. **Timetable**
12. **Announcements**
13. **Notifications**
14. **Analytics**
15. **Settings**

> Note: "Assignment Management" and "Submissions" are treated as separate canonical domains (6 and 7 respectively). In some implementation phases they may be grouped, but they remain distinct canonical domains. Likewise, "Exams" (Domain 8) is separate from "Assignments" (Domain 6) and "Submissions" (Domain 7).

### Proposed domains

#### 1. User Management (Canonical Domain #1)
- **Purpose**: Admin-level user administration (create, read, update, delete, assign roles)
- **Main entities**: User (existing model — see PROPOSED extensions below)
- **Main operations**: List users (paginated), get user, update user (role, active status), delete/deactivate user
- **Actors/roles**: Admin (full CRUD), Teacher/Student/Parent (self only)
- **Dependencies**: Auth domain (user identity), RBAC
- **Frontend dependency**: Admin panel routes (not yet created)
- **Priority**: High
- **Implementation complexity**: Medium (needs pagination, filtering, ownership checks)

#### 2. Classes (Canonical Domain #2)
- **Purpose**: Organize students and teachers into classes/sections
- **Main entities**: Class (name, description, grade level, year, teacher assignment, student roster)
- **Main operations**: Create class, list classes (by role), get class detail, add/remove students, assign teacher, update class, delete class
- **Actors/roles**: Admin (manage all), Teacher (teach/manage assigned classes), Student (view own classes), Parent (view children's classes)
- **Dependencies**: User Management (teacher/student references)
- **Frontend dependency**: `/dashboard/classes` route, navigation entry
- **Priority**: High
- **Implementation complexity**: Medium-high (many-to-many relationships)

#### 3. Courses (Canonical Domain #3)
- **Purpose**: Define curriculum/courses that can be assigned to classes
- **Main entities**: Course (title, description, code, credits, subjects/skills covered)
- **Main operations**: Create course, list courses, get course, update course, delete course, assign to class
- **Actors/roles**: Admin (manage), Teacher (teach assigned courses), Student (view enrolled), Parent (view children's enrollments)
- **Dependencies**: User Management, Class Management
- **Frontend dependency**: `/dashboard/courses` route
- **Priority**: High
- **Implementation complexity**: Medium

#### 4. Subjects (Canonical Domain #4)
- **Purpose**: Define subjects (Math, Science, English, etc.) — referenced by courses
- **Main entities**: Subject (name, code, description, color, icon)
- **Main operations**: CRUD subjects, list subjects
- **Actors/roles**: Admin (manage), Teacher (view assigned subjects)
- **Dependencies**: None (standalone reference data)
- **Frontend dependency**: Course creation/editing (subject selection)
- **Priority**: Medium
- **Implementation complexity**: Low

#### 5. Enrollment (Canonical Domain #5)
- **Purpose**: Link students to classes/courses
- **Main entities**: Enrollment (student, class/course, enrollment date, status)
- **Main operations**: Enroll student, unenroll, list enrollments, change status
- **Actors/roles**: Admin/Teacher (enroll), Student (view own), Parent (view children's)
- **Dependencies**: User, Classes, Courses
- **Frontend dependency**: Class detail pages, course enrollment UI
- **Priority**: High
- **Implementation complexity**: Medium

#### 6. Assignments (Canonical Domain #6)
- **Purpose**: Create, distribute, collect assignments
- **Main entities**: Assignment (title, description, course/class, due date, attachments, max points, submission type)
- **Main operations**: Create assignment, list assignments, get assignment, update, delete, publish/unpublish
- **Actors/roles**: Admin/Teacher (create/update/delete/publish), Student (view/submit), Parent (view)
- **Dependencies**: User, Classes, Courses, Enrollment
- **Frontend dependency**: `/dashboard/assignments` route
- **Priority**: High
- **Implementation complexity**: Medium-high (file uploads, publishing)

#### 7. Submissions (Canonical Domain #7)
- **Purpose**: Student assignment submissions and teacher viewing/grading
- **Main entities**: Submission (assignment, student, content, attachments, submittedAt, status)
- **Main operations**: Submit assignment, view own submission, list class submissions, get specific submission
- **Actors/roles**: Student (submit/view own), Teacher (view all submissions in class), Admin (view all)
- **Dependencies**: Assignments, Enrollment
- **Frontend dependency**: Assignment submission UI, submission list for teachers
- **Priority**: High
- **Implementation complexity**: Medium-high (file uploads, status tracking)

#### 8. Exams (Canonical Domain #8)
- **Purpose**: Schedule and manage exams/assessments
- **Main entities**: Exam (title, description, course/class, scheduled date, duration, max marks)
- **Main operations**: Create exam, list exams, get exam, update, delete, publish/unpublish
- **Actors/roles**: Admin/Teacher (create/publish), Student (view), Parent (view results)
- **Dependencies**: Courses, Classes, Assignment infrastructure
- **Frontend dependency**: `/dashboard/exams` route (implied by Grades)
- **Priority**: Medium
- **Implementation complexity**: High

#### 9. Attendance (Canonical Domain #9)
- **Purpose**: Track student attendance for classes/sessions
- **Main entities**: Attendance (class/session date, course, student attendance records)
- **Main operations**: Mark attendance, list attendance, get student attendance, get class attendance summary
- **Actors/roles**: Admin/Teacher (mark/view), Student (view own), Parent (view children's)
- **Dependencies**: Class, Course, Enrollment
- **Frontend dependency**: `/dashboard/attendance` route
- **Priority**: High
- **Implementation complexity**: Medium

#### 10. Grades & Results (Canonical Domain #10)
- **Purpose**: Record and report grades for assignments and exams
- **Main entities**: Grade (student, assignment/exam, points/score, feedback, grader, date)
- **Main operations**: Record grade, list grades, get student grades, get class grade book, export grades
- **Actors/roles**: Admin/Teacher (record/view all), Student (view own), Parent (view children's)
- **Dependencies**: Assignment, Exam/Assessment, Enrollment
- **Frontend dependency**: `/dashboard/grades` or `/dashboard/results` route
- **Priority**: High
- **Implementation complexity**: Medium-high (gradebook logic, aggregations)

#### 11. Timetable (Canonical Domain #11)
- **Purpose**: Define and display class schedules
- **Main entities**: Timetable (class/course, day/time, room, teacher, recurrence)
- **Main operations**: Create schedule, list by class/teacher/student, update, delete
- **Actors/roles**: Admin (manage), Teacher (view own schedules), Student (view enrolled), Parent (view children's)
- **Dependencies**: Classes, Courses, User
- **Frontend dependency**: `/dashboard/timetable` route (implied by navigation)
- **Priority**: Medium
- **Implementation complexity**: Medium

#### 12. Announcements (Canonical Domain #12)
- **Purpose**: Broadcast messages to users by role/class/course
- **Main entities**: Announcement (title, content, target scope, author, publish date)
- **Main operations**: Create announcement, list announcements, read announcement, target filtering
- **Actors/roles**: Admin/Teacher (create), all users (read)
- **Dependencies**: User (author/targeting), Class/Course (optional targeting)
- **Frontend dependency**: None explicitly in navigation config yet
- **Priority**: Low-Medium
- **Implementation complexity**: Medium

#### 13. Notifications (Canonical Domain #13)
- **Purpose**: In-app and email notifications for events (assignment due, grade posted, etc.)
- **Main entities**: Notification (user, type, content, read status, link, timestamp)
- **Main operations**: Create notification, list notifications, mark read, delete
- **Actors/roles**: System-triggered (all users as recipients)
- **Dependencies**: User, Assignment, Grade, Attendance
- **Frontend dependency**: Header notification dropdown (not yet built)
- **Priority**: Low
- **Implementation complexity**: Medium

#### Admin Panel (cross-cutting concern — mapped across Canonical Domains #1, #14)
- **Purpose**: Centralized admin management spanning User Management and Analytics domains
- **Main functionality**: Admin-only operations across domains (user management via Domain #1, dashboard analytics via Domain #14)
- **Main functionality**: Admin-only user management endpoints (`/api/admin/users`) and admin dashboard analytics — spans User Management and Analytics domains
- **Actors/roles**: Admin only
- **Dependencies**: All domains
- **Frontend dependency**: `/dashboard/admin/*` routes
- **Priority**: Medium-High
- **Implementation complexity**: High (orchestration layer)

#### 14. Analytics (Canonical Domain #14)
- **Purpose**: Aggregate metrics for dashboard widgets
- **Main operations**: Get enrollment stats, grade distributions, attendance summaries, user counts
- **Actors/roles**: Admin (full), Teacher (own classes), Student (own data), Parent (children's data)
- **Dependencies**: All data domains
- **Frontend dependency**: `/dashboard` overview page (currently a stub showing welcome message)
- **Priority**: Medium
- **Implementation complexity**: Medium-high (aggregation pipelines)

#### 15. Settings (Canonical Domain #15)
- **Purpose**: System and user preferences
- **Main operations**: Get/update system settings (admin), get/update user settings (self)
- **Actors/roles**: Admin (system), User (own)
- **Dependencies**: User (for user settings)
- **Frontend dependency**: Not yet in navigation
- **Priority**: Low
- **Implementation complexity**: Low-Medium

---

## 12. Proposed Data Model Plan

> All entities below are **PROPOSED**. None exist in the current backend.

### PROPOSED Entity: Class
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String (required) | Class name (e.g., "Grade 5A") |
| `description` | String | Optional description |
| `gradeLevel` | String | e.g., "5", "6", "7th Grade" |
| `academicYear` | String | e.g., "2025-2026" |
| `teacherId` | ObjectId → User | Assigned teacher (role: TEACHER) |
| `studentIds` | [ObjectId → User] | Enrolled students (role: STUDENT) |
| `courseId` | ObjectId → Course | Assigned course/curriculum |
| `isActive` | Boolean (default: true) | Soft-delete flag |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ teacherId: 1 }`, `{ "studentIds": 1 }` (for queries by student), compound `{ academicYear: 1, gradeLevel: 1 }`

**Audit**: History of student adds/removes (optional)

### PROPOSED Entity: Course
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String (required) | Course name (e.g., "Mathematics") |
| `code` | String (unique) | Short code (e.g., "MATH101") |
| `description` | String | Course description |
| `subjectId` | ObjectId → Subject | Subject category |
| `credits` | Number | Credit value |
| `createdBy` | ObjectId → User | Creating teacher/admin |
| `isActive` | Boolean (default: true) | Soft-delete flag |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ code: 1 }` (unique), `{ subjectId: 1 }`, `{ createdBy: 1 }`

### PROPOSED Entity: Subject
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String (required, unique) | Subject name (e.g., "Mathematics") |
| `code` | String (unique) | Short code (e.g., "MATH") |
| `description` | String | Optional |
| `color` | String | UI color code |
| `icon` | String | UI icon name |
| `createdBy` | ObjectId → User | Admin who created |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ name: 1 }` (unique), `{ code: 1 }` (unique)

### PROPOSED Entity: Enrollment
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `studentId` | ObjectId → User (required) | Enrolled student |
| `classId` | ObjectId → Class (required) | Enrolled class |
| `courseId` | ObjectId → Course (required) | Enrolled course |
| `status` | String (enum: ACTIVE, DROPPED, COMPLETED, default: ACTIVE) | Enrollment status |
| `enrolledAt` | Date | Enrollment date |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: compound `{ studentId: 1, classId: 1 }` (unique), `{ studentId: 1 }`, `{ classId: 1 }`, `{ status: 1 }`

### PROPOSED Entity: Assignment
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `title` | String (required) | Assignment title |
| `description` | String | Assignment description |
| `classId` | ObjectId → Class (required) | Assigned class |
| `courseId` | ObjectId → Course (required) | Assigned course |
| `dueDate` | Date (required) | Submission deadline |
| `maxPoints` | Number | Maximum score |
| `attachments` | [String] | File URLs |
| `submissionType` | String (enum: FILE, TEXT, LINK, QUIZ) | How students submit |
| `allowLateSubmissions` | Boolean (default: false) | Whether late submissions accepted |
| `latePenaltyPercent` | Number (default: 0) | Penalty per day/hours |
| `createdBy` | ObjectId → User (required) | Teacher/admin who created |
| `published` | Boolean (default: false) | Visibility flag |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ classId: 1 }`, `{ courseId: 1 }`, `{ dueDate: 1 }`, `{ createdBy: 1 }`, `{ published: 1 }`

### PROPOSED Entity: Submission
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `assignmentId` | ObjectId → Assignment (required) | Parent assignment |
| `studentId` | ObjectId → User (required) | Submitting student |
| `content` | String | Text/file URL/link content |
| `attachments` | [String] | File URLs |
| `submittedAt` | Date | Submission timestamp |
| `status` | String (enum: DRAFT, SUBMITTED, LATE, MISSING) | Submission status |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: compound `{ assignmentId: 1, studentId: 1 }` (unique), `{ studentId: 1 }`, `{ status: 1 }`

### PROPOSED Entity: Grade
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `studentId` | ObjectId → User (required) | Graded student |
| `assignmentId` | ObjectId → Assignment | Source assignment (nullable if from exam) |
| `examId` | ObjectId → Exam | Source exam (nullable if from assignment) |
| `gradedBy` | ObjectId → User (required) | Teacher/admin who graded |
| `score` | Number (required) | Numerical score |
| `maxPoints` | Number (required) | Maximum possible |
| `percentage` | Number (calculated) | `score / maxPoints * 100` |
| `feedback` | String | Graded feedback |
| `gradedAt` | Date | When graded |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: compound `{ studentId: 1, assignmentId: 1 }` (unique), compound `{ studentId: 1, examId: 1 }` (unique), `{ studentId: 1 }`, `{ gradedBy: 1 }`

### PROPOSED Entity: Exam
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `title` | String (required) | Exam name |
| `description` | String | Description |
| `classId` | ObjectId → Class (required) | Target class |
| `courseId` | ObjectId → Course (required) | Target course |
| `scheduledAt` | Date | Exam date/time |
| `durationMinutes` | Number | Duration |
| `maxPoints` | Number | Maximum score |
| `timezone` | String | Timezone (e.g., "Asia/Kolkata") |
| `createdBy` | ObjectId → User (required) | Creator |
| `published` | Boolean (default: false) | Visibility |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ classId: 1 }`, `{ courseId: 1 }`, `{ scheduledAt: 1 }`, `{ createdBy: 1 }`

### PROPOSED Entity: Attendance
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `classId` | ObjectId → Class (required) | Target class |
| `courseId` | ObjectId → Course (required) | Target course |
| `date` | Date (required) | Attendance session date |
| `records` | [{ studentId, status, recordedBy, recordedAt }] | Sub-document array |
| `createdBy` | ObjectId → User (required) | Teacher who created |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: compound `{ classId: 1, date: 1 }` (unique), `{ courseId: 1 }`, `{ date: 1 }`

**Status enum**: PRESENT, ABSENT, LATE, EXCUSED

### PROPOSED Entity: Timetable
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `classId` | ObjectId → Class (required) | Target class |
| `courseId` | ObjectId → Course | Associated course (nullable) |
| `dayOfWeek` | Number (0-6) | Day (0=Sunday) |
| `startTime` | String | e.g., "09:00" |
| `endTime` | String | e.g., "10:30" |
| `room` | String | Room/location |
| `teacherId` | ObjectId → User | Assigned teacher |
| `recurrence` | String (enum: WEEKLY, CUSTOM) | Recurrence pattern |
| `effectiveFrom` | Date | When schedule starts |
| `effectiveTo` | Date (nullable) | When schedule ends |
| `createdBy` | ObjectId → User (required) | Creator |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ classId: 1, dayOfWeek: 1 }`, `{ teacherId: 1 }`, `{ courseId: 1 }`

### PROPOSED Entity: Announcement
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `title` | String (required) | Announcement title |
| `content` | String (required) | Body text |
| `targetType` | String (enum: ALL, ROLE, CLASS, COURSE, USER) | Targeting scope |
| `targetId` | ObjectId | Target reference (role/class/course/user) |
| `expiresAt` | Date (nullable) | Expiry timestamp |
| `isPinned` | Boolean (default: false) | Sticky announcement |
| `createdBy` | ObjectId → User (required) | Author |
| `createdAt` / `updatedAt` | Date | Timestamps |

**Indexes**: `{ targetType: 1, targetId: 1 }`, `{ createdBy: 1 }`, `{ isPinned: 1, createdAt: -1 }`, `{ expiresAt: 1 }`

### PROPOSED Entity: Notification
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId → User (required) | Recipient |
| `type` | String (enum: ASSIGNMENT_DUE, GRADE_POSTED, ANNOUNCEMENT, SYSTEM) | Notification type |
| `title` | String (required) | Title |
| `content` | String | Body text |
| `link` | String (nullable) | URL to navigate to |
| `isRead` | Boolean (default: false) | Read status |
| `readAt` | Date (nullable) | When read |
| `createdAt` | Date | Timestamp |

**Indexes**: `{ userId: 1, isRead: 1, createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`, `{ type: 1 }`, `{ isRead: 1 }`

### PROPOSED Entity: Setting
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `key` | String (unique) | Setting key |
| `value` | Mixed | Setting value |
| `scope` | String (enum: SYSTEM, USER) | Scope |
| `userId` | ObjectId → User (nullable) | User-scoped setting |
| `updatedBy` | ObjectId → User | Last updater |
| `updatedAt` | Date | Last update |

**Indexes**: `{ key: 1, userId: 1 }` (unique compound), `{ scope: 1 }`

### Entity relationship diagram (conceptual)

```
User
  │ (has)
  ├── role: ADMIN | TEACHER | STUDENT | PARENT
  │
  │ (teaches)
  └──→ Class.teacherId

User
  │ (enrolled in)
  └──→ Enrollment.studentId

User
  │ (submits)
  └──→ Submission.studentId

User
  │ (graded by)
  └──→ Grade.gradedBy

User
  │ (creates)
  ├──→ Class.createdBy (via User)
  ├──→ Course.createdBy
  ├──→ Assignment.createdBy
  ├──→ Exam.createdBy
  ├──→ Attendance.createdBy
  ├──→ Announcement.createdBy
  └──→ Setting.updatedBy

Class
  │ (has many)
  ├── studentIds → User (many)
  ├── courseId → Course (many-to-one)
  └──→ Enrollment, Assignment, Exam, Attendance, Timetable (one-to-many)

Course
  │ (has)
  ├── subjectId → Subject (many-to-one)
  └──→ Enrollment, Assignment, Exam, Grade, Timetable (one-to-many)

Assignment
  │ (has)
  ├── classId → Class
  ├── courseId → Course
  └──→ Submission, Grade (one-to-many)

Exam
  │ (has)
  ├── classId → Class
  └── courseId → Course
      └──→ Grade (one-to-many)

Subject
  │ (categorized by)
  └──→ Course (one-to-many)
```

---

## 13. Proposed API Capability Plan

### PROPOSED API Domain 1: Class Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/classes` | List classes (filterable by role/teacher/student) | Required | All authenticated | PROPOSED |
| GET | `/api/classes/:id` | Get class detail (with students, teacher, course) | Required | Admin, Teacher (own/assigned), Student (enrolled), Parent (children enrolled) | PROPOSED |
| POST | `/api/classes` | Create class | Required | Admin, Teacher | PROPOSED |
| PUT | `/api/classes/:id` | Update class | Required | Admin, Teacher (own), | PROPOSED |
| DELETE | `/api/classes/:id` | Delete (soft) class | Required | Admin, Teacher (own) | PROPOSED |
| POST | `/api/classes/:id/students` | Add student to class | Required | Admin, Teacher | PROPOSED |
| DELETE | `/api/classes/:id/students/:studentId` | Remove student from class | Required | Admin, Teacher | PROPOSED |
| GET | `/api/classes/:id/students` | List students in class | Required | Admin, Teacher (own), Parent (children in class) | PROPOSED |

**Request body for POST/PUT**:
```json
{
  "name": "string (required)",
  "description": "string",
  "gradeLevel": "string",
  "academicYear": "string",
  "courseId": "string (ObjectId, required)",
  "teacherId": "string (ObjectId, required for creation)",
  "studentIds": ["string (ObjectId)[]"]
}
```

**Response shape**:
```json
{
  "success": true,
  "message": "Class fetched",
  "data": {
    "id": "<mongo_id>",
    "name": "...",
    "description": "...",
    "gradeLevel": "...",
    "academicYear": "...",
    "courseId": "<course_id>",
    "teacherId": "<teacher_id>",
    "studentIds": ["<student_id>", "..."],
    "isActive": true,
    "createdAt": "ISO",
    "updatedAt": "ISO"
  },
  "errors": [],
  "timestamp": "ISO"
}
```

**Query parameters**: `page`, `limit`, `gradeLevel`, `academicYear`, `teacherId`, `studentId`, `search`, `sort`

---

### PROPOSED API Domain 2: Course Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/courses` | List courses | Required | All authenticated | PROPOSED |
| GET | `/api/courses/:id` | Get course detail | Required | All authenticated | PROPOSED |
| POST | `/api/courses` | Create course | Required | Admin, Teacher | PROPOSED |
| PUT | `/api/courses/:id` | Update course | Required | Admin, Teacher (own) | PROPOSED |
| DELETE | `/api/courses/:id` | Delete course | Required | Admin, Teacher (own) | PROPOSED |
| GET | `/api/courses/:id/classes` | List classes using this course | Required | Admin, Teacher | PROPOSED |

**Request body**:
```json
{
  "name": "string (required)",
  "code": "string (unique)",
  "description": "string",
  "subjectId": "string (ObjectId)",
  "credits": "number",
  "createdBy": "string (auto-filled from JWT)"
}
```

**Query parameters**: `page`, `limit`, `subjectId`, `search`, `sort`

---

### PROPOSED API Domain 3: Subject Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/subjects` | List subjects | Required | All authenticated | PROPOSED |
| GET | `/api/subjects/:id` | Get subject | Required | All authenticated | PROPOSED |
| POST | `/api/subjects` | Create subject | Required | Admin | PROPOSED |
| PUT | `/api/subjects/:id` | Update subject | Required | Admin | PROPOSED |
| DELETE | `/api/subjects/:id` | Delete subject | Required | Admin | PROPOSED |

**Request body**:
```json
{
  "name": "string (required, unique)",
  "code": "string (unique)",
  "description": "string",
  "color": "string",
  "icon": "string"
}
```

---

### PROPOSED API Domain 4: Enrollment

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| POST | `/api/enrollments` | Enroll student in class | Required | Admin, Teacher | PROPOSED |
| DELETE | `/api/enrollments/:id` | Unenroll student | Required | Admin, Teacher | PROPOSED |
| GET | `/api/enrollments/student/:studentId` | Get student's enrollments | Required | Student (own), Parent (children), Admin, Teacher | PROPOSED |
| GET | `/api/enrollments/class/:classId` | Get class enrollments | Required | Admin, Teacher, Parent (children in class) | PROPOSED |
| PUT | `/api/enrollments/:id/status` | Change enrollment status | Required | Admin, Teacher | PROPOSED |

**Request body (POST)**:
```json
{
  "studentId": "string (ObjectId, required)",
  "classId": "string (ObjectId, required)",
  "courseId": "string (ObjectId, required)",
  "status": "ACTIVE"
}
```

---

### PROPOSED API Domain 5: Assignment Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/assignments` | List assignments (filterable) | Required | All authenticated | PROPOSED |
| GET | `/api/assignments/:id` | Get assignment detail | Required | Class/course members | PROPOSED |
| POST | `/api/assignments` | Create assignment | Required | Admin, Teacher | PROPOSED |
| PUT | `/api/assignments/:id` | Update assignment | Required | Admin, Teacher (own) | PROPOSED |
| DELETE | `/api/assignments/:id` | Delete assignment | Required | Admin, Teacher (own) | PROPOSED |
| POST | `/api/assignments/:id/submit` | Submit assignment | Required | Student (enrolled) | PROPOSED |
| GET | `/api/assignments/:id/submissions` | List submissions | Required | Admin, Teacher | PROPOSED |
| GET | `/api/submissions/:id` | Get specific submission | Required | Student (own), Teacher, Admin | PROPOSED |
| PUT | `/api/assignments/:id/publish` | Toggle publish status | Required | Admin, Teacher | PROPOSED |

**Request body (POST assignment)**:
```json
{
  "title": "string (required)",
  "description": "string",
  "classId": "string (ObjectId, required)",
  "courseId": "string (ObjectId, required)",
  "dueDate": "string (ISO date, required)",
  "maxPoints": "number",
  "attachments": ["string (URLs)"],
  "submissionType": "FILE | TEXT | LINK | QUIZ",
  "allowLateSubmissions": false,
  "latePenaltyPercent": 0
}
```

**Query parameters**: `page`, `limit`, `classId`, `courseId`, `published`, `dueAfter`, `dueBefore`, `search`, `sort`

---

### PROPOSED API Domain 6: Exam / Assessment Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/exams` | List exams | Required | All authenticated | PROPOSED |
| GET | `/api/exams/:id` | Get exam detail | Required | Class/course members | PROPOSED |
| POST | `/api/exams` | Create exam | Required | Admin, Teacher | PROPOSED |
| PUT | `/api/exams/:id` | Update exam | Required | Admin, Teacher (own) | PROPOSED |
| DELETE | `/api/exams/:id` | Delete exam | Required | Admin, Teacher (own) | PROPOSED |
| POST | `/api/exams/:id/publish` | Toggle publish status | Required | Admin, Teacher | PROPOSED |

**Request body**:
```json
{
  "title": "string (required)",
  "description": "string",
  "classId": "string (ObjectId, required)",
  "courseId": "string (ObjectId, required)",
  "scheduledAt": "string (ISO date, required)",
  "durationMinutes": "number",
  "maxPoints": "number"
}
```

---

### PROPOSED API Domain 7: Attendance

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| POST | `/api/attendance` | Record attendance | Required | Admin, Teacher | PROPOSED |
| GET | `/api/attendance/class/:classId` | List attendance for class | Required | Admin, Teacher, Parent (children), Student (own) | PROPOSED |
| GET | `/api/attendance/student/:studentId` | Get student's attendance | Required | Student (own), Parent (children), Admin, Teacher | PROPOSED |
| GET | `/api/attendance/:id` | Get attendance session | Required | Admin, Teacher | PROPOSED |
| PUT | `/api/attendance/:id` | Update attendance | Required | Admin, Teacher | PROPOSED |

**Request body (POST)**:
```json
{
  "classId": "string (ObjectId, required)",
  "courseId": "string (ObjectId, required)",
  "date": "string (ISO date, required)",
  "records": [
    {
      "studentId": "string (ObjectId, required)",
      "status": "PRESENT | ABSENT | LATE | EXCUSED"
    }
  ]
}
```

---

### PROPOSED API Domain 8: Grade / Result Management

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| POST | `/api/grades` | Create/update grade | Required | Admin, Teacher | PROPOSED |
| GET | `/api/grades/student/:studentId` | Get student's grades | Required | Student (own), Parent (children), Admin, Teacher | PROPOSED |
| GET | `/api/grades/class/:classId` | Get class gradebook | Required | Admin, Teacher | PROPOSED |
| GET | `/api/grades/:id` | Get grade | Required | Student (own), Teacher, Admin | PROPOSED |
| PUT | `/api/grades/:id` | Update grade | Required | Admin, Teacher | PROPOSED |
| DELETE | `/api/grades/:id` | Delete grade | Required | Admin, Teacher | PROPOSED |
| GET | `/api/results/student/:studentId` | Get student's report card | Required | Student (own), Parent (children), Admin, Teacher | PROPOSED |

**Request body (POST/PUT)**:
```json
{
  "studentId": "string (ObjectId, required)",
  "assignmentId": "string (ObjectId, nullable)",
  "examId": "string (ObjectId, nullable)",
  "score": "number (required)",
  "maxPoints": "number (required)",
  "feedback": "string"
}
```

**Query parameters**: `page`, `limit`, `subjectId`, `courseId`, `classId`, `minDate`, `maxDate`, `search`, `sort`

---

### PROPOSED API Domain 9: Timetable / Schedule

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| POST | `/api/timetable` | Create schedule | Required | Admin, Teacher | PROPOSED |
| GET | `/api/timetable/class/:classId` | Get class schedule | Required | Class members | PROPOSED |
| GET | `/api/timetable/teacher/:teacherId` | Get teacher's schedule | Required | Teacher (own), Admin | PROPOSED |
| GET | `/api/timetable/student/:studentId` | Get student's schedule | Required | Student (own), Parent (children), Admin | PROPOSED |
| GET | `/api/timetable/:id` | Get schedule entry | Required | Authenticated | PROPOSED |
| PUT | `/api/timetable/:id` | Update schedule | Required | Admin, Teacher (own) | PROPOSED |
| DELETE | `/api/timetable/:id` | Delete schedule | Required | Admin, Teacher (own) | PROPOSED |

**Request body**:
```json
{
  "classId": "string (ObjectId, required)",
  "courseId": "string (ObjectId)",
  "dayOfWeek": "number (0-6)",
  "startTime": "string",
  "endTime": "string",
  "room": "string",
  "teacherId": "string (ObjectId)",
  "recurrence": "WEEKLY | CUSTOM",
  "effectiveFrom": "string (ISO date)",
  "effectiveTo": "string (ISO date, nullable)"
}
```

---

### PROPOSED API Domain 10: Announcements

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| POST | `/api/announcements` | Create announcement | Required | Admin, Teacher | PROPOSED |
| GET | `/api/announcements` | List announcements (filtered by target) | Required | All authenticated | PROPOSED |
| GET | `/api/announcements/:id` | Get announcement | Required | All authenticated (if target includes user) | PROPOSED |
| PUT | `/api/announcements/:id` | Update announcement | Required | Admin, Teacher (own) | PROPOSED |
| DELETE | `/api/announcements/:id` | Delete announcement | Required | Admin, Teacher (own) | PROPOSED |

**Request body**:
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "targetType": "ALL | ROLE | CLASS | COURSE | USER",
  "targetId": "string (ObjectId, depends on targetType)",
  "expiresAt": "string (ISO date, nullable)",
  "isPinned": false
}
```

**Query parameters**: `page`, `limit`, `targetType`, `targetId`, `isPinned`, `search`, `sort`

---

### PROPOSED API Domain 11: Notifications

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/notifications` | List user's notifications | Required | All authenticated | PROPOSED |
| GET | `/api/notifications/:id` | Get notification | Required | Owner, Admin | PROPOSED |
| PUT | `/api/notifications/:id/read` | Mark as read | Required | Owner | PROPOSED |
| DELETE | `/api/notifications/:id` | Delete notification | Required | Owner | PROPOSED |
| POST | `/api/notifications/read-all` | Mark all as read | Required | All authenticated | PROPOSED |

**Query parameters**: `page`, `limit`, `isRead`, `type`, `sort`

---

### PROPOSED API Domain 12: Admin Panel

| Method | Endpoint | Purpose | Auth | Roles | Status |
|--------|----------|---------|------|-------|--------|
| GET | `/api/admin/users` | List all users (admin management) | Required | Admin | PROPOSED |
| GET | `/api/admin/users/:id` | Get user detail | Required | Admin | PROPOSED |
| PUT | `/api/admin/users/:id` | Update user (role, active status) | Required | Admin | PROPOSED |
| DELETE | `/api/admin/users/:id` | Delete user | Required | Admin | PROPOSED |
| GET | `/api/admin/dashboard` | Get admin dashboard analytics | Required | Admin | PROPOSED |
| GET | `/api/admin/settings` | Get system settings | Required | Admin | PROPOSED |
| PUT | `/api/admin/settings` | Update system settings | Required | Admin | PROPOSED |

---

## 14. Proposed RBAC & Authorization

### CURRENT RBAC (actual)

| Role | Value | Description |
|------|-------|-------------|
| ADMIN | "ADMIN" | Full system access |
| TEACHER | "TEACHER" | Teaches classes/courses |
| STUDENT | "STUDENT" | Enrolled in classes/courses (default role) |
| PARENT | "PARENT" | Parent of students |

| Scope | Protected routes | Admin-only |
|-------|-----------------|------------|
| Protected (any authenticated) | `/api/auth/change-password`, `/api/auth/profile` (GET/PUT), `/api/auth/logout` | No |
| Admin only | — | `/api/admin/*` (middleware check, but no route handlers exist) |
| Public | All other `/api/*` routes | No |

| Permission system | |
|-------------------|-|
| `permissions: string[]` field | EXISTS on User model but **NOT USED** in any auth flow |
| Permission codes | NOT IMPLEMENTED |

### PROPOSED RBAC

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access to all resources — CRUD on all entities, manage users, assign roles, system settings |
| **TEACHER** | Create/edit/delete own classes, courses, assignments, exams, attendance, grades → manage enrollments → view all students in own classes → access all timetable entries linked to taught classes |
| **STUDENT** | View own classes/courses, view assignments for enrolled classes, submit assignments, view own grades, view own attendance, view timetable |
| **PARENT** | View children's classes/courses, view children's assignments, view children's grades, view children's attendance, view children's timetable, view announcements |

#### Proposed permission codes (for future use)

| Resource | Permission | Admin | Teacher | Student | Parent |
|-----------|-----------|-------|---------|---------|--------|
| Classes | View | ✓ | ✓ (teaching) | ✓ (enrolled) | ✓ (children) |
| Classes | Create | ✓ | ✓ | ✗ | ✗ |
| Classes | Update | ✓ | ✓ (own) | ✗ | ✗ |
| Classes | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Classes | Add Student | ✓ | ✓ | ✗ | ✗ |
| Courses | View | ✓ | ✓ | ✓ | ✓ |
| Courses | Create | ✓ | ✓ | ✗ | ✗ |
| Courses | Update | ✓ | ✓ (own) | ✗ | ✗ |
| Courses | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Assignments | View | ✓ | ✓ | ✓ | ✓ |
| Assignments | Create | ✓ | ✓ | ✗ | ✗ |
| Assignments | Update | ✓ | ✓ (own) | ✗ | ✗ |
| Assignments | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Submissions | View | ✓ | ✓ | ✓ (own) | ✓ (children) |
| Submissions | Submit | ✓ | ✓ | ✓ (enrolled) | ✗ |
| Grades | View | ✓ | ✓ | ✓ (own) | ✓ (children) |
| Grades | Create/Update | ✓ | ✓ | ✗ | ✗ |
| Grades | Delete | ✓ | ✓ | ✗ | ✗ |
| Exams | View | ✓ | ✓ | ✓ | ✓ |
| Exams | Create | ✓ | ✓ | ✗ | ✗ |
| Exams | Update | ✓ | ✓ (own) | ✗ | ✗ |
| Exams | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Attendance | View | ✓ | ✓ | ✓ (own) | ✓ (children) |
| Attendance | Create/Update | ✓ | ✓ | ✗ | ✗ |
| Timetable | View | ✓ | ✓ | ✓ | ✓ |
| Timetable | Create/Update | ✓ | ✓ | ✗ | ✗ |
| Timetable | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Announcements | View | ✓ | ✓ | ✓ | ✓ |
| Announcements | Create | ✓ | ✓ | ✗ | ✗ |
| Announcements | Update | ✓ | ✓ (own) | ✗ | ✗ |
| Announcements | Delete | ✓ | ✓ (own) | ✗ | ✗ |
| Notifications | View | ✓ | ✓ | ✓ | ✓ |
| Notifications | Mark Read | ✓ | ✓ | ✓ | ✓ |
| Settings | View | ✓ | ✗ | ✗ | ✗ |
| Settings | Update | ✓ | ✗ | ✗ | ✗ |

#### Ownership rules (proposed)

| Resource | Ownership rule |
|----------|----------------|
| Class | Owned by `teacherId` — Teacher can only modify their own classes |
| Course | Owned by `createdBy` — Teacher can only modify their own courses |
| Assignment | Owned by `createdBy` — Teacher can only modify their own assignments |
| Exam | Owned by `createdBy` — Teacher can only modify their own exams |
| Attendance | Owned by `createdBy` (teacher) — Teacher can only modify their own records |
| Grade | Graded by `gradedBy` — Only the grader (or admin) can modify |
| Enrollment | Managed by Admin/Teacher |
| Timetable | Owned by `createdBy` (teacher) — Teacher can only modify their own schedules |
| Announcement | Owned by `createdBy` — Teacher can only modify their own announcements |
| Notification | Owned by `userId` (recipient) |
| Setting | Owned by `updatedBy` (admin) or `userId` (user-scoped) |

---

## 15. Missing Backend Capabilities

### Backend-only auth features (verified working)

| Capability | Status |
|------------|--------|
| User registration | IMPLEMENTED (`/api/auth/register`) |
| User login | IMPLEMENTED (`/api/auth/login`) |
| Token refresh with rotation | IMPLEMENTED (`/api/auth/refresh`) |
| User logout (cookie clear + DB revoke) | IMPLEMENTED (`/api/auth/logout`) |
| Profile fetch/update | IMPLEMENTED (`GET/PUT /api/auth/profile`) |
| Change password | IMPLEMENTED (`POST /api/auth/change-password`) |
| Forgot password (email stub) | IMPLEMENTED (`POST /api/auth/forgot-password`) |
| Reset password | IMPLEMENTED (`POST /api/auth/reset-password`) |
| Google OAuth login | IMPLEMENTED (`POST /api/auth/google`) |
| Account lockout (5 attempts / 15 min) | IMPLEMENTED |
| Token reuse detection | IMPLEMENTED |
| Rate limiting (100 req/min) | IMPLEMENTED |
| CORS in middleware | IMPLEMENTED |
| RBAC (role in JWT + middleware check) | IMPLEMENTED |
| Admin route protection | DEFINED (middleware) / NOT IMPLEMENTED (no route handlers) |

### Missing LMS backend capabilities (grouped)

| Group | Missing capabilities |
|-------|---------------------|
| **User Management** | Admin user CRUD endpoints (`/api/admin/users`), bulk user operations, role assignment API |
| **Classes** | All: `/api/classes` CRUD, student roster management, teacher assignment |
| **Courses** | All: `/api/courses` CRUD, subject association, credit tracking |
| **Subjects** | All: `/api/subjects` CRUD (reference data) |
| **Enrollment** | All: `/api/enrollments` (student↔class, student↔course linkage) |
| **Assignments** | All: `/api/assignments` CRUD, submission endpoints (`/api/submissions`), publish/toggle |
| **Exams** | All: `/api/exams` CRUD, scheduling |
| **Attendance** | All: `/api/attendance` record/view/update |
| **Grades** | All: `/api/grades` CRUD, gradebook, report card (`/api/results`) |
| **Timetable** | All: `/api/timetable` CRUD, schedule querying by role |
| **Announcements** | All: `/api/announcements` CRUD with targeting |
| **Notifications** | All: `/api/notifications` read/mark-read/delete |
| **Analytics** | All: `/api/analytics` aggregation endpoints |
| **Settings** | All: `/api/settings` system/user preferences |

### Missing database models

| Model | Status |
|-------|--------|
| `User` | IMPLEMENTED |
| `Class` | NOT IMPLEMENTED |
| `Course` | NOT IMPLEMENTED |
| `Subject` | NOT IMPLEMENTED |
| `Enrollment` | NOT IMPLEMENTED |
| `Assignment` | NOT IMPLEMENTED |
| `Submission` | NOT IMPLEMENTED |
| `Exam` | NOT IMPLEMENTED |
| `Attendance` | NOT IMPLEMENTED |
| `Grade` | NOT IMPLEMENTED |
| `Timetable` | NOT IMPLEMENTED |
| `Announcement` | NOT IMPLEMENTED |
| `Notification` | NOT IMPLEMENTED |
| `Setting` | NOT IMPLEMENTED |

### Missing backend layer components

| Component | Status |
|-----------|--------|
| API routes (feature domains) | NOT IMPLEMENTED (only `/api/auth/*` exists) |
| Controllers (feature domains) | NOT IMPLEMENTED (only `AuthController` exists) |
| Services (feature domains) | NOT IMPLEMENTED (only `AuthService`, `EmailService` exist) |
| Repositories (feature domains) | NOT IMPLEMENTED (only `UserRepository` exists) |
| Models (feature domains) | NOT IMPLEMENTED (only `User` model exists) |
| Validation schemas (feature domains) | NOT IMPLEMENTED (only `auth.validation.ts` exists) |

---

## 16. Known Gaps & Risks

| # | Gap/Risk | Description | Severity |
|---|----------|-------------|----------|
| 1 | **No feature APIs** | Backend only implements auth (`/api/auth/*`). All LMS feature domains (Classes, Courses, Assignments, Grades, Attendance, etc.) have zero backend support. | CRITICAL |
| 2 | **No User model extensions** | The `User` model has no fields linking to classes, courses, enrollments, or roles beyond the basic enum. No `studentId` references, no class rosters. | HIGH |
| 3 | **Admin route middleware is empty** | `adminRoutes = ["/api/admin"]` exists in middleware, but no `/api/admin/*` route handlers exist. Admin protection is defined but has no endpoints to protect. | MEDIUM |
| 4 | **Permissions field unused** | `User.permissions: string[]` exists but is never read or enforced. RBAC is role-based only. | LOW (info) |
| 5 | **Email service is a stub** | `EmailService.sendPasswordResetEmail` only logs to winston. No real email sending. Forgot password flow won't actually send emails. | MEDIUM |
| 6 | **Debug console.logs in production code** | `lib/password.ts` line 20/25 and `controllers/auth.controller.ts` line 118–119 have `console.log` statements gated by `NODE_ENV !== "production"` but should use `logger`. | LOW |
| 7 | **Forgot password has no Zod validation** | `AuthController.forgotPassword` only checks `if (!body.email)` — no Zod schema. Any truthy value passes. | LOW |
| 8 | **Register response inconsistency** | `AuthController.register` returns `{ id, name, email, role }` directly, while `login` returns `{ user: { id, name, email, role } }`. Frontend must handle different shapes. | LOW |
| 9 | **`secure: true` disabled in dev** | Cookies are `secure: false` in development (HTTP). Will break in production over HTTP. Production must use HTTPS. | LOW (known trade-off) |
| 10 | **sameSite=strict cross-origin** | In development with different frontend/backend ports, `sameSite: "strict"` may prevent cookies from being sent. | MEDIUM |
| 11 | **Single refresh token per user** | Only one `refreshToken` stored per user in DB. Multi-device sessions invalidate each other on refresh. | LOW |
| 12 | **No account verification enforcement** | `isVerified` exists but is not checked before login or API access. | LOW |
| 13 | **No audit logging for feature actions** | Only auth-related actions are logged. No audit trail for assignments, grades, attendance changes. | MEDIUM |
| 14 | **No file upload infrastructure** | Assignment submissions may require file uploads, but there's no upload middleware/controller/model. | HIGH (when assignments are implemented) |
| 15 | **No pagination pattern** | Current list endpoints don't exist. No established pagination/filtering/sorting pattern for feature APIs. | MEDIUM (new pattern needed) |

---

## 17. Recommended Next Step

### Recommended next implementation domain

**Backend: User Management + Admin Panel foundation**

This is the logical foundation because all feature domains depend on users as actors (students, teachers, classes) and on admin oversight.

### Required prerequisites before implementation

1. **Decision on multi-device sessions**: Confirm whether single refresh token per user is acceptable or if multiple sessions are required (requires DB schema change to `refreshTokens: [string]`).
2. **Decision on `permissions` field**: Either remove it from the model (unused) or implement a permission-code system for fine-grained access control.
3. **Decision on email service**: Choose an email provider (SendGrid, SES, Resend) and configure `EmailService` to actually send emails.
4. **Decision on file uploads**: Choose storage (filesystem, S3, Cloudinary) for assignment submissions and avatars.

### Required APIs (Phase 1 — User Management)

- `GET /api/admin/users` — list all users (admin: all; others: own data only)
- `GET /api/admin/users/:id` — get user detail
- `PUT /api/admin/users/:id` — update user (role, active status) by admin
- `DELETE /api/admin/users/:id` — soft-delete user

### Required models

- Extend existing `User` model with any new fields (e.g., `studentId`, `employeeId`, `dateOfBirth`, `gender`, `address`, `phone`, `parentIds`)
- No new model strictly needed for Phase 1 (only User CRUD via admin routes)

### Required RBAC

- Add `user.read`, `user.update`, `user.delete` permission codes or keep role-based: only `ADMIN` role can access `/api/admin/users`

### Required tests

- Admin role enforcement (non-admin gets 403)
- Admin can list/paginate users
- Admin can update user role
- Admin can soft-delete user (and user can no longer authenticate)
- Non-admin cannot access `/api/admin/*` endpoints

---

## 18. Implementation Phase Plan (High-Level)

> This is the **high-level** implementation phase plan — a concise summary of the 10 implementation phases. A **detailed** implementation phase plan with per-phase models, APIs, RBAC, validation, testing, and exit criteria is provided in Section 22. **Section 22 is the authoritative detailed plan.**

### Phase 1 — Core Foundation (User Management #1 + Admin)
**Domains**: User Management, Admin Panel (read-only first)
**Models**: Extend `User` model
**APIs**: `/api/admin/users`, `/api/admin/users/:id`, `/api/admin/users/:id/status`
**RBAC**: Admin-only access to user management endpoints
**Validation**: Admin-only user update schema
**Dependencies**: Auth (for identity headers)
**Testing**: RBAC enforcement, pagination, user updates
**Exit criteria**: Admin can list, view, and modify users; non-admin gets 403

### Phase 2 — Academic Structure (Subjects #4, Classes #2, Courses #3)

**Domains**: Subject Management, Class Management, Course Management
**Models**: `Subject`, `Class`, `Course`
**APIs**: `/api/subjects`, `/api/classes`, `/api/courses` (+ all CRUD)
**RBAC**: Admin/Teacher for create/update/delete; all authenticated for read
**Validation**: Class creation schema, Course creation schema, Subject CRUD schema
**Dependencies**: Phase 1 (User references), Auth
**Testing**: Role-based access, ownership enforcement (only teacher who created can modify), student can view enrolled classes/courses
**Exit criteria**: Admin/Teacher can create classes/courses; students can view their enrollments

### Phase 3 — Enrollment (#5)
**Domains**: Enrollment
**Models**: `Enrollment`
**APIs**: `/api/enrollments`
**RBAC**: Admin/Teacher to enroll; Student/Parent to view own
**Validation**: Enrollment creation schema, status update schema
**Dependencies**: Phase 2 (Class, Course)
**Testing**: Student cannot enroll self; only admin/teacher can enroll; student can view own enrollments
**Exit criteria**: Students can be enrolled in classes/courses; students can see their enrollments

### Phase 4 — Assignments (#6) + Submissions (#7)
**Domains**: Assignment Management, Exam Management
**Models**: `Assignment`, `Submission`, `Exam`
**APIs**: `/api/assignments`, `/api/submissions`, `/api/exams`
**RBAC**: Admin/Teacher create; enrolled students submit/view; teachers grade
**Validation**: Assignment creation, submission, exam scheduling schemas
**Dependencies**: Phase 2 (Class, Course), Phase 3 (Enrollment)
**Testing**: Only enrolled students can submit; only teachers can grade; students see only their own submissions
**Exit criteria**: Teachers can create assignments; students can submit; teachers can view submissions

### Phase 5 — Attendance (#9)
**Domains**: Attendance
**Models**: `Attendance`
**APIs**: `/api/attendance`
**RBAC**: Admin/Teacher record; students/parents view own
**Validation**: Attendance recording schema (status enum)
**Dependencies**: Phase 2 (Class, Course), Phase 3 (Enrollment)
**Testing**: Teacher can only mark attendance for own class; students view own; parents view children's
**Exit criteria**: Teachers can record attendance; students/parents can view history

### Phase 6 — Grades & Results (#10)
**Domains**: Grade/Result Management
**Models**: `Grade`
**APIs**: `/api/grades`, `/api/results`
**RBAC**: Admin/Teacher create/update; students/parents view own
**Validation**: Grade creation schema (min/max score validation)
**Dependencies**: Phase 4 (Assignment, Exam)
**Testing**: Only teachers can grade; grade cannot exceed max points; students see only own grades
**Exit criteria**: Grades recorded and visible to appropriate roles; report cards generated

### Phase 7 — Timetable (#11)
**Domains**: Timetable/Schedule
**Models**: `Timetable`
**APIs**: `/api/timetable`
**RBAC**: Admin/Teacher create; all view (filtered by role)
**Validation**: Schedule creation schema (time conflict checks)
**Dependencies**: Phase 2 (Class, Course), Phase 3 (Enrollment)
**Testing**: Students see their enrolled class schedules; teachers see teaching schedules
**Exit criteria**: Schedules visible on dashboard by role

### Phase 8 — Announcements (#12)
**Domains**: Announcements
**Models**: `Announcement`
**APIs**: `/api/announcements`
**RBAC**: Admin/Teacher create; all receive (filtered by target)
**Validation**: Announcement creation schema (targetType validation)
**Dependencies**: Phase 1 (User), Phase 2 (Class/Course for targeting)
**Testing**: Teachers create announcements for their classes only; students see announcements for their classes + global
**Exit criteria**: Role-targeted announcements visible to appropriate users

### Phase 9 — Notifications (#13)
**Domains**: Notifications
**Models**: `Notification`
**APIs**: `/api/notifications`
**RBAC**: All authenticated can view own; system-triggered creation
**Validation**: Notification creation (internal/system)
**Dependencies**: All domains (notifications triggered by assignment due, grade posted, etc.)
**Testing**: Notification created on assignment due date; user can mark read
**Exit criteria**: Users see relevant notifications; can mark as read

### Phase 10 — Analytics (#14)
**Domains**: Analytics/Dashboard
**Models**: No new model (aggregation queries)
**APIs**: `/api/analytics`, `/api/admin/dashboard`
**RBAC**: Admin sees all; Teacher sees own classes; Student sees own data; Parent sees children's data
**Validation**: Query parameter validation for date ranges, filters
**Dependencies**: All domains
**Testing**: Correct aggregation numbers; role-based data filtering
**Exit criteria**: Dashboard shows meaningful role-specific metrics

> Note: Each high-level phase maps to canonical domain number (see Section 11). Phase 4 groups Assignments (#6) and Submissions (#7). Phase 2 groups Subjects (#4), Classes (#2), and Courses (#3). The canonical 15 domains remain the authoritative list.

---

## 19. Frontend Implementation Strategy

The future frontend should consume the planned backend capabilities using the **existing** architecture patterns:

```
Frontend Feature Page
    ↓
Feature Hook (e.g., useClasses, useAssignments, useGrades)
    ↓
API Service (e.g., services/api/classes.ts)
    ↓
Axios apiClient (withCredentials: true)
    ↓
Backend API (protected route → middleware → controller → service → repository → MongoDB)
    ↓
Response: { success, message, data, errors, timestamp }
    ↓
Hook extracts .data, handles errors via useNotification
    ↓
Component renders with Ant Design tables/forms
```

### Key integration patterns to use

1. **API base URL**: Already configured via `NEXT_PUBLIC_BACKEND_URL` in `config/api/constants.ts`. New API services follow the same pattern as `services/api/auth/index.ts`.

2. **Axios infrastructure**: The existing 401→refresh→retry interceptor will automatically handle all new feature endpoints — no changes needed to the interceptor.

3. **API service layer**: New services follow the pattern in `services/api/auth/index.ts` — exported functions, typed with `AxiosResponse<ApiResponse<T>>`, extract `.data.data`.

4. **Hook layer**: New hooks follow the `useMutation`/`useQuery` pattern from `src/hooks/` — generic types, `execute`, `isLoading`, `isError`, `isSuccess`, `error`.

5. **Auth state**: AuthContext already provides `user`, `isAuthenticated`, `isLoading` — new feature pages use the `(dashboard)/layout.tsx` protected route pattern.

6. **Role-based access**: Use the existing `useAuth().user.role` and `filterNavItems` from `config/navigation/` to show/hide navigation and features by role.

7. **Form validation**: Use React Hook Form + Zod schemas mirroring backend validation (same pattern as `auth.schemas.ts`).

8. **Error handling**: Use `getAuthErrorMessage()` pattern for API error extraction, or create domain-specific error helpers.

9. **State management**: Redux `uiSlice` for UI state (sidebar, theme); feature-specific state in component state or React Context if needed.

10. **Reusable components**: Use existing `DataTable`, `ConfirmDialog`, `LoadingState`, `ErrorState`, `EmptyState`, `StatusTag`, `PageContainer` components.

### Frontend routing pattern for new domains

```
src/app/(dashboard)/
├── classes/
│   ├── page.tsx          (list)
│   ├── [id]/
│   │   └── page.tsx      (detail)
│   └── new/
│       └── page.tsx      (create/edit)
├── courses/
├── assignments/
├── grades/
├── attendance/
├── timetable/
├── announcements/
└── admin/
    └── users/
        └── page.tsx
```

**No frontend implementation will begin until corresponding backend APIs exist.**

---

## 20. Testing Strategy

The future backend should implement tests following the established patterns:

### Test categories required

| Category | Pattern | Tools |
|----------|---------|-------|
| Unit tests | Functions, validation schemas | Jest (not yet in package.json) |
| Service tests | Service methods with mocked repositories | Jest + mongodb-memory-server |
| Repository tests | Database CRUD operations | Jest + mongodb-memory-server |
| API/integration tests | Full request→response cycles | Jest + supertest or next-test-api-route |
| Authentication tests | Login, register, token verification | Jest + mongodb-memory-server |
| Authorization/RBAC tests | Role enforcement on endpoints | Jest + supertest |
| Validation tests | Zod schema edge cases | Jest |
| Error handling tests | AppError, apiHandler catch blocks | Jest |
| Pagination tests | List endpoints with page/limit | Jest + supertest |
| Search/filter tests | Query parameter filtering | Jest + supertest |
| Ownership tests | Teacher can only modify own data | Jest + supertest |
| Security tests | 401/403 enforcement, token reuse, CSRF | Jest + supertest |
| Edge cases | Empty data, invalid IDs, concurrent access | Jest + supertest |
| Regression tests | All of the above maintained over time | Jest |

### Testing infrastructure needed

- **Test runner**: `jest` (not currently installed — must be added to `devDependencies` later)
- **MongoDB memory server**: `mongodb-memory-server` for isolated test database
- **HTTP testing**: Native `NextRequest`/`NextResponse` testing or `supertest`
- **Coverage**: `jest --coverage` with thresholds (80% minimum recommended)

**No tests are created in this step.**

---

## 21. Security Plan

### Authentication (existing — no changes required)

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Token type | JWT (double-token: access + refresh) | IMPLEMENTED |
| Cookie type | HTTP-only (browser-managed) | IMPLEMENTED |
| Token secrets | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` env vars | IMPLEMENTED |
| Token expiry | Access: 15 min, Refresh: 7 days | IMPLEMENTED |
| Token type field | `type: 'access' \| 'refresh' \| 'reset'` enforced | IMPLEMENTED |
| Refresh rotation | New tokens issued each refresh, old invalidated | IMPLEMENTED |
| Token reuse detection | DB comparison, full revocation on mismatch | IMPLEMENTED |
| Password hashing | bcrypt, 12 rounds | IMPLEMENTED |
| Account lockout | 5 attempts → 15 min lockout | IMPLEMENTED |
| Rate limiting | 100 req/60s per IP | IMPLEMENTED |

### Authorization (existing + proposed)

| Aspect | Current | Proposed |
|--------|---------|----------|
| Role check | Middleware checks `role` for `/api/admin/*` | Extend to all feature routes with per-resource ownership checks |
| Permission system | `permissions: string[]` field exists but unused | Define permission codes for each resource, or keep role-based |
| Ownership | Not implemented (no feature resources) | Each resource has `createdBy` / `ownerId`; only creator or admin can modify |

### Future security requirements

| Area | Requirement |
|------|-------------|
| **Input validation** | All new endpoints must validate with Zod (matching frontend schemas) |
| **Ownership checks** | Every resource-level mutation must verify ownership. **Client-supplied identity headers must never be trusted directly.** The `x-user-id` and `x-user-role` headers must be generated or overwritten by trusted authentication middleware after successful JWT verification. Controllers must read identity exclusively from these trusted headers, never from request body fields. |
| **Privilege escalation** | Never trust client-provided `role` — role comes from JWT; role changes only via admin endpoints |
| **Rate limiting** | Already at API handler level; review if too strict for feature usage |
| **Sensitive data filtering** | Never return `password`, `refreshToken`, or other sensitive fields in responses (use Mongoose `.select()` or projection) |
| **Mass assignment** | Use explicit field selection in updates, not raw body spread (current `updateProfile` uses explicit fields — good pattern) |
| **ID enumeration** | Consider UUID or obfuscated IDs instead of sequential Mongo `_id` if exposed |
| **Audit logging** | Log all create/update/delete actions on feature resources with user ID and timestamp (extend `logger`) |
| **Secure error responses** | Return 404 (not 403) when a user lacks access to a resource they shouldn't know exists (prevents enumeration) |
| **CORS** | Already configured in middleware — verify `FRONTEND_ORIGIN` is set correctly for production deployment |

---

## 22. Implementation Phase Plan (Detailed)

### Phase 1 — User Management & Admin Foundation

**Goal**: Enable admin to manage users (view, update role/active status, soft-delete)

**Domains**: User Management, Admin Panel

**Models**:
- The current `User` model (see Section 5) has auth-only fields. The following fields are **PROPOSED** extensions and are NOT currently implemented in the backend. They are listed as candidates for Phase 1 planning only — final field definitions must be confirmed against actual product requirements before implementation.

  - `dateOfBirth?: Date` — **PROPOSED** (subject to final requirements)
  - `gender?: "MALE" | "FEMALE" | "OTHER" | null` — **PROPOSED** (subject to final requirements)
  - `address?: string` — **PROPOSED** (subject to final requirements)
  - `phone?: string` — **PROPOSED** (subject to final requirements)
  - `studentId?: string` (unique, for student reference) — **PROPOSED** (subject to final requirements)
  - `employeeId?: string` (unique, for teacher reference) — **PROPOSED** (subject to final requirements)
  - `parentIds?: [ObjectId]` — **PROPOSED** (see Parent–Student relationship design decision below)

  **Parent–Student relationship — design decision (NOT IMPLEMENTED):**
  The `parentIds` field is one possible approach for linking parents to their children. This is an architectural decision that must be finalized before Phase 1 implementation. Possible approaches include:
  - `parentIds: [ObjectId]` array referenced on the Student `User` document (simple, supports multiple parents)
  - Reverse reference: `childrenIds: [ObjectId]` on the Parent `User` document
  - A dedicated `ParentStudentRelationship` join model (supports metadata like relationship type, primary contact)

  This plan does NOT choose an approach. The decision must be made jointly with product requirements. Do NOT implement `parentIds` until the relationship strategy is confirmed.

**APIs**:
- `GET /api/admin/users?page=&limit=&role=&search=&isActive=` — List users (admin only)
- `GET /api/admin/users/:id` — Get user detail (admin only)
- `PUT /api/admin/users/:id` — Update user: role, isActive, basic info (admin only)
- `DELETE /api/admin/users/:id` — **Soft-delete** user (deactivate, not permanent database deletion)

  **Soft-delete semantics**: `DELETE /api/admin/users/:id` does **not** permanently remove the user document from MongoDB. It sets `isActive = false` (and optionally `role` to a dormant state). The user record remains in the database for audit/history purposes. Soft-deleted users cannot authenticate (login is rejected if `isActive` is false). Permanent database deletion is **not part of the current plan** unless explicitly required by GDPR/compliance requirements in a future step.

**RBAC**:
- All `/api/admin/*` routes require `role === ADMIN` (already enforced in middleware)
- No ownership concept for users (admin-only resource)

**Validation**:
- `UPDATE_USER_SCHEMA`: `role` (UserRole enum), `isActive` (boolean), `name` (optional), `email` (optional), etc.

**Testing**:
- Admin can list users with pagination
- Admin can update user role
- Admin can soft-delete user (user cannot authenticate after `isActive = false`)
- Non-admin → 403 on any `/api/admin/*` route
- Invalid user ID → 404

**Exit criteria**: Admin panel frontend (`/dashboard/admin/users`) can list, view, and modify users.

### Phase 2 — Academic Structure (Subjects, Classes, Courses)

**Goal**: Define the academic hierarchy — subjects, classes, courses

**Domains**: Subject Management, Class Management, Course Management

**Models**:
- `Subject`: `name`, `code` (unique), `description`, `color`, `icon`, `createdBy`, timestamps
- `Class`: `name`, `description`, `gradeLevel`, `academicYear`, `courseId`, `teacherId`, `studentIds`, `isActive`, timestamps
- `Course`: `name`, `code` (unique), `description`, `subjectId`, `credits`, `createdBy`, `isActive`, timestamps

**APIs**:
- Subjects: `GET/POST/PUT/DELETE /api/subjects/:id`
- Classes: `GET/POST/PUT/DELETE /api/classes/:id`, `POST /api/classes/:id/students`, `DELETE /api/classes/:id/students/:studentId`
- Courses: `GET/POST/PUT/DELETE /api/courses/:id`

**RBAC**:
- Admin: full CRUD on all
- Teacher: create/update/delete own (createdBy); view all
- Student: view enrolled classes/courses only
- Parent: view children's classes/courses

**Dependencies**: Phase 1 (User references), Auth (identity headers)

### Phase 3 — Enrollment

**Goal**: Link students to classes/courses

**Models**: `Enrollment` (studentId, classId, courseId, status, enrolledAt)

**APIs**: `POST/GET/PUT /api/enrollments`, `GET /api/enrollments/student/:id`, `GET /api/enrollments/class/:id`

**Dependencies**: Phase 2

### Phase 4 — Assignments & Exams

**Goal**: Create assignments and exams, allow submissions, enable grading

**Models**: `Assignment`, `Submission`, `Exam`

**APIs**: All CRUD for assignments/exams; submission endpoints; grading endpoints

**Dependencies**: Phase 2, Phase 3

### Phase 5 — Attendance

**Goal**: Record and view attendance

**Models**: `Attendance`

**APIs**: `POST/GET/PUT /api/attendance`, `GET /api/attendance/student/:id`, `GET /api/attendance/class/:id`

**Dependencies**: Phase 2, Phase 3

### Phase 6 — Grades & Results

**Goal**: Record grades, generate report cards

**Models**: `Grade`

**APIs**: `POST/GET/PUT/DELETE /api/grades`, `GET /api/results/student/:id`

**Dependencies**: Phase 4

### Phase 7 — Timetable

**Goal**: Schedule and display class timetables

**Models**: `Timetable`

**APIs**: `POST/GET/PUT/DELETE /api/timetable`, by-class, by-teacher, by-student

**Dependencies**: Phase 2, Phase 3

### Phase 8 — Announcements

**Goal**: Broadcast announcements with targeting

**Models**: `Announcement`

**APIs**: `POST/GET/PUT/DELETE /api/announcements`

**Dependencies**: Phase 1, Phase 2

### Phase 9 — Notifications

**Goal**: System notifications for events

**Models**: `Notification`

**APIs**: `GET/PUT/DELETE /api/notifications`, `PUT /api/notifications/read-all`

**Dependencies**: All previous phases (notifications triggered by events)

### Phase 10 — Analytics

**Goal**: Aggregate and display metrics

**APIs**: `GET /api/analytics/*`, `GET /api/admin/dashboard`

**Dependencies**: All previous phases

---

## 23. Completion Checklist

- [x] Repository inspected (backend + frontend + docs)
- [x] Current backend capabilities documented
- [x] Existing APIs documented (10 auth endpoints)
- [x] Existing architecture documented (controller→service→repository→model)
- [x] Current authentication documented (JWT double-token + cookies)
- [x] Current RBAC documented (4 roles, admin route protection, permissions field unused)
- [x] Proposed feature domains identified (15 domains)
- [x] Proposed data models documented (14 proposed entities)
- [x] Proposed APIs documented (full inventory per domain)
- [x] Proposed RBAC documented (current + proposed)
- [x] Frontend ↔ backend mapping completed
- [x] Domain dependencies documented
- [x] Future implementation phases defined (10 phases)
- [x] Testing strategy defined
- [x] Security considerations documented
- [x] Known gaps documented (15 gaps/risks)
- [x] Next implementation step recommended (Phase 1: User Management)
- [x] No backend source code changed
- [x] No frontend source code changed
- [x] No packages installed
- [x] No mock APIs created
- [x] No database migrations created
- [x] Documentation reviewed and corrected (domain numbering, proposed fields, identity header security, soft-delete semantics, phase plan distinction)

---

## 24. Appendix A: Existing Backend API Reference (Confirmed)

### POST `/api/auth/register`
- **Auth**: No
- **Body**: `{ name, email, password }`
- **Response (201)**: `{ success, message: "Registration successful", data: { id, name, email, role }, errors, timestamp }`

### POST `/api/auth/login`
- **Auth**: No
- **Body**: `{ email, password }`
- **Response (200)**: `{ success, message: "Login successful", data: { user: { id, name, email, role } }, errors, timestamp }` + cookies

### POST `/api/auth/refresh`
- **Auth**: No (reads refreshToken cookie)
- **Body**: None
- **Response (200)**: `{ success, message: "Token refreshed", data: null, errors, timestamp }` + updated cookies

### POST `/api/auth/logout`
- **Auth**: Yes (accessToken cookie)
- **Body**: None
- **Response (200)**: `{ success, message: "Logout successful", data: null, errors, timestamp }` + cookies cleared

### GET `/api/auth/profile`
- **Auth**: Yes (accessToken cookie)
- **Response (200)**: `{ success, message: "Profile fetched successfully", data: { id, name, email, role, avatar }, errors, timestamp }`

### PUT `/api/auth/profile`
- **Auth**: Yes (accessToken cookie)
- **Body**: `{ name?, avatar? }`
- **Response (200)**: `{ success, message: "Profile updated successfully", data: { id, name, email, avatar }, errors, timestamp }`

### POST `/api/auth/change-password`
- **Auth**: Yes (accessToken cookie)
- **Body**: `{ currentPassword, newPassword }`
- **Response (200)**: `{ success, message: "Password changed successfully. Please login again.", data: null, errors, timestamp }` + cookies cleared

### POST `/api/auth/forgot-password`
- **Auth**: No
- **Body**: `{ email }`
- **Response (200)**: `{ success, message: "If an account exists with that email, a reset link will be sent.", data: null, errors, timestamp }`

### POST `/api/auth/reset-password`
- **Auth**: No (reset token in body)
- **Body**: `{ token, newPassword }`
- **Response (200)**: `{ success, message: "Password reset successfully", data: null, errors, timestamp }`

### POST `/api/auth/google`
- **Auth**: No
- **Body**: `{ idToken }`
- **Response (200)**: `{ success, message: "Google Login successful", data: { user: { id, name, email, role, avatar } }, errors, timestamp }` + cookies

---

## 25. Appendix B: Frontend Architecture Deviation Notes

### Deviation 1: Auth state in Redux, not Context-only
- **ARCHITECTURE.md Section J says**: "AuthState (React Context — NOT Redux)" / "No Redux auth state, no RTK Query for auth"
- **Actual implementation**: `authSlice.ts` exists and IS the auth state source. `AuthContext.tsx` wraps and dispatches to the Redux slice. `useAuth.ts` reads from Redux. Interceptors also dispatch to `authSlice`.
- **Impact**: The architecture documentation is outdated. The actual implementation works correctly and is verified (tsc + build pass). No fix needed — documentation note only.

### Deviation 2: Frontend auth state uses Redux authSlice (not Context-only)
- **ARCHITECTURE.md Section J says**: "Auth state (React Context — NOT Redux)" / "No Redux auth state"
- **Actual implementation**: `frontend/src/store/slices/authSlice.ts` exists and IS the auth state source. `AuthContext.tsx` wraps and dispatches to the Redux slice. `useAuth.ts` reads from Redux. Interceptors also dispatch to `authSlice`.
- **Impact**: The architecture documentation is outdated. The actual implementation works correctly and is verified (tsc + build pass). **This deviation is intentional and functional — do NOT modify it.** Documented for accuracy only.

---

## 26. Step 15 Status

**STEP 15 — PLANNING COMPLETE**

This document is a read-only audit and planning artifact. No backend source code, frontend source code, configuration files, or packages were modified.

The next implementation target is:

**Phase 1 — User Management + Admin Foundation** (Section 22 of this document)

The required sequence must remain:

```
Step 15 planning (THIS DOCUMENT)
    ↓
Human review & approval
    ↓
Backend Phase 1 implementation (User Management + Admin API)
    ↓
Backend testing & verification
    ↓
Corresponding frontend implementation (admin users route)
    ↓
Step 16 (next phase)
```

**Do NOT begin implementation until Step 15 is reviewed and approved.**

---

## 27. Final Safety Constraints (Reiterated)

This document was created under the following constraints — all of which remain in effect for the next implementation:

1. Backend is READ-ONLY — no source code changes during planning
2. Frontend is READ-ONLY — no source code changes during planning
3. No packages installed
4. No mock APIs created
5. No database migrations created
6. No feature implemented
7. No authentication infrastructure modified
8. No RBAC implementation modified
9. No database models/schemas modified
10. No API routes modified
11. No configuration files modified
12. No frontend architecture modified
13. No existing Steps 1–14 implementation modified

---

*End of Step 15 Planning Document*