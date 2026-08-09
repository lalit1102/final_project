# LearnSphere Frontend Architecture

## A. Project Overview

### LearnSphere Frontend Purpose

The LearnSphere frontend is a Next.js 16 App Router application providing the user-facing interface for an enterprise School LMS. It handles:

- Authentication (login, register, logout, password reset, Google OAuth)
- Protected dashboard application shell
- Role-based navigation and page visibility
- Forms with validation (React Hook Form + Zod)
- Ant Design v6 UI system with light/dark themes
- Responsive layout (sidebar, header, content, footer, breadcrumb)

### Frontend Responsibilities

1. **UI Rendering:** Ant Design v6 + CSS Modules
2. **Client-side Routing:** Next.js App Router
3. **State Management:** Redux Toolkit for global UI state (theme, sidebar collapsed)
4. **Form Handling:** React Hook Form + Zod (mirroring backend validation schemas)
5. **Authentication State:** React Context (AuthContext) — session state via API calls, not tokens
6. **Authorization (UI layer):** Role-based navigation visibility (UX-only, not security)
7. **API Communication:** Axios with `withCredentials: true`, automatic token refresh

### Backend Responsibilities

The backend (`backend/`) is the **source of truth**:

- API route handling (Next.js API routes in `src/app/api/auth/`)
- Authentication: JWT access (15 min) + refresh (7 days) tokens in HTTP-only cookies
- Authorization: middleware-based via `x-user-id` + `x-user-role` headers
- Role enforcement: ADMIN route protection in middleware for `/api/admin/*`
- Password hashing: bcryptjs (12 rounds)
- Input validation: Zod 4.4.3 schemas
- Database: MongoDB (Mongoose 9.8.0)
- Rate limiting: 100 requests/60 seconds per IP
- CORS configuration (in middleware)
- Standardized response/error format

### Frontend/Backend Boundary

| Frontend | Backend |
|----------|---------|
| Next.js 16 App Router | Next.js 16 API Routes |
| React 19 | Node.js / Edge Runtime |
| Ant Design v6 | MongoDB (Mongoose) |
| Redux Toolkit (UI state only) | JWT (jsonwebtoken + jose) |
| Axios (withCredentials: true) | bcryptjs (12 rounds) |
| React Hook Form + Zod | Zod 4 validation |
| React Context (auth state) | rate-limiter-flexible |
| CSS Modules | winston logging |
| Reads role from /profile API | Sets role in JWT + cookies |
| Reads auth state via /profile | Enforces auth via middleware |
| NEVER reads HTTP-only cookies | NEVER exposes tokens to frontend JS |

**Critical boundary rules:**
- The frontend **never** reads HTTP-only cookies (`accessToken`, `refreshToken`)
- The frontend **never** stores tokens in `localStorage` or `sessionStorage`
- The frontend **never** sets `Authorization: Bearer` headers
- The frontend **never** decodes JWT tokens client-side
- Auth state is determined **only** via `GET /api/auth/profile`
- Roles are determined **only** from the profile response `data.role`
- Frontend role-based navigation is **UX-only** — backend enforces auth

---

## B. Backend → Frontend Integration Flow

```
Browser
   │
   ▼
Next.js App Router (frontend)
   │
   ├── Public Routes (/login, /register, /forgot-password, /reset-password)
   │       │
   │       ▼
   │   Axios (withCredentials: true)
   │       │
   │       ▼
   │   Backend API (/api/auth/login, /register, /forgot-password, /reset-password)
   │       │
   │       ▼
   │   AuthController → AuthService → UserRepository → MongoDB
   │       │
   │       ▼
   │   HTTP-only cookies set on response (accessToken 15m, refreshToken 7d)
   │
   └── Protected Dashboard Routes (/dashboard/*)
          │
          ▼
     Auth Boundary (AuthContext checks /api/auth/profile)
          │
          ▼
     Axios (withCredentials: true)
          │
          ▼
      Backend API (/api/auth/profile, etc.)
          │
          ▼
     Middleware (src/middleware.ts) → Controller → Service → Repository → MongoDB
```

---

