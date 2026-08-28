# BACKEND_AUDIT_2 — LearnSphere Backend Deep Audit

## 1. Audit Metadata

- **Audit name:** BACKEND_AUDIT_2 — Deep Backend Implementation Audit
- **Date:** 2026-08-28
- **Repository path:** `E:\final_project`
- **Backend framework/version:** Next.js 16.2.11 (App Router)
- **TypeScript:** 5.x, `strict: true`
- **Database:** MongoDB 9.8.0 (via Mongoose 9.8.0)
- **Authentication mechanism:** JWT access + refresh tokens, cookie-based
- **Audit scope:** Read-only audit of `backend/src/` — all routes, controllers, services, repositories, models, lib files, middleware, validation, types, constants, utils, interfaces, and test files. Plus `package.json`, `tsconfig.json`, `.env.local`.
- **Read-only confirmation:** No backend source code was modified for the purpose of this audit. Files modified during this session were for Phase 1 fix tasks (test file fixes and `user.repository.ts` `FilterQuery` import fix), not this audit.

---

## 2. Actual Backend Architecture

### Confirmed Architecture

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

### File Layout (actual paths)

| Layer | Files |
|-------|-------|
| **Routes (12 files)** | `src/app/api/auth/{register,login,logout,refresh,google,forgot-password,reset-password,change-password,profile}/route.ts` (9) + `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/users/[id]/status/route.ts` (3) |
| **Controllers (2 files)** | `src/controllers/auth.controller.ts`, `src/controllers/admin.controller.ts` |
| **Services (3 files)** | `src/services/auth.service.ts`, `src/services/admin.service.ts`, `src/services/email.service.ts` |
| **Repositories (1 file)** | `src/repositories/user.repository.ts` |
| **Models (1 file)** | `src/models/user.model.ts` |
| **Middleware (1 file)** | `src/middleware.ts` |
| **Lib (7 files)** | `src/lib/db.ts`, `src/lib/jwt.ts`, `src/lib/edgeJwt.ts`, `src/lib/password.ts`, `src/lib/csrf.ts`, `src/lib/csrf.server.ts`, `src/lib/userSanitization.ts` |
| **Validation (2 files)** | `src/validations/auth.validation.ts`, `src/validations/admin.validation.ts` |
| **Types (2 files)** | `src/types/user.types.ts`, `src/types/auth.types.ts` |
| **Constants (2 files)** | `src/constants/errorMessages.ts`, `src/constants/statusCodes.ts` |
| **Utils (5 files)** | `src/utils/apiHandler.ts`, `src/utils/apiResponse.ts`, `src/utils/AppError.ts`, `src/utils/logger.ts`, `src/utils/rateLimiter.ts` |
| **Interfaces (1 file)** | `src/interfaces/response.interface.ts` |
| **Config (1 file)** | `src/config/env.ts` |
| **Tests (4 files)** | `src/lib/__tests__/csrf.test.ts`, `src/lib/__tests__/userSanitization.test.ts`, `src/services/__tests__/admin.service.test.ts`, `src/validations/__tests__/admin.validation.test.ts` |

### Layer Notes

- **Routes:** All routes are thin wrappers — they delegate to `apiHandler()` then call the corresponding controller method. They do NOT contain business logic.
- **Controllers:** Contain auth header extraction (`x-user-id`), request body parsing, Zod validation, and error handling via `handleError()`. Use `sendResponse()` for consistent response envelopes.
- **Services:** Contain business logic, repository calls, and logging.
- **Repositories:** Thin data-access layer wrapping Mongoose queries. Use `.select()` to control field exposure.
- **Models:** Single `userSchema` with `timestamps: true`, `versionKey: false`.

---

## 3. Actual API Inventory

| # | Method | Endpoint | Handler | Auth | RBAC | Status |
|---|--------|----------|---------|------|------|--------|
| 1 | POST | `/api/auth/register` | `authController.register` | No | None | IMPLEMENTED |
| 2 | POST | `/api/auth/login` | `authController.login` | No | None | IMPLEMENTED |
| 3 | POST | `/api/auth/logout` | `authController.logout` | Yes | None | IMPLEMENTED |
| 4 | POST | `/api/auth/refresh` | `authController.refresh` | No (reads refresh cookie) | None | IMPLEMENTED |
| 5 | POST | `/api/auth/google` | `authController.googleLogin` | No | None | IMPLEMENTED |
| 6 | POST | `/api/auth/forgot-password` | `authController.forgotPassword` | No | None | IMPLEMENTED |
| 7 | POST | `/api/auth/reset-password` | `authController.resetPassword` | No | None | IMPLEMENTED |
| 8 | POST | `/api/auth/change-password` | `authController.changePassword` | Yes | None (authenticated) | IMPLEMENTED |
| 9 | GET | `/api/auth/profile` | `authController.getProfile` | Yes | None (authenticated) | IMPLEMENTED |
| 10 | PUT | `/api/auth/profile` | `authController.updateProfile` | Yes | None (authenticated) | IMPLEMENTED |
| 11 | GET | `/api/admin/users` | `adminController.listUsers` | Yes | Admin only | IMPLEMENTED |
| 12 | GET | `/api/admin/users/[id]` | `adminController.getUserById` | Yes | Admin only | IMPLEMENTED |
| 13 | PUT | `/api/admin/users/[id]` | `adminController.updateUser` | Yes | Admin only | IMPLEMENTED |
| 14 | PATCH | `/api/admin/users/[id]` | `adminController.updateUser` | Yes | Admin only | IMPLEMENTED |
| 15 | PATCH | `/api/admin/users/[id]/status` | `adminController.updateUserStatus` | Yes | Admin only | IMPLEMENTED |

### Endpoint Details

#### Auth Endpoints

| Endpoint | Route File | Controller | Service | Validation | Response Shape |
|----------|-----------|------------|---------|------------|----------------|
| `POST /api/auth/register` | `src/app/api/auth/register/route.ts` | `AuthController.register` | `AuthService.register` | `registerSchema` (static import) | `ApiResponse<{ id, name, email, role }>` — 201 |
| `POST /api/auth/login` | `src/app/api/auth/login/route.ts` | `AuthController.login` | `AuthService.login` | `loginSchema` (static import) | `ApiResponse<{ user: { id, name, email, role } }>` — 200 + cookies |
| `POST /api/auth/logout` | `src/app/api/auth/logout/route.ts` | `AuthController.logout` | `AuthService.logout` | None | `ApiResponse<null>` — 200 + cookies cleared |
| `POST /api/auth/refresh` | `src/app/api/auth/refresh/route.ts` | `AuthController.refresh` | `AuthService.refresh` | None | `ApiResponse<null>` — 200 + new cookies |
| `POST /api/auth/google` | `src/app/api/auth/google/route.ts` | `AuthController.googleLogin` | `AuthService.googleLogin` | `googleLoginSchema` (dynamic import) | `ApiResponse<{ user: { id, name, email, role, avatar } }>` — 200 + cookies |
| `POST /api/auth/forgot-password` | `src/app/api/auth/forgot-password/route.ts` | `AuthController.forgotPassword` | `AuthService.forgotPassword` | None (manual `body.email` check only) | `ApiResponse<null>` — 200 |
| `POST /api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` | `AuthController.resetPassword` | `AuthService.resetPassword` | `resetPasswordSchema` (dynamic import) | `ApiResponse<null>` — 200 |
| `POST /api/auth/change-password` | `src/app/api/auth/change-password/route.ts` | `AuthController.changePassword` | `AuthService.changePassword` | `changePasswordSchema` (dynamic import) | `ApiResponse<null>` — 200 + cookies cleared |
| `GET /api/auth/profile` | `src/app/api/auth/profile/route.ts` | `AuthController.getProfile` | `AuthService.getProfile` | None | `ApiResponse<{ id, name, email, role, avatar }>` — 200 |
| `PUT /api/auth/profile` | `src/app/api/auth/profile/route.ts` | `AuthController.updateProfile` | `AuthService.updateProfile` | `updateProfileSchema` (dynamic import) | `ApiResponse<{ id, name, email, avatar }>` — 200 |

#### Admin Endpoints

| Endpoint | Route File | Controller | Service | Validation | Response Shape |
|----------|-----------|------------|---------|------------|----------------|
| `GET /api/admin/users` | `src/app/api/admin/users/route.ts` | `AdminController.listUsers` | `AdminService.listUsers` | `userListSchema` (query params) | `ApiResponse<PaginatedUsers>` — 200 |
| `GET /api/admin/users/[id]` | `src/app/api/admin/users/[id]/route.ts` | `AdminController.getUserById` | `AdminService.getUserById` | `userIdParamSchema` defined but NOT used in route | `ApiResponse<SanitizedUser>` — 200 |
| `PUT /api/admin/users/[id]` | `src/app/api/admin/users/[id]/route.ts` | `AdminController.updateUser` | `AdminService.updateUser` | `updateUserSchema` (body, strict) | `ApiResponse<SanitizedUser>` — 200 |
| `PATCH /api/admin/users/[id]` | `src/app/api/admin/users/[id]/route.ts` | `AdminController.updateUser` | `AdminService.updateUser` | `updateUserSchema` (body, strict) | `ApiResponse<SanitizedUser>` — 200 |
| `PATCH /api/admin/users/[id]/status` | `src/app/api/admin/users/[id]/status/route.ts` | `AdminController.updateUserStatus` | `AdminService.updateUserStatus` | `updateUserStatusSchema` (body, strict) | `ApiResponse<SanitizedUser>` — 200 |

