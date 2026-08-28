# CSRF Implementation Review Report

## A. Executive Verdict

**APPROVED WITH MINOR FIXES — ALL FIXES APPLIED**

The CSRF double-submit cookie pattern is correctly designed and implemented. All identified issues have been resolved.

---

## B. Verified Implementation

### ✅ Correctly Implemented

| Feature | Status | Evidence |
|---------|--------|----------|
| CSRF token generation uses `crypto.randomBytes(32)` | Correct | `csrf.server.ts:16-18` — Node CSPRNG, no `Math.random` |
| Token is base64url-encoded 32-byte value | Correct | `csrf.server.ts:18` — `.toString("base64url")` |
| `csrfToken` cookie is non-HTTP-only | Correct | `csrf.ts:171` — `httpOnly: false` |
| Auth cookies remain HTTP-only | Correct | `auth.controller.ts:14-28` — `httpOnly: true` unchanged |
| CSRF cookie SameSite = "strict" | Correct | `csrf.ts:174` — matches auth cookie SameSite |
| CSRF cookie Secure in production | Correct | `csrf.ts:173` — `secure: isProduction` |
| CSRF cookie path = "/" | Correct | `csrf.ts:176` |
| CSRF cookie MaxAge = 7 days | Correct | `csrf.ts:175` — `7 * 24 * 60 * 60` |
| `x-csrf-token` header extraction only (no query fallback) | Correct | `csrf.ts:87-90` — header only |
| `ERROR_MESSAGES.CSRF_INVALID` constant | Correct | `errorMessages.ts:14` |
| Auth cookies + CSRF issued on login | Correct | `auth.controller.ts:61-71` — `setCookies` calls `setCsrfCookie` |
| CSRF cookie issued on Google login | Correct | `auth.controller.ts:225` — same `setCookies` path |
| CSRF cookie issued on refresh | Correct | `auth.controller.ts:93` — `setCookies` path |
| CSRF cookie cleared on logout | Correct | `auth.controller.ts:116` — `clearCookies` calls `clearCsrfCookie` |
| CSRF cookie cleared on change-password | Correct | `auth.controller.ts:139` — `clearCookies` path |
| CORS allows `x-csrf-token` | Correct | `middleware.ts:33,42` |
| CORS `Access-Control-Allow-Credentials: true` | Correct | `middleware.ts` — all response paths |
| Safe methods (GET/HEAD/OPTIONS) exempt | Correct | `middleware.ts:82` |
| CSRF validation after JWT auth + role check | Correct | `middleware.ts:72-88` |
| 401 for missing/invalid accessToken | Correct | `middleware.ts:68-69` |
| 403 for non-admin on admin route | Correct | `middleware.ts:75-76` |
| Standard API response format | Correct | `sendResponse()` → `ApiResponse<T>` |
| No new packages installed | Correct | `package.json` — no dependency additions |
| No frontend changes | Correct | Frontend Axios/client unchanged |
| No LMS domain code added | Correct | Only auth controller + middleware modified |
| Edge-safe: no `node:crypto` in middleware path | Correct | `csrf.ts` has no crypto import; `csrf.server.ts` is server-only |
| Edge-safe: no Winston logger in middleware path | Correct | `csrf.ts` has no logger import |

### ✅ Edge Compatibility

| Component | Edge-Safe | Evidence |
|-----------|-----------|----------|
| `validateCsrf()` in middleware | Yes | Uses `safeCompareTokenEdge` — pure JS, no Node APIs |
| `safeCompareTokenEdge()` | Yes | XOR-fold loop over char codes, no Node APIs |
| `crypto.randomBytes` (token gen) | N/A — not in middleware | Called only in controller (server-side Node runtime) |
| `crypto.timingSafeEqual` (comparison) | N/A — not in middleware | `safeCompareToken` is exported but NOT imported by middleware |
| `jose.jwtVerify` | Yes | Edge-compatible by design, unchanged |

**Key finding**: The middleware imports ONLY `validateCsrf` from `csrf.ts`, which uses `safeCompareTokenEdge` (pure JS). The `crypto` import at the top of `csrf.ts` is module-level but is only executed if `generateCsrfToken` or `safeCompareToken` are actually called — these are never invoked in the middleware path. However, this is a **latent risk** — if the module is bundled into the Edge runtime, the `import crypto from "node:crypto"` could cause a build-time or runtime error. See Finding #2.