## C. Authentication Flow

```
User submits login form
    ↓
Frontend: POST /api/auth/login (withCredentials: true)
    ↓
Backend: AuthController.login() → AuthService.login()
    ↓
Backend: bcrypt compare, generateAccessToken, generateRefreshToken
    ↓
Backend: AuthController.setCookies():
  - accessToken: httpOnly, sameSite=strict, path=/, maxAge=900s, secure=prod only
  - refreshToken: httpOnly, sameSite=strict, path=/, maxAge=604800s, secure=prod only
    ↓
Backend returns: { success: true, data: { user: { id, name, email, role } } }
    ↓
Frontend: AuthContext.login() — stores user object (NOT the token)
    ↓
Frontend: Redirect to /dashboard
    ↓
On every protected request:
    ↓
Frontend: Axios sends request (cookies auto-sent via withCredentials: true)
    ↓
Backend middleware: verifies accessToken cookie via jose.jwtVerify
    ↓
Middleware sets x-user-id + x-user-role headers
    ↓
Protected route handler reads x-user-id header
```

**Session restoration on page refresh:**
```
Page loads
    ↓
RootLayout → AuthProvider initializes
    ↓
AuthProvider: GET /api/auth/profile (withCredentials: true)
    ↓
If 200: store user in context, isAuthenticated = true
If 401: isAuthenticated = false, redirect to /login
```

**Token refresh flow (401 → refresh → retry):**
```
API request receives 401
    ↓
Axios response interceptor catches 401
    ↓
POST /api/auth/refresh (withCredentials: true, NO body)
    │  NOTE: /api/auth/refresh is NOT in protectedRoutes in middleware,
    │        so it doesn't require an accessToken. It reads refreshToken cookie directly.
    │
    ▼
Backend: AuthService.refresh(refreshToken)
  - verifyRefreshToken (checks type === 'refresh')
  - UserRepository.findById(decoded.userId)
  - UserRepository.findByEmail(user.email) — selects +refreshToken
  - Compare DB refreshToken vs cookie token (rotation check)
  - If mismatch: revoke all (set refreshToken: null), throw 401
  - If match: generate NEW accessToken + refreshToken
  - UserRepository.update(userId, { refreshToken: newRefreshToken })
  - setCookies() — updates both cookies
    ↓
Frontend: retry original request (withCredentials: true)
    ↓
If refresh also returns 401: AuthContext clears state, redirect to /login
```

**AuthProvider necessity:** The frontend **requires** an auth state management mechanism (AuthContext). The backend returns user data in the login response and via `/api/auth/profile`. The frontend needs to:
1. Call `/api/auth/profile` on app load to restore the session
2. Store the user object (NOT tokens) in React Context
3. Provide `login()`, `logout()`, `isAuthenticated` to the app
4. Handle 401 → redirect to login

This cannot be done with RTK Query alone because:
- Auth state must be available during layout rendering (before page components mount)
- The 401 → refresh → retry logic is easier in Axios interceptors
- Auth state changes affect global layout (show/hide sidebar), not just query cache

**Conclusion:** AuthProvider (React Context) is **necessary and appropriate** for this backend's cookie-based auth model. It complements, not replaces, Redux (which is used for UI state only).

---

## D. Authorization / RBAC

### Actual Roles

From `backend/src/types/user.types.ts`:
```typescript
enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}
```

### Actual Permissions

The `User` model has a `permissions: string[]` field (default `[]`), but it is **NOT USED** in any backend auth flow. Authorization is **role-based only**.

### How Authorization is Enforced

**Backend (authoritative):**
- Middleware runs on every `/api/*` request
- Protected routes (require valid `accessToken` cookie):
  - `/api/auth/profile` (GET, PUT)
  - `/api/auth/logout`
  - `/api/auth/change-password`
  - Missing/invalid token → 401
- Admin routes (require valid `accessToken` cookie + `role === "ADMIN"`):
  - `/api/admin/*` — non-admin → 403
- Middleware sets `x-user-id` and `x-user-role` headers; controllers read them
- Public routes (no auth required): login, register, refresh, forgot-password, reset-password, google