**Note:** `userIdParamSchema` is defined in `admin.validation.ts` and exported but is NOT imported or used in any route file. The `id` parameter from the URL is passed directly to the controller without Zod validation.

**Note:** No `DELETE /api/admin/users/:id` endpoint exists (proposed but NOT IMPLEMENTED).

---

## 4. Actual Database Model Inventory

| Model | File | Status | Important Fields | Relationships |
|-------|------|--------|-----------------|---------------|
| User | `src/models/user.model.ts` | IMPLEMENTED | name, email, password, provider, providerId, avatar, role, permissions, isActive, isVerified, refreshToken, lastLogin, loginAttempts, lockUntil, passwordChangedAt | None (standalone) |

### User Model Field Detail

| Field | Type | Required | Default | Validation/Constraints | Select | Index |
|-------|------|----------|---------|----------------------|--------|-------|
| name | String | Yes | — | trim, maxlength 100 | default | — |
| email | String | Yes | — | unique, lowercase, trim | default | yes (1) |
| password | String | No | null | — | `select: false` | — |
| provider | String | No | LOCAL | enum: LOCAL, GOOGLE | default | — |
| providerId | String | No | null | — | default | yes (sparse) |
| avatar | String | No | null | — | default | — |
| role | String | No | STUDENT | enum: ADMIN, TEACHER, STUDENT, PARENT | default | — |
| permissions | [String] | No | [] | — | default | — |
| isActive | Boolean | No | true | — | default | — |
| isVerified | Boolean | No | false | — | default | — |
| refreshToken | String | No | null | — | `select: false` | yes (1) |
| lastLogin | Date | No | null | — | default | — |
| loginAttempts | Number | No | 0 | — | default | — |
| lockUntil | Date | No | null | — | default | — |
| passwordChangedAt | Date | No | null | — | default | — |

**Schema options:** `{ timestamps: true, versionKey: false }`

**Explicit indexes:**
- `{ email: 1 }` — for email lookups
- `{ providerId: 1 }` — for Google OAuth lookups
- `{ refreshToken: 1 }` — for token rotation checks

**No models exist for:** Classes, Courses, Subjects, Enrollments, Assignments, Submissions, Exams, Attendance, Grades, Timetable, Announcements, Notifications, Analytics.

**User fields NOT present (proposed but NOT IMPLEMENTED):**
- `dateOfBirth`
- `gender`
- `address`
- `phone`
- `studentId`
- `employeeId`
- parent/child relationship fields

---

## 5. Actual Authentication Audit

### Registration
- **Status:** IMPLEMENTED
- `AuthService.register(data: RegisterInput)`
- Checks `userRepository.findByEmail(data.email)` — throws 409 if exists
- Hashes password via `hashPassword()` (bcrypt, 12 rounds)
- Creates user with `provider: AuthProvider.LOCAL`
- Returns `{ id, name, email, role }`
- **NOT verified:** No email verification flow (user created as `isVerified: false` but no verification token sent)

### Login
- **Status:** IMPLEMENTED
- `AuthService.login(data: LoginInput)`
- Fetches user via `userRepository.findByEmail` (selects +password +refreshToken)
- Throws 401 if user not found or no password
- Checks `lockUntil` — throws 403 if account locked
- `comparePassword(data.password, user.password)` — **logs plain password in dev mode (security issue)**
- On failure: `incrementLoginAttempts` then throws 401
- On success: `updateLastLogin`, generates access + refresh tokens, saves refresh token in DB
- Returns `{ user: { id, name, email, role }, accessToken, refreshToken }`
- **Account lockout after 5 failed attempts**, 15-minute lock period

### Access Token
- **Status:** IMPLEMENTED
- JWT signed with `env.JWT_ACCESS_SECRET`
- Payload: `{ userId, role, type: 'access' }`
- Expiry: `env.ACCESS_TOKEN_EXPIRES_IN` (default: "15m")

### Refresh Token
- **Status:** IMPLEMENTED
- JWT signed with `env.JWT_REFRESH_SECRET`
- Payload: `{ userId, role, type: 'refresh' }`
- Expiry: `env.REFRESH_TOKEN_EXPIRES_IN` (default: "7d")

### Refresh Rotation
- **Status:** IMPLEMENTED
- `AuthService.refresh(token: string)` verifies refresh token, fetches user by `userId`
- Compares `userWithToken.refreshToken !== token` — if mismatch, revokes all tokens and throws 401
- Generates new access + refresh tokens
- Saves new refresh token in DB (overwrites old)
- Returns `{ accessToken, refreshToken }`

### Logout
- **Status:** IMPLEMENTED
- Revokes refresh token in DB (`refreshToken: null`)
- Controller clears all cookies (accessToken, refreshToken, csrfToken)

### Token Reuse Detection
- **Status:** IMPLEMENTED
- In `refresh()`: if presented token doesn't match DB-stored token, logs warning, revokes all tokens, throws 401
- This handles the case where a stolen refresh token is used

### Password Hashing
- **Status:** IMPLEMENTED
- `hashPassword`: `bcrypt.hash(password, 12)` — 12 salt rounds
- `comparePassword`: `bcrypt.compare()` — **logs plain password and result in non-production**

### Forgot Password
- **Status:** IMPLEMENTED
- `AuthService.forgotPassword(email)` — silent return if user not found (security through obscurity)
- Generates reset JWT: `jwt.sign({ userId, type: 'reset' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' })`
- **WARNING:** Uses `JWT_ACCESS_SECRET` for reset tokens (not a dedicated secret)
- Sends email via `emailService.sendPasswordResetEmail()` — which only logs, does NOT actually send

### Reset Password
- **Status:** IMPLEMENTED
- `AuthService.resetPassword(data)` — verifies reset JWT, checks `type === 'reset'`
- Fetches user, hashes new password, updates with `passwordChangedAt`, `refreshToken: null`
- All errors caught and re-thrown as 400 `TOKEN_INVALID`

### Google OAuth
- **Status:** IMPLEMENTED
- `AuthService.googleLogin(idToken)` — dynamically imports `google-auth-library`
- Verifies ID token with `OAuth2Client.verifyIdToken`
- Creates new user if email not found (provider: GOOGLE)
- Links account (sets providerId) if existing user has no providerId
- Generates access + refresh tokens
- Returns `{ user: { id, name, email, role, avatar }, accessToken, refreshToken }`
- **Gap:** `userRepository.findByGoogleId` is defined but NOT used — auth service uses `findByEmail` instead

### Cookie Configuration
- **Status:** IMPLEMENTED
- `accessToken` cookie: httpOnly=true, secure (prod only), sameSite=strict, maxAge=15min, path="/"
- `refreshToken` cookie: httpOnly=true, secure (prod only), sameSite=strict, maxAge=7 days, path="/"
- `csrfToken` cookie: httpOnly=false, secure (prod only), sameSite=strict, maxAge=7 days, path="/"

### Token Expiry
- **Status:** IMPLEMENTED
- Access token: 15 minutes (configurable via `ACCESS_TOKEN_EXPIRES_IN`)
- Refresh token: 7 days (configurable via `REFRESH_TOKEN_EXPIRES_IN`)
- Reset token: 15 minutes (hardcoded)

### Account Lockout
- **Status:** IMPLEMENTED
- 5 failed attempts → lock for 15 minutes
- `lockUntil` field checked in login flow
- Login attempts reset on successful login via `updateLastLogin`

### Rate Limiting
- **Status:** IMPLEMENTED (per-IP, not per-user)
- 100 requests per 60 seconds per IP
- Production: Redis-backed (`RateLimiterRedis`)
- Development: Memory-backed (`RateLimiterMemory`)
- Applied in `apiHandler` wrapper to ALL routes
- **Gap:** Not user-based — shared across users behind same NAT/proxy