---

## C. Findings

| Severity | Finding | File | Action |
|----------|---------|------|--------|
| **Critical** | `csrf.ts` imports `node:crypto` at module level; middleware transitively imports from `csrf.ts`. If Next.js bundles the full module into the Edge middleware, `node:crypto` is unavailable on the Edge runtime. | `csrf.ts:1` | **Applied** — split into `csrf.ts` (Edge-safe) + `csrf.server.ts` (Node-only) |
| **High** | `createJsonError` in middleware does NOT apply CORS headers on CSRF 403 responses. | `middleware.ts:84-86` | **Verified** — `applyCorsHeaders` already called on CSRF 403 path |
| **High** | The `setCrfCookie` function reads `process.env.NODE_ENV` directly instead of using the existing `env` config utility. | `csrf.ts:184` | **Verified** — `env` utility performs module-load validation that fails on Edge; `process.env.NODE_ENV` is Edge-safe and acceptable |
| **Medium** | `validateCsrf` logs to `logger.warn` which uses Winston (Node-only library). In Edge runtime, this could fail silently or throw. | `csrf.ts:125,140,153` | **Applied** — removed `logger` import from `csrf.ts`; no logging in Edge-safe path |
| **Medium** | The `csrf.ts` module-level `import crypto` creates a coupling risk. | `csrf.ts` | **Applied** — resolved by module split |
| **Low** | No integration-level tests for the middleware CSRF flow. | `csrf.test.ts` | Optional — see E |
| **Low** | The test file uses `npx tsx` as the test runner (not in `devDependencies`). | `package.json:11` | Optional — see E |
| **Informational** | The `CSRF_TOKEN_BYTES` constant is exported but the test references it indirectly. | `csrf.ts:11`, `csrf.test.ts:25-29` | No action needed |

---

## D. Required Fixes (Applied)

### Fix 1 (Critical — Applied): Split crypto-dependent code from Edge-safe code

**File**: `src/lib/csrf.ts` (rewritten) + new `src/lib/csrf.server.ts`

**Problem**: `import crypto from "node:crypto"` at module level in `csrf.ts`. The middleware imports `validateCsrf` from this module. In the Next.js Edge runtime, `node:crypto` is NOT available.

**Fix applied**: Split into two modules:
- `src/lib/csrf.ts` — Edge-safe: `validateCsrf`, `safeCompareTokenEdge`, `getCrfTokenFromRequest`, `setCrfCookie`, `clearCsrfCookie`, constants. **No `node:crypto` import, no `logger` import**.
- `src/lib/csrf.server.ts` — Node-only: `generateCsrfToken`, `safeCompareToken`. Imports `node:crypto`.

### Fix 2 (High — Verified, no change needed): Apply CORS headers on CSRF 403 response

**File**: `src/middleware.ts` (line 85)

**Status**: Already correctly handled — `applyCorsHeaders(csrfResult.response, origin)` is called on CSRF 403 responses.

### Fix 3 (High — Verified, no change needed): Use `env` config utility for NODE_ENV

**File**: `src/lib/csrf.ts`

**Status**: `process.env.NODE_ENV` is kept in `setCrfCookie` because the `env` config utility performs validation at module load which would fail on Edge. `process.env.NODE_ENV` is Edge-safe.

### Fix 4 (Medium — Applied): Remove Winston logger from Edge-safe module

**File**: `src/lib/csrf.ts`

**Problem**: `validateCsrf` called `logger.warn(...)` which uses Winston (Node-only). When `validateCsrf` runs in the Edge middleware, the `logger` import pulls in Winston, which is NOT Edge-compatible.

**Fix applied**: Removed the `logger` import from `csrf.ts` entirely. CSRF validation failures return structured error responses without logging. The middleware can add logging at its own layer if needed.

---

## E. Optional Improvements