**Frontend (UX layer only):**
- Role from `/api/auth/profile` response determines visible navigation items
- Hiding admin pages from non-admins is UX convenience, not security
- Backend will return 403/401 regardless of what the frontend shows

### Frontend Role Representation

**`src/constants/roles.ts`:**
```typescript
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}
```

**This is a compile-time mirror of the backend enum values. It is NOT authoritative for security/authorization.** The backend's `UserRole` enum in `src/types/user.types.ts` is the source of truth. The frontend enum must match the backend's string values exactly, but the frontend should never rely on these values for access control decisions — only for UI visibility.

### Role-Based Navigation Strategy

Since the backend has **no `/api/navigation` endpoint**, the frontend defines its own navigation configuration with role-based visibility.

**Navigation is configuration-driven:** `src/config/navigation.ts` — defines menu structure with `roles: UserRole[]` visibility per item.

Visibility rules:
| Role   | Navigation Access |
|--------|-------------------|
| ADMIN  | All pages |
| TEACHER| Dashboard, classes, assignments, grades, attendance |
| STUDENT| Dashboard, my classes, assignments, results |
| PARENT | Dashboard, children overview, reports |

Navigation config is filtered at render time using `useAuth().user.role`.

---

## E. Frontend Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.11 (App Router) |
| Runtime | React 19.2.4 |
| Language | TypeScript 5 (strict) |
| UI Library | Ant Design v6 |
| CSS | CSS Modules + Ant Design tokens |
| Global UI State | Redux Toolkit (UI state only) |
| Auth State | React Context (AuthContext) |
| HTTP Client | Axios 1.x |
| Forms | React Hook Form + Zod |
| Server State | Axios + hooks (NOT RTK Query) |

### Key Decision: Axios for ALL API Calls

The frontend uses **Axios with `withCredentials: true`** for all API communication. RTK Query is **not used** because:

1. The backend uses HTTP-only cookies — RTK Query's caching adds complexity without benefit
2. The 401 → refresh → retry flow is simpler in Axios interceptors
3. The backend's standardized response format is easily normalized in Axios interceptors

Redux Toolkit is used only for **global UI state** (theme, sidebar state).

### Separation of Concerns

```
UI               (components/) — pure presentation
Business Logic   (features/, hooks/)
API              (services/ — Axios instance + interceptors)
State            (store/ for UI, contexts/ for auth)
Configuration    (config/)
Types            (types/)
Utilities        (utils/)
Constants        (constants/)
```

---

## F. Feature-Based Folder Structure

```
frontend/
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
├── ARCHITECTURE.md
├── public/
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   ├── reset-password/page.tsx
    │   │   └── layout.tsx
    │   ├── (dashboard)/
    │   │   ├── dashboard/page.tsx
    │   │   └── layout.tsx
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── error.tsx
    │   └── not-found.tsx
    ├── components/
    │   ├── providers/
    │   │   ├── AntdProvider.tsx
    │   │   └── ThemeProvider.tsx
    │   ├── navigation/
    │   │   └── iconMap.tsx
    │   └── common/
    │       ├── PageContainer/
    │       ├── PageHeader/
    │       ├── Breadcrumb/
    │       ├── StatusTag/
    │       ├── EmptyState/
    │       ├── ErrorState/
    │       ├── LoadingState/
    │       ├── ConfirmDialog/
    │       └── FormField/
    ├── features/
    │   └── auth/
    │       ├── components/
    │       │   ├── LoginForm.tsx
    │       │   ├── RegisterForm.tsx
    │       │   ├── ForgotPasswordForm.tsx
    │       │   ├── ResetPasswordForm.tsx
    │       │   └── GoogleLoginButton.tsx
    │       ├── contexts/
    │       │   └── AuthContext.tsx
    │       ├── hooks/
    │       │   └── useAuth.ts
    │       ├── schemas/
    │       │   └── auth.schemas.ts
    │       ├── services/
    │       │   └── auth.service.ts
    │       └── types/
    │           └── auth.types.ts
    ├── layouts/
    │   └── DashboardLayout/
    │       ├── DashboardLayout.tsx
    │       ├── Sidebar/
    │       ├── Header/
    │       ├── Breadcrumb/
    │       ├── Content/
    │       └── Footer/
    ├── services/
    │   ├── apiClient.ts
    │   └── interceptors/
    ├── store/
    │   ├── index.ts
    │   ├── rootReducer.ts
    │   └── slices/
    │       ├── uiSlice.ts
    │       └── index.ts
    ├── hooks/
    │   ├── useMediaQuery.ts
    │   └── useWindowSize.ts
    ├── config/
    │   ├── antd.theme.ts
    │   ├── breakpoints.ts
    │   └── navigation.ts
    ├── constants/
    │   ├── roles.ts
    │   └── apiRoutes.ts
    ├── types/
    │   ├── api.types.ts
    │   ├── user.types.ts
    │   └── auth.types.ts
    ├── utils/
    │   ├── formatDate.ts
    │   ├── errorUtils.ts
    │   └── validationUtils.ts
    └── styles/
        └── globals.css
```