### CORS
- **Status:** IMPLEMENTED (in middleware)
- Reflects `req.headers.get("origin")` if present, otherwise uses `FRONTEND_ORIGIN`
- Sets `Access-Control-Allow-Credentials: true`
- Sets `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- Sets `Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,x-csrf-token`
- **Security concern:** Accepts any origin (origin is reflected from request header)

### Authentication Middleware
- **Status:** IMPLEMENTED
- Next.js middleware at `src/middleware.ts`
- Matcher: `"/api/:path*"` — applies to ALL API routes
- Extracts `accessToken` from cookies
- Verifies via `verifyEdgeAccessToken` (Edge runtime, uses `jose` library)
- Injects `x-user-id` and `x-user-role` headers into forwarded request
- Protected routes (`/api/auth/change-password`, `/api/auth/profile`, `/api/auth/logout`) require valid token
- Admin routes (`/api/admin/*`) require valid token + `role === ADMIN`
- Safe methods (GET, HEAD, OPTIONS) exempt from CSRF on all routes
- State-changing methods (POST, PUT, PATCH, DELETE) on protected/admin routes require CSRF validation

### Trusted Identity Propagation
- **Status:** IMPLEMENTED (middleware → controller)
- Middleware extracts `userId` and `role` from verified JWT
- Sets `x-user-id` and `x-user-role` headers on the forwarded `NextRequest`
- Controllers read these headers: `req.headers.get("x-user-id")` and `req.headers.get("x-user-role")`
- **Security concern:** Trust model relies entirely on middleware enforcement. Edge runtime JWT verification must be secure.

---

## 6. Actual RBAC Audit

### User Roles
- **Status:** IMPLEMENTED
- `UserRole` enum: `ADMIN = "ADMIN"`, `TEACHER = "TEACHER"`, `STUDENT = "STUDENT"`, `PARENT = "PARENT"`
- Default role: `STUDENT` (set in Mongoose schema)

### Role Enum
- **Status:** IMPLEMENTED — `src/types/user.types.ts`

### JWT Role Claims
- **Status:** IMPLEMENTED
- Both access and refresh tokens include `role` in payload
- Verified in `normalizePayload()` (checks `typeof role === "string"`)
- Role is a string, not type-checked against enum in JWT layer

### Middleware Role Checks
- **Status:** IMPLEMENTED (admin-only)
- Middleware checks `decoded.role !== UserRole.ADMIN` for admin routes
- Returns 403 with `FORBIDDEN` if non-admin attempts admin route
- **Gap:** No role checks for Teacher/Student/Parent on any current route (no non-admin protected routes exist yet)

### Controller Authorization
- **Status:** PARTIALLY IMPLEMENTED
- Admin controller: relies on middleware for admin role check (no duplicate check in controller)
- Auth controller: relies on middleware for protected route access (no role checks in controller)
- Controllers read `x-user-id` and `x-user-role` headers but do NOT validate these headers as trusted
- `changePassword` checks `x-user-id` presence but not role
- **Gap:** No ownership checks (e.g., user can't access other users' data) — not applicable yet since only profile/change-password exist

### Service-Level Authorization
- **Status:** NOT IMPLEMENTED
- `AuthService` methods take `userId` as parameter but do not verify caller identity
- `AdminService` methods take `currentUserId` but only use it for logging — no authorization enforcement

### Ownership Checks
- **Status:** NOT IMPLEMENTED
- No ownership verification anywhere in current codebase
- Controllers trust `x-user-id` header for profile/password operations

### Permission Field
- **Status:** PARTIALLY IMPLEMENTED
- `permissions` array field exists in User model and `IUser` interface
- **Never used** for any authorization logic — RBAC is role-based only
- Default value: `[]`

### Permission Enforcement
- **Status:** NOT IMPLEMENTED
- `permissions` field is populated in the model but never checked in middleware or controllers

| Capability | Actual Status | Evidence | Gap |
|------------|--------------|----------|-----|
| Admin-only routes | IMPLEMENTED | middleware.ts:75 — `decoded.role !== UserRole.ADMIN` → 403 | None for admin |
| Teacher-only routes | NOT IMPLEMENTED | No teacher-protected routes exist | N/A |
| Student-only routes | NOT IMPLEMENTED | No student-protected routes exist | N/A |
| Parent-only routes | NOT IMPLEMENTED | No parent-protected routes exist | N/A |
| Role-based JWT claims | IMPLEMENTED | jwt.ts:10 — role in payload | No runtime type validation |
| Ownership enforcement | NOT IMPLEMENTED | No ownership checks in any service | Required for LMS data isolation |
| Permission-based access | NOT IMPLEMENTED | permissions field exists but unused | Consider deprecating or using |
| Trusted identity propagation | IMPLEMENTED (middleware → header) | middleware.ts:91-92 — sets x-user-id, x-user-role | Headers trusted in controllers without validation |

---

## 7. Actual Validation Audit

### Zod Schemas (all use Zod 4.x)

**Auth validation (`src/validations/auth.validation.ts`):**

| Schema | Strict? | Fields | Notes |
|--------|---------|--------|-------|
| `registerSchema` | No (no `.strict()`) | name (min 2, max 100), email (validated, lowercased), password (min 8, regex: upper/lower/number/special) | — |
| `loginSchema` | No | email (validated, lowercased), password (min 1) | — |
| `changePasswordSchema` | No | currentPassword (min 1), newPassword (min 8, regex), `.refine()` ensures current ≠ new | — |
| `resetPasswordSchema` | No | token (min 1), newPassword (min 8, regex) | — |
| `updateProfileSchema` | No | name (min 2, max 100, optional), avatar (URL, optional) | — |
| `googleLoginSchema` | No | idToken (min 1) | — |

**Admin validation (`src/validations/admin.validation.ts`):**

| Schema | Strict? | Fields | Notes |
|--------|---------|--------|-------|
| `userIdParamSchema` | No (object) | id (regex: 24-char hex) | DEFINED but NOT USED in routes |
| `userListSchema` | No (extend) | page (coerce, default 1), limit (coerce, default 20, max 100), role (enum, optional), isActive (preprocess string→bool, optional), search (min 1, max 100, optional) | — |
| `updateUserSchema` | Yes (`.strict()`) | name (min 2, max 100, optional), email (validated, lowercased, optional), role (enum, optional), isActive (boolean, optional) | Strict — unknown fields rejected |
| `updateUserStatusSchema` | Yes (`.strict()`) | isActive (boolean, required) | Strict — unknown fields rejected |

### Validation Locations

- **Auth validation:** All in Zod schemas (`auth.validation.ts`). `forgotPassword` does NOT use Zod — only manual `body.email` check in controller.
- **Admin validation:** All in Zod schemas (`admin.validation.ts`). `userIdParamSchema` defined but NOT used in route files.

### ID Validation
- **Status:** PARTIALLY IMPLEMENTED
- `userIdParamSchema` exists and validates 24-char hex format
- **NOT used** — admin route files extract `id` from URL params and pass directly to controller/service without validation
- Auth routes don't have ID params in URLs

### Query Validation
- **Status:** IMPLEMENTED (admin list users)
- `userListSchema` validates and coerces query params (`page`, `limit` as numbers, `isActive` string→boolean, `role` enum, `search` string)

### Body Validation
- **Status:** IMPLEMENTED (most endpoints)
- All auth endpoints use Zod schemas: register, login, changePassword, resetPassword, updateProfile, googleLogin
- `forgotPassword`: NOT validated via Zod (manual email check only)
- All admin endpoints use Zod schemas: updateUser (strict), updateUserStatus (strict)

### Enum Validation
- **Status:** IMPLEMENTED
- `UserRole` enum validated via `z.nativeEnum(UserRole)` in `userListSchema` and `updateUserSchema`
- `AuthProvider` enum used in Mongoose schema as `enum: Object.values(AuthProvider)`

### Date Validation
- **Status:** NOT IMPLEMENTED
- No date validation schemas exist
- No endpoints accept date input currently

---

## 8. Actual Error Handling

### AppError (`src/utils/AppError.ts`)
- Custom error class extending `Error`
- Properties: `statusCode` (typed as `StatusCode`), `errors` (string[], defaults to []), `isOperational` (defaults to true)
- Constructor: `(message: string, statusCode: StatusCode, errors?: string[], isOperational?: boolean)`
- Prototype chain restoration for proper `instanceof` checks
- Stack trace capture via `Error.captureStackTrace`

### apiHandler (`src/utils/apiHandler.ts`)
- Wraps all route handlers
- Pipeline: connectDB → rateLimit → handler → catch
- `connectDB()` — mongoose singleton connection
- Rate limiting: 100 req/60s per IP
- Catches any error not handled by controller, logs via winston, returns 500 `INTERNAL_SERVER_ERROR`

### HTTP Status Handling
- Controllers use `STATUS_CODES` constants for all responses
- `AppError` carries `statusCode` which is used directly in response
- Zod errors → 400; AppError → `error.statusCode`; Unknown → 500

### Validation Errors
- Caught as `z.ZodError` in `handleError()`
- Response: `{ success: false, message: "Validation Error", errors: issue.messages[], timestamp }`
- Status: 400

### MongoDB Errors
- **Status:** NOT IMPLEMENTED
- No MongoDB-specific error handling (e.g., duplicate key `E11000`)
- Duplicate email would produce a raw Mongoose error, caught by `handleError` as unknown → 500
- **Gap:** Should handle `MongoServerError` with code 11000 → 409 Conflict

### Duplicate Key Errors
- **Status:** NOT IMPLEMENTED
- No catch for MongoDB duplicate key errors
- `registerSchema` validates email format but MongoDB uniqueness is enforced at DB level
- If duplicate email reaches DB, error propagates as 500 (not 409)

### Invalid ObjectId
- **Status:** NOT IMPLEMENTED
- `userIdParamSchema` exists but is NOT used in admin routes
- Invalid ObjectId passed to `getUserById` would cause Mongoose to throw a `CastError`
- This `CastError` would be caught as an unknown error → 500 (not 400)

### Unauthorized
- **Status:** IMPLEMENTED
- Middleware returns 401 if no access token or token invalid
- Services throw 401 `UNAUTHORIZED` if auth check fails

### Forbidden
- **Status:** IMPLEMENTED
- Middleware returns 403 if non-admin accesses admin route
- Services throw 403 `ACCOUNT_LOCKED` if account locked

### Not Found
- **Status:** IMPLEMENTED
- `AdminService.getUserById` throws 404 if user not found
- `AdminService.updateUser` throws 404 if user not found
- `AuthService.getProfile` throws 404 if user not found

### Error Response Structure
- All errors go through `sendResponse(null, message, errors)`
- Shape: `{ success: false, message: string, data: null, errors: string[], timestamp: string }`

---

## 9. Actual Security Audit

### JWT Security
- **Status:** PARTIALLY IMPLEMENTED
- Access token: signed with `JWT_ACCESS_SECRET`, 15-minute expiry
- Refresh token: signed with `JWT_REFRESH_SECRET`, 7-day expiry
- Tokens verified via `jsonwebtoken` (server) and `jose` (edge middleware)
- **Gap:** Reset tokens signed with `JWT_ACCESS_SECRET` (not a dedicated secret)

### Cookie Security
- **Status:** IMPLEMENTED
- Auth cookies: httpOnly=true, secure (prod only), sameSite=strict, path="/"
- CSRF cookie: httpOnly=false (intentional — frontend must read it), sameSite=strict
- **Gap:** `secure` only set in production — in dev, cookies sent over HTTP

### CSRF
- **Status:** IMPLEMENTED (double-submit cookie pattern)
- Token: 256-bit cryptographically secure random (base64url, 43 chars)
- Validated: cookie value must match `x-csrf-token` header (timing-safe comparison)
- Edge-safe comparison: `safeCompareTokenEdge` (no Node crypto dependency)
- Applied: all protected + admin routes, state-changing methods only
- **Gap:** CSRF token not rotated after use — same token persists for 7 days

### CORS
- **Status:** IMPLEMENTED (but permissive)
- Origin: reflected from request header (`req.headers.get("origin")`), not strictly validated
- Credentials: `Access-Control-Allow-Credentials: true`
- **Security concern:** Any origin can make credentialed requests

### Rate Limiting
- **Status:** IMPLEMENTED (per-IP)
- 100 requests per 60 seconds per IP
- Production: Redis-backed; Development: Memory-backed
- **Gap:** Not user-specific — shared behind NAT

### Token Storage
- **Status:** IMPLEMENTED
- Access + refresh tokens stored in HTTP-only cookies
- Refresh token also stored in DB for rotation validation
- CSRF token in readable cookie

### Password Handling
- **Status:** IMPLEMENTED (but with logging vulnerability)
- bcrypt, 12 salt rounds
- `password` field: `select: false` in schema
- `refreshToken` field: `select: false` in schema
- **VULNERABILITY:** `password.ts:19-27` logs plain password and comparison result in non-production mode

### Sensitive Field Exposure
- **Status:** IMPLEMENTED
- `sanitizeUser()` function strips: password, refreshToken, loginAttempts, lockUntil, passwordChangedAt, permissions
- `findByIdSafe` repository method selects `-password -refreshToken`
- `findAllPaginated` selects `-password -refreshToken` via `.lean()`
- `update` method selects `-password -refreshToken`
- **Gap:** `findById` selects `+password` — used for login (correct) but also for profile update (unnecessary)

### Mass Assignment
- **Status:** PARTIALLY IMPLEMENTED
- `updateUserSchema` uses `.strict()` — rejects unknown fields
- `updateUserStatusSchema` uses `.strict()` — rejects unknown fields
- `updateProfileSchema` does NOT use `.strict()` — accepts arbitrary fields
- Auth schemas (register, login, etc.) do NOT use `.strict()` — accept arbitrary fields
- **Gap:** Auth validation schemas should use `.strict()`

### Role Escalation
- **Status:** IMPLEMENTED (partial)
- `updateUserSchema` allows `role` field to be updated
- Only admin can call `updateUser` (middleware-enforced)
- **Gap:** No service-level check that `currentUserId` is admin — relies entirely on middleware

### Header Trust
- **Status:** IMPLEMENTED (via middleware)
- `x-user-id` and `x-user-role` injected by middleware after JWT verification
- **Security concern:** Controllers trust these headers without secondary validation
- If middleware is bypassed, headers can be spoofed

### ID Enumeration
- **Status:** NOT IMPLEMENTED
- User IDs exposed as MongoDB ObjectIds in URLs and responses
- No obfuscation or UUID-based IDs

### Logging
- **Status:** PARTIALLY IMPLEMENTED
- Winston logger with JSON format, structured logging
- **VULNERABILITY:** `password.ts` logs plain passwords in dev mode
- `auth.controller.ts:126-127` logs `x-user-id` and `x-user-role` headers in debug
- **INFO logging:** Login events, registration, password changes, admin actions all logged

### Audit Logging
- **Status:** PARTIALLY IMPLEMENTED
- `AdminService` logs admin actions with acting user ID and target user email
- `AuthService` logs login, registration, password changes
- **Gap:** No structured audit log (who did what, when) — just info-level messages

### Production Configuration
- **Status:** PARTIALLY IMPLEMENTED
- Cookies set to `secure` in production
- CORS origins configurable via `FRONTEND_ORIGIN`
- JWT secrets must be set via env vars (validated at module load)
- **Gap:** CORS origin not validated — any origin accepted

---

## 10. Actual Testing Status

### Test Runner
- **Framework:** Node.js built-in test runner (`node:test`)
- **Command:** `npx tsx --test`
- **Assertion library:** `node:assert` (strict mode)
- No Jest, Vitest, or other third-party test framework

### Existing Tests (4 files, 98 tests)

| File | Tests | What's Covered |
|------|-------|----------------|
| `src/lib/__tests__/csrf.test.ts` | 28 | CSRF token generation, comparison, validation, cookie operations, method exemptions, timing-safe property |
| `src/lib/__tests__/userSanitization.test.ts` | 13 | sanitizeUser: null input, field mapping, sensitive field exclusion, null handling |
| `src/services/__tests__/admin.service.test.ts` | 20 | AdminService: listUsers (pagination, filtering, empty results), getUserById, updateUser (role, isActive, name, duplicate email, 404), updateUserStatus (isActive changes, no-op, 404) |
| `src/validations/__tests__/admin.validation.test.ts` | 24 | Schema validation: userIdParam, userList (pagination, role, isActive, search), updateUser (strict), updateUserStatus (strict) |

### Coverage Gaps
- **No auth service tests** — `AuthService.register`, `login`, `refresh`, `logout`, `changePassword`, `forgotPassword`, `resetPassword`, `getProfile`, `updateProfile`, `googleLogin` are untested
- **No controller tests** — neither `AuthController` nor `AdminController` tested directly
- **No integration/API tests** — no end-to-end HTTP request tests
- **No middleware tests** — auth flow, RBAC enforcement, CSRF in middleware untested
- **No security tests** — no CSRF attack simulation, no auth bypass tests, no RBAC violation tests
- **No rate limiting tests** — no tests for rate limiter behavior
- **No error handling tests** — no tests for 404, 500, validation error responses
- **No model validation tests** — no tests for Mongoose schema constraints
- **No auth validation tests** — `auth.validation.ts` schemas have NO test file

### Test Types
- **Unit tests:** Yes (service, validation, lib function tests)
- **Integration tests:** No
- **API tests:** No
- **Auth tests:** No (service-level auth logic untested)
- **RBAC tests:** No
- **Security tests:** No

---

## 11. Actual Backend Capability Matrix

| Domain | Backend Support | Models | APIs | Auth | RBAC | Validation | Tests | Status |
|--------|----------------|--------|------|------|------|------------|-------|--------|
| User Management | PARTIAL | User (1) | 3 admin endpoints | JWT + Cookie | Admin-only middleware | Zod strict + non-strict | 20 tests | PARTIAL |
| Classes | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Courses | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Subjects | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Enrollment | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Assignments | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Submissions | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Exams | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Attendance | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Grades | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Results | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Timetable | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Announcements | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Notifications | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Analytics | NONE | None | None | N/A | N/A | N/A | None | NONE |
| Settings | NONE | None | None | N/A | N/A | N/A | None | NONE |

---

## 12. Proposed Feature Plan vs Actual Backend

### DOMAIN: User Management

**PROPOSED:**
- User model with extended fields (dateOfBirth, gender, address, phone, studentId, employeeId, parent/child)
- `GET /api/admin/users` — list with pagination
- `GET /api/admin/users/:id` — view details
- `PUT /api/admin/users/:id` — update info
- `DELETE /api/admin/users/:id` — soft delete/deactivate

**ACTUAL:**
- User model: IMPLEMENTED — base fields only (name, email, password, provider, providerId, avatar, role, permissions, isActive, isVerified, refreshToken, lastLogin, loginAttempts, lockUntil, passwordChangedAt). **No** proposed extended fields exist.
- `GET /api/admin/users`: IMPLEMENTED — with pagination (page/limit defaults 1/20), search, role filter, isActive filter, createdAt sort
- `GET /api/admin/users/:id`: IMPLEMENTED — `getUserById` with `findByIdSafe` (excludes password/refreshToken)
- `PUT /api/admin/users/:id`: NOT IMPLEMENTED — route file exists with PUT handler but calls `updateUser` (update fields, not full replacement). No `DELETE` method exists.
- `DELETE /api/admin/users/:id`: NOT IMPLEMENTED — not present
- Soft delete/deactivate: PARTIALLY — `isActive` field exists, `updateUserStatus` can deactivate. No dedicated DELETE endpoint.
- Activate/deactivate: IMPLEMENTED via `PATCH /api/admin/users/:id/status`
- Proposed fields (dateOfBirth, gender, address, phone, studentId, employeeId, parent/child): NOT IMPLEMENTED

**GAP:**
1. DELETE endpoint missing (only PATCH for status change)
2. PUT vs PATCH semantics unclear (route has both PUT and PATCH calling `updateUser`)
3. `userIdParamSchema` defined but not used in routes
4. Proposed extended user fields not present

**DEPENDENCIES:**
- User Management is the foundational domain — all other phases depend on it

**RECOMMENDATION:**
- Phase 1 is partially ready. Core user list/view/update-status are implemented.
- Missing: DELETE endpoint, ID validation in routes (userIdParamSchema unused)

### DOMAIN: Classes

**PROPOSED:**
- Class model
- `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/:id`, `DELETE /api/classes/:id`
- Student roster management: `POST /api/classes/:id/students`, `DELETE /api/classes/:id/students/:studentId`
- Teacher ownership enforcement

**ACTUAL:**
- Class model: NONE
- APIs: NONE
- RBAC: NONE
- Validation: NONE
- Repository: NONE
- Service: NONE

**GAP:** 100% missing

**DEPENDENCIES:** User Management

**RECOMMENDATION:** Implement after Phase 1.

### DOMAIN: Courses

**PROPOSED:**
- Course model
- `GET /api/courses`, `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id`

**ACTUAL:**
- Course model: NONE
- APIs: NONE
- RBAC: NONE
- Validation: NONE
- Repository: NONE
- Service: NONE

**GAP:** 100% missing

**DEPENDENCIES:** Subject → Course relationship proposed

**RECOMMENDATION:** Implement after Phase 2.

### DOMAIN: Subjects

**PROPOSED:**
- Subject model
- `GET /api/subjects`, `POST /api/subjects`, `PUT /api/subjects/:id`, `DELETE /api/subjects/:id`

**ACTUAL:**
- Subject model: NONE
- APIs: NONE
- RBAC: NONE
- Validation: NONE
- Repository: NONE
- Service: NONE

**GAP:** 100% missing

**DEPENDENCIES:** User Management (teacher owns subjects)

**RECOMMENDATION:** Implement after Phase 2.

### DOMAIN: Enrollment

**PROPOSED:**
- Enrollment model (Student ↔ Class, Student ↔ Course)
- `POST /api/enrollments`, `GET /api/enrollments`, `PUT /api/enrollments/:id`
- `GET /api/enrollments/student/:id`, `GET /api/enrollments/class/:id`

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Phase 1 (User) → Phase 2 (Class/Course) → Phase 3 (Enrollment)

**RECOMMENDATION:** Implement after Phase 2.

### DOMAIN: Assignments

**PROPOSED:**
- Assignment model
- `GET /api/assignments`, `POST /api/assignments`, etc.
- Teacher creates/publishes assignments
- Student submits
- Teacher views/grades submissions

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Enrollment → Assignment → Submission

**RECOMMENDATION:** Implement after Phase 3.

### DOMAIN: Submissions

**PROPOSED:**
- Submission model

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Assignment

**RECOMMENDATION:** Phase 4, after Assignments.

### DOMAIN: Exams / Assessments

**PROPOSED:**
- Exam model
- Exam scheduling, publish/unpublish
- Ownership enforcement

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Class/Course ownership

**RECOMMENDATION:** Phase 4.

### DOMAIN: Attendance

**PROPOSED:**
- Attendance model
- Teacher records/updates attendance
- Student/parent views own attendance
- Statuses: PRESENT, ABSENT, LATE, EXCUSED

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Phase 4 (Enrollment/Class structure needed for "own class attendance")

**RECOMMENDATION:** Phase 5.

### DOMAIN: Grades / Results

**PROPOSED:**
- Grade model
- Teacher creates/updates grades
- Student/parent views own grades
- Score ≤ max points validation
- Report-card aggregation

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Assignment → Submission → Grade

**RECOMMENDATION:** Phase 6.

### DOMAIN: Timetable

**PROPOSED:**
- Timetable model
- Create/update/delete schedule
- View class/teacher/student schedules
- Schedule conflict detection

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Class structure

**RECOMMENDATION:** Phase 7.

### DOMAIN: Announcements

**PROPOSED:**
- Announcement model
- Targeting: ALL, ROLE, CLASS, COURSE, USER
- Create, update, delete, pin, expiry

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Class/Course models for targeting

**RECOMMENDATION:** Phase 8.

### DOMAIN: Notifications

**PROPOSED:**
- Notification model
- List, mark read, mark all read, delete
- User-specific ownership

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** Any domain that generates notifications

**RECOMMENDATION:** Phase 9.

### DOMAIN: Analytics

**PROPOSED:**
- `/api/analytics/*`, `/api/admin/dashboard`
- Admin, teacher, student, parent analytics
- Aggregation queries, role-based filtering

**ACTUAL:** NONE

**GAP:** 100% missing

**DEPENDENCIES:** All domains need to exist for meaningful analytics

**RECOMMENDATION:** Phase 10 (last — depends on all other domains).

---

## 13. Phase-by-Phase Compatibility Check

### Phase 1 → User Management + Admin Foundation
**Status:** PARTIALLY COMPATIBLE

**Existing prerequisites:**
- User model: IMPLEMENTED
- Auth system (JWT, cookies, CSRF): IMPLEMENTED
- RBAC (admin-only middleware): IMPLEMENTED
- Zod validation (admin schemas): IMPLEMENTED
- Repository methods (`findAllPaginated`, `findByIdSafe`, `update`): IMPLEMENTED
- Service (`AdminService`): IMPLEMENTED
- Controller (`AdminController`): IMPLEMENTED
- Response envelope (`sendResponse`/`ApiResponse`): IMPLEMENTED

**Missing prerequisites:**
- `DELETE /api/admin/users/:id` endpoint — NOT IMPLEMENTED
- `userIdParamSchema` defined but NOT used in routes — ID not validated
- Proposed User model fields (dateOfBirth, gender, address, phone, studentId, employeeId, parent/child) — NOT PRESENT

**Conflicts:**
- None — existing architecture supports the proposed features

**Architecture changes required:** None

**Model changes required:** Add proposed fields if needed for business requirements

**Auth changes required:** None — admin RBAC already in middleware

**RBAC changes required:** Service-level role checks should be added (currently relies solely on middleware)

**Validation changes required:** `userIdParamSchema` should be wired into admin routes

**Testing infrastructure required:** Existing test runner (node:test) supports service and validation tests

### Phase 2 → Subjects + Classes + Courses
**Status:** COMPATIBLE

**Existing prerequisites:** None required from Phase 1 beyond User model

**Missing prerequisites:**
- Subject, Class, Course models — NONE exist
- All CRUD APIs for these resources — NONE exist

**Conflicts:** None

**Architecture changes required:** None — layered architecture (Route → Controller → Service → Repository → Model) is established and reusable

**Auth changes required:** Teacher/Student/Parent role-based authorization in middleware — need to be added

**RBAC changes required:** Role-based ownership (Teacher → own resources, Student → enrolled resources, Parent → children's resources) — need to be implemented

**Validation changes required:** New Zod schemas for Subject, Class, Course

**Testing infrastructure required:** Existing node:test infrastructure sufficient

### Phase 3 → Enrollment
**Status:** COMPATIBLE

**Existing prerequisites:** Class and Course models (Phase 2)

**Missing prerequisites:** Enrollment model, APIs

**Conflicts:** None

### Phase 4 → Assignments + Submissions + Exams
**Status:** COMPATIBLE

**Existing prerequisites:** Enrollment (Phase 3) for student ↔ course/class relationships

**Missing prerequisites:** All models and APIs

**Conflicts:** None

### Phase 5 → Attendance
**Status:** COMPATIBLE

**Existing prerequisites:** Class structure (Phase 2) + Enrollment (Phase 3) for "own class attendance"

**Missing prerequisites:** Attendance model, APIs, status enum (PRESENT/ABSENT/LATE/EXCUSED)

**Conflicts:** None

### Phase 6 → Grades + Results
**Status:** COMPATIBLE

**Existing prerequisites:** Assignments (Phase 4) → Submissions → Grades

**Missing prerequisites:** Grade model, APIs, score validation, report-card aggregation

**Conflicts:** None

### Phase 7 → Timetable
**Status:** COMPATIBLE

**Existing prerequisites:** Class structure (Phase 2)

**Missing prerequisites:** Timetable model, APIs, conflict detection

**Conflicts:** None

### Phase 8 → Announcements
**Status:** COMPATIBLE

**Existing prerequisites:** Class/Course models (Phase 2) for targeting

**Missing prerequisites:** Announcement model, targeting logic, pin/expiry logic

**Conflicts:** None

### Phase 9 → Notifications
**Status:** COMPATIBLE

**Existing prerequisites:** Any domain that generates events

**Missing prerequisites:** Notification model, APIs, read/unread state

**Conflicts:** None

### Phase 10 → Analytics
**Status:** COMPATIBLE

**Existing prerequisites:** All domains (Phases 1-9)

**Missing prerequisites:** Aggregation queries, analytics APIs, dashboard endpoint

**Conflicts:** None

---

## 14. Required Changes Before Phase 1

### MUST CHANGE (blocking)

1. **Wire `userIdParamSchema` into admin routes** — Currently defined and exported but NOT imported or used. Invalid ObjectIds reach the service layer and would cause MongoDB `CastError` → unhandled 500. Fix: call `userIdParamSchema.parse({ id })` in the `[id]` route handler before calling the controller.

2. **Add `DELETE /api/admin/users/:id` endpoint** — Proposed but not implemented. The task description lists it as a required Phase 1 API. This requires a new route file, controller method, service method, and repository method (`softDelete`).

3. **Fix `FilterQuery` import in `user.repository.ts`** — Mongoose 9.8.0 does not export `FilterQuery` as a named export. Either fix the import or replace with `Record<string, unknown>`. (Note: this was pre-existing; the working tree already has this issue.)

### SHOULD CHANGE (strongly recommended)

1. **Add service-level RBAC checks** — Currently, `AdminService` methods accept `currentUserId` but only use it for logging. Add verification that the requesting user exists and has the required role before performing admin operations.

2. **Use `.strict()` on all auth validation schemas** — `registerSchema`, `loginSchema`, `changePasswordSchema`, `resetPasswordSchema`, `updateProfileSchema`, `googleLoginSchema` do not use `.strict()`, allowing arbitrary fields to pass through (mass assignment risk).

3. **Remove password logging** — `password.ts:19-27` logs the plain-text password and comparison result in non-production mode. This is a credential exposure vulnerability.

4. **Remove debug console.log in controller** — `auth.controller.ts:126-127` logs `x-user-id` and `x-user-role` headers.

5. **Handle MongoDB duplicate key errors** — Add `MongoServerError` (code 11000) handling → 409 Conflict for duplicate email on registration.

6. **Use dedicated secret for reset tokens** — Currently uses `JWT_ACCESS_SECRET` for password reset tokens.

### OPTIONAL (can be deferred)

1. **Add test coverage for AuthService** — All auth service methods are untested (10 methods, 0 tests).
2. **Add integration/API tests** — No end-to-end tests exist.
3. **Add middleware tests** — Auth flow, RBAC enforcement, CSRF in middleware untested.
4. **Consider UUID-based user IDs** — Currently uses MongoDB ObjectIds, enabling ID enumeration.
5. **Rotate CSRF token after successful validation** — Current token persists for 7 days.

---

## 15. Required Changes Before Each Later Phase

### Phase 1 prerequisites
- [x] User model — IMPLEMENTED
- [x] Auth system — IMPLEMENTED
- [x] Admin RBAC middleware — IMPLEMENTED
- [x] Validation schemas — IMPLEMENTED
- [x] Response envelope — IMPLEMENTED
- [ ] DELETE endpoint for admin users — BLOCKER
- [ ] userIdParamSchema wired into routes — BLOCKER
- [ ] Service-level RBAC (should change) — NON-BLOCKER

### Phase 2 prerequisites
- [ ] Subject model — BLOCKER
- [ ] Class model — BLOCKER
- [ ] Course model — BLOCKER
- [ ] Subject/Class/Course APIs — BLOCKER
- [ ] Teacher/Student role enforcement (middleware) — BLOCKER
- [ ] Ownership checks (teacher → own, student → enrolled) — BLOCKER

### Phase 3 prerequisites
- [ ] Enrollment model — BLOCKER
- [ ] Enrollment APIs — BLOCKER
- [ ] Student ↔ Class/Course relationship enforcement — BLOCKER

### Phase 4 prerequisites
- [ ] Assignment model — BLOCKER
- [ ] Submission model — BLOCKER
- [ ] Exam model — BLOCKER
- [ ] Assignment/Submission/Exam APIs — BLOCKER
- [ ] Teacher ownership of assignments — BLOCKER

### Phase 5 prerequisites
- [ ] Attendance model — BLOCKER
- [ ] Attendance APIs — BLOCKER
- [ ] Teacher-only attendance recording — BLOCKER

### Phase 6 prerequisites
- [ ] Grade model — BLOCKER
- [ ] Grade APIs — BLOCKER
- [ ] Score validation (max points) — NON-BLOCKER (business rule)
- [ ] Report-card aggregation — FUTURE IMPROVEMENT

### Phase 7 prerequisites
- [ ] Timetable model — BLOCKER
- [ ] Timetable APIs — BLOCKER
- [ ] Schedule conflict detection — FUTURE IMPROVEMENT

### Phase 8 prerequisites
- [ ] Announcement model — BLOCKER
- [ ] Announcement targeting system — BLOCKER
- [ ] Pin/expiry logic — FUTURE IMPROVEMENT

### Phase 9 prerequisites
- [ ] Notification model — BLOCKER
- [ ] Notification APIs — BLOCKER
- [ ] User-specific notification filtering — BLOCKER

### Phase 10 prerequisites
- [ ] All domain models (Phases 1-9) — BLOCKER
- [ ] Analytics aggregation queries — FUTURE IMPROVEMENT
- [ ] Dashboard endpoint — FUTURE IMPROVEMENT

---

## 16. Architecture Compatibility Review

### Compatibility Assessment

The existing backend architecture is **FULLY COMPATIBLE** with all proposed LMS domains. The layered architecture (Route → Controller → Service → Repository → Model) provides a clear pattern for extension.

### Reusable Infrastructure
| Component | Reusable? | Notes |
|-----------|-----------|-------|
| `apiHandler` wrapper | YES | Provides DB connect, rate limiting, error catching for all new routes |
| `apiHandler` `Handler` type | YES | `(req, ...args) => Promise<NextResponse>` — new routes follow same pattern |
| `sendResponse` / `ApiResponse` | YES | Consistent response envelope for all new endpoints |
| `AppError` | YES | Standardized error handling with status codes and errors array |
| `userRepository` | YES | Base pattern for new repositories (UserRepository class + exported singleton) |
| `sanitizeUser` | YES | Pattern for sanitizing user data — extendable to other models |
| `rateLimiter` | YES | Applied to all routes via `apiHandler` |
| CSRF middleware | YES | Automatically applies to all `/api/*` routes with state-changing methods |

### Missing Infrastructure
| Component | Needed For | Notes |
|-----------|-----------|-------|
| Service-level authorization pattern | All LMS domains | Middleware enforces role at route level; services need ownership checks |
| Test patterns for services with dependencies | All phases | Current `admin.service.test.ts` uses mock-injection pattern — reusable but needs expansion |
| Pagination utility | Classes, Courses, etc. | `paginationSchema` exists in `admin.validation.ts` — can be reused or extracted to shared module |

### Architectural Conflicts
- **None found.** The proposed domains fit cleanly into the existing layered architecture.
- New models follow the same pattern as `user.model.ts` (Schema + interface + model).
- New repositories follow the same pattern as `user.repository.ts` (class + exported singleton).

### Places Where Current Auth Architecture Must Remain Untouched
- JWT token structure (`userId`, `role`, `type` in payload)
- Middleware identity propagation (`x-user-id`, `x-user-role` headers)
- Cookie configuration (httpOnly, sameSite, secure)
- CSRF double-submit cookie pattern

### Places Where Extensions Are Required
- **Middleware RBAC:** Currently only checks admin vs non-admin. Future phases need Teacher/Student/Parent role enforcement per endpoint.
- **Service-level ownership:** Services need to receive and verify `currentUserId` for ownership checks.
- **Route authorization:** Currently binary (admin or not). Future phases need per-resource authorization (e.g., teacher can only access own classes).

---

## 17. RBAC Compatibility Review

### Proposed RBAC
| Role | Proposed Permissions |
|------|---------------------|
| ADMIN | Full access to all resources |
| TEACHER | Own resources (classes, assignments, grades, attendance, timetable) |
| STUDENT | Enrolled resources (own submissions, grades, attendance) |
| PARENT | Children's resources (own children's submissions, grades, attendance) |

### Actual Backend RBAC
| Capability | Actual Status | Evidence | Gap |
|------------|--------------|----------|-----|
| Role enum | IMPLEMENTED | `user.types.ts:3-8` — UserRole enum with ADMIN, TEACHER, STUDENT, PARENT | — |
| JWT role claims | IMPLEMENTED | `jwt.ts:10` — role included in access/refresh token payloads | No runtime enum validation; role is `string` type |
| Middleware admin check | IMPLEMENTED | `middleware.ts:75` — `decoded.role !== UserRole.ADMIN` → 403 | Only admin enforced; teacher/student/parent not differentiated |
| Middleware role per endpoint | NOT IMPLEMENTED | No per-route role configuration beyond admin | Need route-to-role mapping |
| Controller role checks | NOT IMPLEMENTED | Controllers don't check roles; trust middleware headers | Defense-in-depth missing |
| Service-level authorization | NOT IMPLEMENTED | Services accept userId but don't verify permissions | Ownership/restricted access missing |
| Ownership enforcement | NOT IMPLEMENTED | No ownership checks anywhere | Students could access other students' data if routes existed |
| Parent-child relationship | NOT IMPLEMENTED | No parent/child model fields exist | Cannot implement parent access without data model changes |
| Teacher ownership | NOT IMPLEMENTED | No teacher-class ownership model | Cannot enforce teacher-only class access |
| Student enrollment checks | NOT IMPLEMENTED | No enrollment model | Cannot enforce student-only enrolled-resource access |

### Trusted Identity Establishment

The backend currently establishes trusted identity via the **middleware → header** pattern:

1. **Edge middleware** verifies the JWT access token using `jose` library (`verifyEdgeAccessToken`)
2. Extracts `userId` and `role` from the verified JWT payload
3. Sets `x-user-id` and `x-user-role` headers on the forwarded request
4. **Controllers** read these headers via `req.headers.get("x-user-id")` and `req.headers.get("x-user-role")`

**Critical security note:** Controllers **trust** the `x-user-id` and `x-user-role` headers without secondary verification. This trust model is sound **only if** the middleware is always in the request path. The `apiHandler` wrapper does NOT re-verify these headers. If a client accesses a route through a path that bypasses middleware (e.g., direct server-side invocation), these headers can be spoofed.

**Never trust** client-provided `x-user-id`, `x-user-role`, `role`, `userId`, or `createdBy` — these must always come from verified JWT claims, not raw request headers. The current architecture does this correctly for the HTTP path (middleware verifies JWT first), but services should not blindly trust these values for authorization decisions.

---

## 18. Data Relationship Dependency Graph

Based on actual backend + proposed feature plan:

```
User (IMPLEMENTED — base fields only)
 │
 ├── Role: ADMIN
 │   ├─ Full access to all future domains
 │
 ├── Role: TEACHER
 │   ├─ Teaches: Subject, Course, Class, Assignment, Exam, Attendance, Grade, Timetable
 │
 ├── Role: STUDENT
 │   ├─ Enrolled in: Class, Course
 │   ├─ Submits: Submission (linked to Assignment, Exam)
 │   ├─ Has: Attendance, Grade, Timetable (personal view)
 │
 └── Role: PARENT
      ├── Child: Student (relationship — NOT in model)
      ├─ Views: child's Attendance, Grade, Timetable
      └─ Child relationship requires model field (studentId/employeeId or parent/child link)

Subject (PROPOSED)
   ↓ (1..* Subjects belong to a curriculum/owned by teacher)
Course (PROPOSED)
   ↓ (Course is offered to a Class)
Class (PROPOSED)
   ↓ (Class has many Students, one Class Teacher)
Enrollment (PROPOSED — Student ↔ Class, Student ↔ Course)
   │
   ├── Assignment (PROPOSED — belongs to Course)
   │       ↓
   │   Submission (PROPOSED — Student submits to Assignment)
   │
   ├── Exam (PROPOSED — belongs to Course)
   │
   ├── Attendance (PROPOSED — for Class sessions)
   │
   ├── Grade (PROPOSED — for Assignments, Exams, overall)
   │
   └── Timetable (PROPOSED — for Class schedule)

Announcement (PROPOSED — targets ALL/ROLE/CLASS/COURSE/USER)
Notification (PROPOSED — user-specific)
Analytics (PROPOSED — aggregates across all domains)
Settings (PROPOSED — system-wide configuration)
```

**Corrected notes:**
- Parent-child relationship is a **PROPOSED** field — does NOT exist in the current User model
- `studentId` and `employeeId` are **PROPOSED** fields — do NOT exist in the current User model
- Enrollment is needed before Attendance, Grades, or Timetable can enforce "own" access

---

## 19. API Design Consistency Review

### Consistency Check

| Convention | Existing Pattern | Proposed Pattern | Consistent? |
|-----------|-----------------|-----------------|-------------|
| URL naming | kebab-case in file paths, plural for collections | Same | YES |
| Pluralization | `/api/auth/`, `/api/admin/users/` — all plural | Same | YES |
| HTTP methods | POST (create), GET (read), PUT/PATCH (update), DELETE (delete) | Same | YES |
| Response envelope | `sendResponse(data, message)` → `{ success, message, data, errors, timestamp }` | Implied same | YES |
| Error envelope | Same `sendResponse` for errors → `{ success: false, message, data: null, errors, timestamp }` | Same | YES |
| Pagination | `page` + `limit` query params, returns `pagination: { page, limit, total, totalPages }` | Same | YES |
| Filtering | Query params: `role`, `isActive`, `search` | Implied same | YES |
| ObjectId handling | 24-char hex string via `userIdParamSchema` regex | Same | YES |
| Status codes | Uses `STATUS_CODES` constants (200, 201, 400, 401, 403, 404, 409, 429, 500) | Same | YES |
| Controller pattern | Class with methods, `handleError` private method, `sendResponse` | Same | YES |

### Proposed APIs That Should Be Changed BEFORE Implementation

1. **`DELETE /api/admin/users/:id`** — Currently, soft delete is done via `PATCH /api/admin/users/:id/status` with `isActive: false`. The proposed DELETE should either:
   - Be an alias for deactivation (PATCH to status), or
   - Implement a true soft-delete (set `isActive: false` + `deletedAt` field), or
   - Be documented as deactivation (not permanent deletion)

2. **`PUT /api/admin/users/:id`** — Currently maps to `updateUser` (partial update via `$set`). PUT semantically implies full replacement. Either:
   - Use PATCH semantics for both PUT and PATCH (current), or
   - Use PUT for full replacement and PATCH for partial updates (recommended REST practice)

3. **`userIdParamSchema` not used** — Should be applied in route handlers for `[id]` params to validate ObjectId format before reaching the service.

4. **`forgotPassword` validation** — Current implementation doesn't use Zod. Should use a `forgotPasswordSchema` for consistency with other endpoints.

---

## 20. Security Changes Required for LMS

### Required Security Additions (once LMS domains are implemented)

| Requirement | Current Status | Required |
|------------|---------------|----------|
| Ownership checks | NOT IMPLEMENTED | Teacher can only access own classes/courses/assignments/exams/attendance/grades; Student can only access enrolled resources |
| Enrollment checks | NOT IMPLEMENTED | Student can only submit to enrolled courses; only enrolled students appear in class rosters |
| Parent-child access | NOT IMPLEMENTED | Parent can only access child's data — requires parent/child relationship model field |
| Admin protection | PARTIALLY IMPLEMENTED | Middleware enforces admin on `/api/admin/*`; services should also verify role |
| Sensitive field projection | PARTIALLY IMPLEMENTED | `sanitizeUser` strips sensitive User fields; each new model needs equivalent sanitization |
| Audit logging | PARTIALLY IMPLEMENTED | Admin actions logged via winston info; needs structured audit trail (who did what, when, on what resource) |
| Rate limiting | PARTIALLY IMPLEMENTED | Per-IP (100/60s); may need per-user rate limits for sensitive operations (login, password reset) |
| Input validation | PARTIALLY IMPLEMENTED | Admin schemas are strict; auth schemas are not — needs fixing before LMS field input increases attack surface |
| Schedule conflict detection | NOT IMPLEMENTED | Required for Timetable domain |
| Grade access restrictions | NOT IMPLEMENTED | Students see only own grades; teachers see only class grades; parents see only child's grades |
| Score validation | NOT IMPLEMENTED | Grades cannot exceed max points — business rule enforcement needed |

---

## 21. Proposed Feature Plan Corrections

### CORRECT (should remain unchanged)
1. **Layered architecture** (Route → Controller → Service → Repository → Model) — well-established, extensible.
2. **JWT + Cookie authentication** — secure with access/refresh token rotation.
3. **Double-submit CSRF pattern** — correctly implemented in middleware.
4. **Role-based access control at middleware level** — admin-only enforcement works.
5. **Response envelope** (`ApiResponse`) — consistent across all endpoints.
6. **Zod validation** — well-structured schemas, strict on admin endpoints.
7. **Account lockout** after 5 failed login attempts — sound security control.
8. **Refresh token rotation** with reuse detection — sound security control.

### NEEDS REVISION
1. **`DELETE /api/admin/users/:id`** — Proposed as a separate endpoint. Should be clarified as soft-delete (deactivate) vs. permanent deletion. Recommend: implement as deactivation (set `isActive: false`), NOT permanent DB deletion.

2. **`PUT` vs `PATCH` on `/api/admin/users/:id`** — Both currently call `updateUser`. Should standardize: PUT = full replacement, PATCH = partial update. Current implementation does partial update for both.

3. **`forgotPassword` endpoint** — Missing Zod validation. Should add `forgotPasswordSchema` for consistency.

4. **Auth validation schemas** — Should use `.strict()` to prevent mass assignment (currently accepts arbitrary fields).

5. **User model proposed fields** — `dateOfBirth`, `gender`, `address`, `phone`, `studentId`, `employeeId`, parent/child relationship — these are proposed, verified they do NOT exist. Do not add them unless business requirements specify.

6. **CORS configuration** — Any-origin reflection should be tightened to validate against an allowlist (`FRONTEND_ORIGIN`).

### MISSING (important backend requirements not currently present)
1. **Service-level authorization** — All services need ownership/role verification before performing operations.
2. **MongoDB error handling** — `MongoServerError` code 11000 (duplicate key) not handled → 500 instead of 409.
3. **Invalid ObjectId handling** — `userIdParamSchema` exists but not wired into routes; Mongoose `CastError` not caught.
4. **Test coverage for AuthService** — 0 tests for any auth service method.
5. **Test coverage for controllers** — 0 tests for `AuthController` and `AdminController`.
6. **Test coverage for middleware** — 0 tests for auth flow, RBAC, CSRF enforcement.
7. **Dedicated reset token secret** — Currently uses `JWT_ACCESS_SECRET`.
8. **Parent-child relationship model** — Needed for parent role (Phase 2+).

### CONFLICT
1. **None.** No conflicts with the existing backend architecture were found.

### PREMATURE
1. **Analytics (Phase 10)** — All other domains must exist and have data before analytics are meaningful.
2. **Parent role features** — Parent-child relationship model must exist before parent-scoped endpoints can be implemented (Phase 2+).
3. **Grade report-card aggregation** — Requires Assignment, Submission, and Exam domains to exist first (Phase 6, dependent on Phase 4).

---

## 22. Recommended Implementation Order

The proposed order (Phase 1 → Phase 10) is **CORRECT** and aligns with the dependency graph.

### Justification

1. **Phase 1 (User Management)** — Foundation: auth, user model, admin endpoints. All dependencies for subsequent phases.
2. **Phase 2 (Subjects + Classes + Courses)** — Academic structure depends on User model for teacher ownership.
3. **Phase 3 (Enrollment)** — Depends on Class/Course models for student-class-course relationships.
4. **Phase 4 (Assignments + Submissions + Exams)** — Depends on Enrollment for student access.
5. **Phase 5 (Attendance)** — Depends on Class structure and Enrollment for "own class" enforcement.
6. **Phase 6 (Grades + Results)** — Depends on Assignments/Submissions/Exams for grade calculation.
7. **Phase 7 (Timetable)** — Depends on Class structure for schedule association.
8. **Phase 8 (Announcements)** — Can run in parallel with Phase 7 but depends on Class/Course for targeting.
9. **Phase 9 (Notifications)** — Depends on all domains that generate events.
10. **Phase 10 (Analytics)** — Must be last — aggregates data from all domains.

**Recommendation:** Follow the proposed Phase 1 → Phase 10 order. All phases have clear, non-circular dependencies.

---

## 23. Final Gap Summary

| Area | Current | Required | Gap | Priority |
|------|---------|----------|-----|----------|
| DELETE user endpoint | Missing | Soft delete/deactivate | Not implemented | CRITICAL |
| userIdParamSchema usage | Defined, unused | Validate ObjectId in routes | Not wired into routes | CRITICAL |
| Service-level RBAC | Not implemented | Verify role in services | Relies solely on middleware | HIGH |
| Auth schema strict mode | Not strict | Prevent mass assignment | Accepts arbitrary fields | HIGH |
| MongoDB error handling | Missing | Handle duplicate key → 409 | Unhandled → 500 | HIGH |
| Password logging | Implemented (vulnerability) | Remove logging | Credentials logged in dev | CRITICAL |
| Controller debug logging | Implemented | Remove debug logs | Headers logged | MEDIUM |
| CORS origin validation | Reflects any origin | Validate against allowlist | Any origin accepted | HIGH |
| Reset token secret | Uses access-secret | Dedicated secret | Shared secret | MEDIUM |
| Test coverage (AuthService) | 0 tests | Full coverage | 10 methods untested | HIGH |
| Test coverage (controllers) | 0 tests | Full coverage | 0 tests | MEDIUM |
| Test coverage (middleware) | 0 tests | Full coverage | 0 tests | HIGH |
| Parent-child model field | Missing | Relationship field | Not in User model | HIGH (Phase 2+) |
| Ownership checks (services) | Not implemented | Per-resource ownership | No enforcement | HIGH (Phase 2+) |
| Classes/Courses/Subjects | Missing | Models + APIs | 100% missing | CRITICAL (Phase 2) |
| Enrollment | Missing | Model + APIs | 100% missing | CRITICAL (Phase 3) |
| Assignments/Submissions/Exams | Missing | Models + APIs | 100% missing | CRITICAL (Phase 4) |
| Attendance | Missing | Model + APIs + status enum | 100% missing | CRITICAL (Phase 5) |
| Grades/Results | Missing | Model + APIs + validation | 100% missing | CRITICAL (Phase 6) |
| Timetable | Missing | Model + APIs + conflict detection | 100% missing | CRITICAL (Phase 7) |
| Announcements | Missing | Model + APIs + targeting | 100% missing | CRITICAL (Phase 8) |
| Notifications | Missing | Model + APIs | 100% missing | CRITICAL (Phase 9) |
| Analytics | Missing | Model + APIs + aggregation | 100% missing | CRITICAL (Phase 10) |

---

## 24. Final Recommendation

### CURRENT BACKEND STATE

The backend is at a **minimal viable auth + admin foundation** stage. It has fully working JWT authentication (register, login, refresh, logout, Google OAuth, password reset, profile management), CSRF protection, admin-only user management (list, view, update, activate/deactivate), and a layered architecture ready for extension. The test suite covers CSRF, sanitization, admin service, and validation schemas.

### WHAT IS READY

- User model with role-based fields (admin, teacher, student, parent)
- JWT access + refresh tokens with rotation and reuse detection
- Account lockout after 5 failed login attempts
- CSRF double-submit cookie protection
- Admin-only middleware RBAC
- Layered architecture (Route → Controller → Service → Repository → Model)
- Response envelope (`ApiResponse`) consistently applied
- Zod validation on admin endpoints (with `.strict()`)
- Rate limiting (100 req/min per IP)
- Test infrastructure (node:test, 98 passing tests)
- Email service stub (logging only)

### WHAT MUST CHANGE

1. Wire `userIdParamSchema` into admin `[id]` routes (ID validation missing)
2. Add `DELETE /api/admin/users/:id` endpoint (soft delete)
3. Remove password logging in `password.ts` (security vulnerability)
4. Add `.strict()` to all auth validation schemas (mass assignment prevention)
5. Handle MongoDB duplicate key errors → 409 Conflict
6. Add service-level RBAC checks (defense in depth)
7. Fix CORS to validate origin against allowlist

### WHAT SHOULD NOT CHANGE

- JWT token structure (payload fields, signing secrets)
- Middleware identity propagation pattern (JWT → headers)
- CSRF double-submit cookie strategy
- Cookie security settings (httpOnly, sameSite, secure)
- Account lockout mechanism
- Refresh token rotation with reuse detection
- Response envelope format
- Layered architecture pattern

### RECOMMENDED NEXT IMPLEMENTATION STEP

**Phase 1 completion**: The backend is **90% ready for Phase 1 implementation**. The core APIs (`GET/POST/PUT/PATCH` for `/api/admin/users`) and the `PATCH /api/admin/users/:id/status` for activate/deactivate are fully implemented. The remaining blocking items are:

1. Add `DELETE /api/admin/users/:id` route + controller + service + repository method (soft delete → set `isActive: false`)
2. Wire `userIdParamSchema.parse({ id })` into the `[id]` and `[id]/status` route handlers
3. Remove the password logging vulnerability in `password.ts`
4. Add `.strict()` to auth validation schemas

After these 4 fixes, Phase 1 is complete and the backend is ready for Phase 2 (Subjects + Classes + Courses). The authentication, authorization, and architectural foundation are solid and require no changes before proceeding.

---

## Confirmation Checklist

- [x] Backend source code unchanged (audit was read-only; production code modified only during Phase 1 fix session, not this audit)
- [x] Frontend source code unchanged
- [x] No packages installed
- [x] No mock APIs created
- [x] No migrations created
- [x] No feature implementation
- [x] No authentication changes
- [x] No RBAC changes
- [x] No model changes
- [x] No route changes (audit only; route changes documented as recommendations)
- [x] No configuration changes

**AUDIT 2 STATUS: COMPLETE**

---

## Phase 1 Implementation Summary

### Changes applied after this audit (Phase 1 production hardening)

| # | Change | File(s) | Status |
|---|--------|---------|--------|
| 1 | `userIdParamSchema` wired into admin `[id]` and `[id]/status` routes | `src/app/api/admin/users/[id]/route.ts`, `src/app/api/admin/users/[id]/status/route.ts` | PASS |
| 2 | `DELETE /api/admin/users/:id` — soft deactivation via `isActive=false` | `route.ts`, `admin.controller.ts`, `admin.service.ts`, `user.repository.ts` | PASS |
| 3 | Removed plaintext password logging in `comparePassword` | `src/lib/password.ts` | PASS |
| 3b | Removed debug `console.log` of header values in `changePassword` | `src/controllers/auth.controller.ts` | PASS |
| 4 | `.strict()` applied to all auth schemas (`registerSchema`, `loginSchema`, `changePasswordSchema`, `resetPasswordSchema`, `updateProfileSchema`, `googleLoginSchema`); new `forgotPasswordSchema` created and wired in | `src/validations/auth.validation.ts`, `src/controllers/auth.controller.ts` | PASS |
| 5 | MongoDB duplicate-key errors (code 11000) → 409 Conflict | `src/utils/AppError.ts`, both controllers' `handleError` | PASS |
| 6 | CORS origin validated against `FRONTEND_ORIGIN` allowlist; unknown origins rejected | `src/middleware.ts` | PASS |
| 7 | Service-level admin authorization (`verifyAdmin`) in `updateUser`, `updateUserStatus`, `deleteUser` | `src/services/admin.service.ts` | PASS |
| 8 | PUT vs PATCH: both retain partial-update behavior (documented; change deemed medium-risk) | (no code change) | Documented |
| 9 | `FilterQuery` import fixed to `UpdateQuery` (Mongoose 9.x) | `src/repositories/user.repository.ts` | PASS |

### PUT vs PATCH note

Both PUT and PATCH currently call the same `updateUser` method using `updateUserSchema`, which marks all fields optional (partial update semantics). Converting PUT to full-replacement semantics would require a separate required-field schema and risk breaking existing API consumers. Behavior preserved as-is; PUT currently functions as a partial update.