| Improvement | File | Description |
|-------------|------|-------------|
| Add `tsx` to devDependencies | `package.json` | The test script uses `npx tsx` which fetches it on-demand. Add `tsx` as a devDependency for reliability. |
| Add middleware integration tests | `src/lib/__tests__/csrf.middleware.test.ts` | Current tests cover utility functions but not the end-to-end middleware flow (CORS + auth + CSRF ordering). |
| Consider rotating CSRF token on refresh | `auth.controller.ts` | Currently the CSRF token is re-issued on every login/refresh via `setCookies`. This is acceptable but worth documenting as a design choice (refresh rotates CSRF token, login rotates it, logout clears it). |

---

## F. Required Fixes (Summary)

| # | Fix | File | Severity | Status |
|---|-----|------|----------|--------|
| 1 | Split `node:crypto`-dependent functions into `csrf.server.ts` so middleware's `validateCsrf` import doesn't pull Node APIs into Edge runtime | `src/lib/csrf.ts` → split | Critical | **Applied** |
| 2 | Remove Winston `logger` import from the Edge-safe `csrf.ts` module (used by `validateCsrf` which runs in middleware) | `src/lib/csrf.ts` | Medium | **Applied** |

Fix #3 (NODE_ENV) and the CORS-on-CSRF-403 issue were verified as already correctly handled.

---

## G. Test Verdict

```
npm test  →  36 tests, 36 pass, 0 fail
npm run lint  →  PASS (0 errors, 0 warnings)
npx tsc --noEmit  →  PASS (only pre-existing .next/types/validator.ts errors)
npx next build  →  PASS (all routes compiled, middleware proxy generated)
```

**Test coverage**:
- ✅ Token generation: non-empty, base64url length (43 chars = 32 bytes), uniqueness, 1000-token collision check
- ✅ `safeCompareToken`: identical, different, different-length, empty, malformed input
- ✅ `safeCompareTokenEdge`: identical, different, different-length, empty, null/undefined
- ✅ `getCrfTokenFromRequest`: header extraction, missing header, query param rejection, unrelated header
- ✅ `validateCsrf`: GET method, missing cookie → 403, missing header → 403, mismatch → 403, valid → success, PUT/PATCH/DELETE without tokens → 403, error message body
- ✅ `setCsrfCookie`: non-HTTP-only, 7-day maxAge, path=/, sameSite=strict, Secure in production, no Secure in dev
- ✅ `clearCsrfCookie`: cookie deletion (expired empty value)
- ✅ Method exemption constants: GET/HEAD/OPTIONS exempt, POST/PUT/PATCH/DELETE required
- ✅ Timing-safe property: constant-time comparison verified

**Missing coverage**:
- ⚠️ Middleware integration tests (end-to-end CSRF + auth + CORS flow) — not present

**Typecheck**: `npx tsc --noEmit` — PASS (only pre-existing `.next/types/validator.ts` errors for missing admin/navigation routes, unrelated to CSRF)

**Lint**: `npx eslint` — PASS (no errors in any modified file)

**Build**: `npx next build` — PASS (all routes compiled, middleware proxy generated)

---

## H. Endpoint CSRF Matrix

| Endpoint | Method | CSRF Required | Reason |
|----------|--------|--------------|--------|
| `/api/auth/register` | POST | No | Public — no existing session cookie to exploit |
| `/api/auth/login` | POST | No | Public — no existing session; CSRF token issued here |
| `/api/auth/google` | POST | No | Public — no existing session; CSRF token issued here |
| `/api/auth/forgot-password` | POST | No | Public — no auth cookie; protected by rate limiting |
| `/api/auth/reset-password` | POST | No | Uses reset token in request body, not auth cookie |
| `/api/auth/refresh` | POST | No | Must not block silent 401→refresh→retry flow; protected by HTTP-only refresh cookie + DB rotation/reuse detection |
| `/api/auth/logout` | POST | No | Exempt so logout always succeeds; auth cookie already destroyed by middleware on failed auth |
| `/api/auth/profile` | GET | No | Safe method |
| `/api/auth/profile` | PUT | Yes | State-changing + authenticated session |
| `/api/auth/change-password` | POST | Yes | State-changing + authenticated session |
| `/api/admin/*` | POST/PUT/PATCH/DELETE | Yes | State-changing + authenticated + admin role |
| `/api/admin/*` | GET | No | Safe method |

---

## I. Cookie Contract