---

## G. Dashboard Architecture

```
Dashboard (Route Group: /app/(dashboard))
│
├── RootLayout (app/layout.tsx)
│   ├── Providers (AntdProvider, ThemeProvider, StoreProvider, AuthProvider)
│   └── Children (route-specific content)
│
├── DashboardLayout (/app/(dashboard)/layout.tsx)
│   ├── Sidebar — config-driven, role-filtered navigation
│   ├── Header — user menu, theme toggle, mobile trigger
│   ├── Breadcrumb — auto-generated from route
│   ├── Content — page content with loading/error states
│   └── Footer — copyright
│
└── Feature Pages
    ├── /dashboard/page.tsx (Overview)
    └── ... (future features as backend supports)
```

Component responsibilities:
- **DashboardLayout:** Orchestrates layout, checks auth, handles responsiveness
- **Sidebar:** Renders navigation from config, role-based visibility, collapsed/mobile
- **Header:** User dropdown, theme toggle, mobile sidebar trigger
- **Breadcrumb:** Auto-generated from route pathnames
- **Content:** Padded wrapper with loading/error states
- **Footer:** Copyright, version

---

## H. Sidebar Architecture

### Navigation Configuration

Configuration-driven, not hardcoded in components.

**`src/config/navigation.ts`:**
```typescript
interface NavigationItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  roles: UserRole[];
  children?: NavigationItem[];
}
```

### Icon Mapping

`src/components/navigation/iconMap.tsx` — maps icon names to Ant Design v6 icons.

### Active Route Handling
- Uses `usePathname()` from Next.js
- Ant Design `Menu` with `selectedKeys` and `openKeys`

### Collapsed/Expanded
- Toggle button in header or sidebar footer
- State persisted in localStorage
- Collapsed: icons only

### Mobile Behavior
- Off-canvas drawer triggered by hamburger in header
- Drawer closes on route selection or outside click

### Accessibility
- Keyboard navigation (Tab, Arrow keys)
- ARIA labels on interactive elements
- Semantic HTML

### Responsive Behavior

| Breakpoint | Sidebar | Header |
|------------|---------|--------|
| Desktop (≥1024px) | Full/collapsed | Full |
| Tablet (768-1023px) | Collapsed (icons) | Condensed |
| Mobile (<768px) | Drawer | Hamburger only |

---

## I. API Architecture

```
UI Component
    ↓
Feature Hook
    ↓
Axios instance (services/apiClient.ts) — withCredentials: true
    ↓
Backend (cookies auto-sent)
```

### Axios Configuration
```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
  timeout: 10000,
});
```

### Request Interceptor
None needed — backend reads cookies, not Authorization headers.

### Response Interceptor (401 → refresh → retry)
```typescript
apiClient.interceptors.response.use(
  (response) => {
    // Normalize: check success flag from backend
    if (response.data?.success === false && response.data?.errors?.length > 0) {
      return Promise.reject(new ApiError(response));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Retry once on 401, but NOT for refresh/login endpoints themselves
    if (error.response?.status === 401 && !originalRequest._retry &&
        !originalRequest.url.endsWith('/api/auth/refresh') &&
        !originalRequest.url.endsWith('/api/auth/login')) {
      originalRequest._retry = true;
      try {
        await apiClient.post('/api/auth/refresh');
        return apiClient(originalRequest);
      } catch {
        // AuthContext handles redirect to login
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
```