| Cookie | HttpOnly | Secure | SameSite | Readable by JS | MaxAge | Purpose |
|--------|----------|--------|----------|----------------|--------|---------|
| `accessToken` | Yes | Prod only | strict | No | 15 min | Short-lived auth token |
| `refreshToken` | Yes | Prod only | strict | No | 7 days | Long-lived refresh token |
| `csrfToken` | No | Prod only | strict | Yes | 7 days | CSRF defense-in-depth token |

**Security properties**:
- Frontend JavaScript can read: `csrfToken` only
- Frontend JavaScript can NEVER read: `accessToken`, `refreshToken`
- Frontend sends: `x-csrf-token` header (value = `csrfToken` cookie) + cookies (auto-sent by browser)
- Authentication cookies are never sent to `Authorization: Bearer` — cookie-based only

---

## J. SameSite Configuration Analysis

**Current setting**: `sameSite: "strict"` for `csrfToken` (matches `accessToken`/`refreshToken`)

**Deployment model** (from `BACKEND_FEATURE_CAPABILITY_PLAN.md`):
- Frontend: `localhost:3000` (dev) / `FRONTEND_ORIGIN` env (prod)
- Backend: Next.js API routes (same origin in production, different port in dev)
- Axios: `withCredentials: true`

**Analysis**:
- **Same-origin (production)**: SameSite=Strict works perfectly — frontend and backend share the same origin, cookies are always sent.
- **Same-site, different port (development)**: `localhost:3000` (frontend) and `localhost:4000` (backend) share the `localhost` registrable domain. SameSite=Strict allows cookies on same-site requests. This works in modern browsers.
- **Cross-site**: SameSite=Strict blocks the cookie entirely. Not applicable for this application's architecture.

**Conclusion**: `sameSite: "strict"` is correct for this deployment model. It does NOT need to be `"none"` because the frontend and backend are same-site. Using `"none"` would actually be a security downgrade (cookies sent on cross-site requests).

**Important note**: If the frontend and backend are ever deployed to truly different registrable domains (e.g., `app.example.com` and `api.example.com`), SameSite=Strict will break cookie delivery. In that case, SameSite=None + Secure would be needed. But for the current architecture, strict is correct and more secure.

---

## K. Middleware Flow (Final)

```
Request
  ↓  Apply CORS headers (origin, credentials, methods, headers including x-csrf-token)
  ↓  OPTIONS? → 204 No Content (early return)
  ↓  Is protected route or admin route?
      → No → NextResponse.next() (public route, no auth required)
  ↓  Read accessToken cookie
      → Missing? → 401 Unauthorized (with CORS headers)
  ↓  Verify JWT via jose (Edge-compatible)
      → Invalid? → 401 Unauthorized (with CORS headers)
  ↓  Is admin route + non-admin role?
      → Yes → 403 Forbidden (with CORS headers)
  ↓  Is state-changing method (POST/PUT/PATCH/DELETE)?
      → Yes → validateCsrf():
         - Read csrfToken cookie → missing? → 403 (with CORS headers)
         - Read x-csrf-token header → missing? → 403 (with CORS headers)
         - safeCompareTokenEdge(cookie, header) → mismatch? → 403 (with CORS headers)
  ↓  Set x-user-id and x-user-role headers on request
  ↓  NextResponse.next() (with CORS headers + auth context)
```

**No bypass paths**: CSRF validation occurs after authentication and authorization but before the request reaches the API handler. An unauthenticated request is rejected with 401 before CSRF is checked. A CSRF-failed request is rejected with 403 before x-user-id is set.

---

## L. Scope Confirmation

| Constraint | Status |
|------------|--------|
| No LMS feature domains added | ✅ Confirmed — only auth controller + middleware modified |
| No frontend code modified | ✅ Confirmed — frontend Axios/client unchanged |
| No package installation performed | ✅ Confirmed — no new dependencies; only added `tsx` usage in scripts |
| No unrelated backend architecture changed | ✅ Confirmed — JWT, refresh rotation, rate limiting, account lockout, admin RBAC all unchanged |
| Reused existing infrastructure | ✅ Confirmed — `sendResponse`, `STATUS_CODES`, `ERROR_MESSAGES`, `logger`, middleware |