### Response Normalization
Backend returns: `{ success, message, data, errors, timestamp }`
```typescript
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T | null {
  return response.data.data;
}
```

### Refresh Flow (verified against backend)
1. Frontend calls `POST /api/auth/refresh` (no body, cookies auto-sent)
2. Backend middleware does NOT protect this route (not in `protectedRoutes`)
3. Backend controller reads `refreshToken` cookie directly
4. Backend verifies refresh token, checks DB rotation, issues new tokens
5. Backend sets new `accessToken` + `refreshToken` cookies via `setCookies()`
6. Frontend retries the original request

### Cache Strategy
- Auth data: stored in AuthContext, fetched once on app load
- Feature data: Axios + React state (no RTK Query)

---

## J. State Management

### Local State (UI-only)
- Sidebar collapsed/expanded
- Modal/dialog open/close
- Form field values
- Table sort/page/filter
- Theme preference

### Redux Toolkit (Global UI State ONLY)
Used exclusively for non-auth UI state:
- Sidebar collapsed state
- Theme mode (light/dark/system)
- (Future: language preference)

### Auth State (React Context — NOT Redux)

**Why AuthContext is necessary:**
1. Auth state must be available during layout rendering (before page components mount) for route protection
2. The backend returns user data (not tokens) — context stores `{ user }` and provides `login()`, `logout()`
3. The 401 → redirect logic is handled in Axios interceptors, but the context holds the session state

**AuthContext stores:**
- `user: User | null`
- `isLoading: boolean`
- `isAuthenticated: boolean`

**No Redux auth state, no RTK Query for auth.**

---

## K. Forms & Validation

```
Form Page
    ↓
React Hook Form (useForm)
    ↓
Zod Schema (mirrors backend validation)
    ↓
Ant Design Form + FormItems
    ↓
Custom FormField components
    ↓
On Submit → Axios POST to backend
```

### Form Field Components
Reusable wrappers for: Input, Password, Select, DatePicker, RadioGroup, Checkbox, Switch, Upload, Cascader, TreeSelect, OTP, Textarea, AutoComplete.

### Validation Strategy
- Zod schemas in `features/auth/schemas/auth.schemas.ts` mirror backend's `src/validations/auth.validation.ts`
- Frontend validation = UX convenience; **backend is source of truth**

---

## L. Design System

### Ant Design v6
- Design tokens via `ConfigProvider`
- Component token overrides (borderRadius: 8, fontSize: 14)
- CSS-in-JS via `@ant-design/cssinjs`

### Themes
1. Light (default)
2. Dark
3. System preference

Theme toggle in Header, persisted in localStorage + Redux.

### Typography
- Font: Inter (or system stack)
- Heading: H1 24px, H2 20px, H3 18px, H4 16px
- Body: 14px, Small: 12px

### Spacing
- Base: 8px

### Breakpoints
- xs: 480, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600

---

## M. Responsive Architecture

| Component | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|-----------|------------------|---------------------|-----------------|
| Sidebar | Full, collapsible | Collapsed (icons) | Drawer |
| Header | Full | Condensed | Hamburger + title |
| Content | 24px padding | 16px | 16px |
| Tables | Full columns | Horizontal scroll | Horizontal scroll |
| Forms | Two-column | Single column | Single column |

---

## N. Error / Loading / Empty States

| State | Component | Trigger |
|-------|-----------|---------|
| Loading | `LoadingState` | Data fetching, Suspense fallback |
| API Error | `ErrorState` | 4xx/5xx errors (except 401) |
| Unauthorized | Redirect to login | 401 on page load, 401 after refresh fails |
| Forbidden | `ErrorState` with warning | 403 |
| Not Found | `not-found.tsx` | 404 route |
| Empty | `EmptyState` | No data to display |
| Global Error | `error.tsx` | Unhandled exceptions |

---

## O. Reusable Components

| Component | Purpose |
|-----------|---------|
| PageContainer | Consistent page padding/background |
| PageHeader | Title, description, actions |
| Breadcrumb | Auto-generated from route |
| StatusTag | Color-coded status |
| EmptyState | No data placeholder |
| ErrorState | Error with retry |
| LoadingState | Spinner/skeleton |
| ConfirmDialog | Destructive action confirmation |
| FormField/* | Typed form field wrappers |
| ThemeToggle | Light/dark/system switcher |
| UserAvatar | Avatar with fallback |

---

## P. TypeScript Standards

- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUncheckedIndexedAccess`)
- No `any` — use `unknown` + type guards
- Types organized: `api.types.ts`, `user.types.ts`, `auth.types.ts`
- API response type mirrors backend's `ApiResponse<T>` interface exactly

**User type (frontend subset):**
```typescript
interface User {
  id: string;           // backend returns user._id as "id" in profile response
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
}
```

---

## Q. SOLID / Clean Code

- **Separation:** UI / Business Logic / API / State / Config / Types / Utils / Constants
- **Single Responsibility:** Each component/hook has one job
- **Composition:** FormField wrappers, PageContainer, reusable state components
- **Dependency Inversion:** Components receive data via props, not direct fetching

---

## R. Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `DashboardLayout`, `LoginForm` |
| Route Pages | PascalCase + Page | `LoginPage`, `DashboardPage` |
| Hooks | camelCase + use prefix | `useAuth`, `useNavigation` |
| Constants (values) | UPPER_SNAKE_CASE | `USER_ROLES`, `BREAKPOINTS` |
| Constants (files) | camelCase | `roles.ts`, `breakpoints.ts` |
| Types | PascalCase | `User`, `ApiResponse` |
| Functions | camelCase | `extractData`, `getNavigationByRole` |

---

## S. Security

### Authentication Boundaries
1. Login sets HTTP-only cookies via backend
2. Session determined by `GET /api/auth/profile` (200 = authenticated, 401 = not)
3. Protected routes check auth via AuthContext
4. Logout clears cookies + revokes refresh token in DB

### Token Handling
- **NEVER** store in localStorage/sessionStorage
- **NEVER** read HTTP-only cookies
- **NEVER** set Authorization headers
- **ALWAYS** use `withCredentials: true`
- **RELY** on `/api/auth/refresh` for renewal

### CSRF
- Backend sets `sameSite: "strict"` + `httpOnly` + `secure: prod`
- No CSRF token needed — this cookie strategy is sufficient
- **Production deployment topology is an implementation decision** — same-domain deployment recommended but not yet established by the project

### Secrets
- Only `NEXT_PUBLIC_BACKEND_URL` exposed to client
- Google client ID may be exposed (needed for Google Identity Services SDK)

---

## T. Environment Configuration

### Frontend env vars
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=LearnSphere
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<from backend .env.local>
```

### Development proxy (optional)
Next.js rewrites can proxy `/api/auth/*` to the backend to avoid CORS, but with proper CORS config (which the backend provides), direct Axios calls with `withCredentials: true` work.

---

## U. Implementation Roadmap

> No implementation has begun. This is the proposed order.

### Step 1 — Frontend Foundation + Dependencies
- package.json, tsconfig.json, next.config.ts, .env.local
- Install: Next.js 16, React 19, TS strict, AntD v6, Redux Toolkit, Axios, React Hook Form, Zod
- Acceptance: `npm create next-app` works, `tsc --noEmit` passes

### Step 2 — Root Layout & Providers
- app/layout.tsx with AntdProvider, ThemeProvider, StoreProvider, AuthProvider
- app/error.tsx, app/not-found.tsx
- Acceptance: App renders, no console errors

### Step 3 — API Client (Axios + interceptors)
- services/apiClient.ts with withCredentials + 401 refresh interceptor
- types/api.types.ts (matches backend ApiResponse)
- Acceptance: Axios instance configured, 401 interceptor in place

### Step 4 — Authentication Foundation
- features/auth/: AuthContext, useAuth hook, auth.service.ts
- types/user.types.ts, constants/roles.ts (mirror backend)
- AuthContext calls GET /api/auth/profile on mount
- Acceptance: AuthContext provides login/logout/isAuthenticated, redirects on 401

### Step 5 — Authentication Pages
- app/(auth)/: login, register, forgot-password, reset-password pages
- Form schemas mirroring backend Zod validation
- Acceptance: All auth forms validate client-side, submit to backend, handle errors

### Step 6 — Protected Routing
- Dashboard layout checks AuthContext before rendering
- Unauthenticated → redirect to /login with callbackUrl
- Acceptance: Protected routes redirect when unauthenticated

### Step 7 — Dashboard Shell
- DashboardLayout: Sidebar, Header, Content, Footer
- Acceptance: Dashboard renders with all layout components

### Step 8 — Sidebar & Navigation
- config/navigation.ts with role-based visibility
- components/navigation/iconMap.tsx
- Sidebar with collapsed/mobile behavior
- Acceptance: Navigation filtered by role, responsive

### Step 9 — Header & Breadcrumb
- Header: user menu, theme toggle, mobile trigger
- Breadcrumb: auto-generated from route
- Acceptance: Header functions, breadcrumb updates

### Step 10 — Loading/Error/Empty States
- components/common/ reusable state components
- Acceptance: All states render correctly

### Step 11 — Theme System
- Light/dark/system themes with toggle
- Persisted in localStorage
- Acceptance: Theme toggle works, reloads correctly

### Step 12 — Footer
- Simple footer with copyright
- Acceptance: Footer renders in dashboard layout

### Step 13 — Production Verification
- npm run build passes
- npx tsc --noEmit passes (0 errors)
- No console warnings in dev

---

## V. Frontend Type Mapping

| Backend | Frontend | Notes |
|---------|----------|-------|
| `types/user.types.ts` — UserRole enum | `constants/roles.ts` — UserRole enum | Compile-time mirror only, NOT authoritative for security |
| `types/user.types.ts` — IUser | `types/user.types.ts` — User (subset) | Only { id, name, email, role, avatar } |
| `types/auth.types.ts` — JwtPayload | NOT copied | Frontend never decodes JWT |
| `interfaces/response.interface.ts` — ApiResponse | `types/api.types.ts` — ApiResponse | Identical structure |
| `validations/auth.validation.ts` | `features/auth/schemas/auth.schemas.ts` | Zod schemas mirror backend |
| `controllers/auth.controller.ts` setCookies | NOT copied | Cookie config is backend-only |
| `.env.local` env vars | `.env.local` — NEXT_PUBLIC_BACKEND_URL | Only backend URL exposed |

---

## W. Backend-to-Frontend Alignment Checklist

| Backend Concept | Frontend Alignment | Verified |
|-----------------|-------------------|----------|
| HTTP-only cookies (accessToken, refreshToken) | Frontend uses Axios withCredentials: true, never reads cookies | YES |
| sameSite: strict | Frontend must be same-site or handle cross-origin | YES |
| secure: true only in production | No action in dev; HTTPS required in prod | YES |
| Middleware: x-user-id/x-user-role headers | Frontend does NOT set these; backend sets them | YES |
| /api/auth/refresh NOT in protectedRoutes | Frontend can call refresh without access token | YES |
| /api/auth/refresh reads refreshToken cookie directly | Frontend sends no body, cookies auto-sent | YES |
| Token rotation in DB | Frontend transparent to this — just calls refresh on 401 | YES |
| Role in JWT payload | Frontend gets role from /api/auth/profile response, not JWT | YES |
| /api/admin protects ADMIN-only | Frontend hides admin nav items (UX-only) | YES |
| No /api/navigation endpoint | Frontend defines own navigation config | YES |
| User permissions field unused | Frontend does NOT use permissions — roles only | YES |
| sendResponse wrapper | Frontend normalizes { success, message, data, errors, timestamp } | YES |

---

*End of Architecture Document*

Backend code was not modified.
