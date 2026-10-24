# LearnSphere Architecture and Role Flows

> **Source-of-truth note (2026-10-24):** This guide distinguishes executable behavior in the
> checked-out source from designs and historical implementation claims in `backend/docs/`.
> The docs describe a substantially larger LMS than the source currently present. For runtime
> behavior, the code wins. A capability described only in a plan or audit is marked **documented,
> not present in this checkout**.

## 1. System shape

### Stack and request path

The backend is **Next.js App Router with TypeScript**, not an Express application. Its installed
dependencies and `src/app/api/**/route.ts` entry points confirm this. The architecture described
in the docs—route → controller → service → repository → Mongoose model—is only partially present
in the current tree:

```text
Browser
  → Next.js frontend (React / TypeScript / Ant Design)
  → Axios API client (withCredentials)
  → Next.js backend App Router API route
  → apiHandler wrapper
  → controller
  → service / repository
  → Mongoose User model
  → MongoDB (expected by the code, but no DB connection module is present)
```

The frontend uses App Router route groups, Redux Toolkit for auth/UI state, and an AuthContext
that restores a session by requesting the profile endpoint. The backend has JWT helpers, a
Mongoose user model/repository, services, and middleware. However, the current API tree contains
only two routes, and `apiHandler` currently catches errors but does not connect to MongoDB or
apply the documented rate limiter.

### Code actually present

| Area | Current implementation |
|---|---|
| Backend roles/types | `UserRole` enum and `IUser` in `backend/src/types/user.types.ts` |
| User persistence | `backend/src/models/user.model.ts`, with the `User` schema |
| Static role permissions | `backend/src/types/permission.types.ts` and `backend/src/lib/permissions.ts` |
| Auth business logic | `backend/src/services/auth.service.ts` |
| Teacher creation | `backend/src/app/api/admin/teachers/route.ts`, controller and service |
| Navigation API | `backend/src/app/api/navigation/route.ts`, controller and service |
| Backend route middleware | `backend/src/middleware.ts` |
| Frontend auth state | `frontend/src/features/auth/contexts/AuthContext.tsx` and `frontend/src/store/slices/authSlice.ts` |
| Frontend route guard | `frontend/src/app/(dashboard)/layout.tsx` |
| Frontend role-filtered menu | `frontend/src/config/navigation/navigation.ts` and `roleAccess.ts` |

The only backend route handlers in this checkout are:

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/api/admin/teachers` | Creates a TEACHER account; middleware applies the `/api/admin` ADMIN-role check, then controller checks `TEACHER_CREATE`. |
| `GET` | `/api/navigation` | Authenticated role-filtered navigation response. |

Auth methods exist in `AuthService`, and the frontend calls `/api/auth/*`, but the matching
backend auth route handlers and auth controller are **not present** in the current `backend/src`
tree. Requests for those endpoints therefore are not implemented by the checked-out backend
route files.

## 2. Role model and permission matrix

### Role and user schema

Backend `UserRole` has exactly four values: `ADMIN`, `TEACHER`, `STUDENT`, and `PARENT`. The
Mongoose User schema stores a role with default `STUDENT`, a `permissions` string array, and
`isActive` defaulting to `true`. It also stores common identity/auth fields (`name`, `email`,
password/provider fields, avatar, verification state, login metadata, refresh token, timestamps).

The current `IUser`/Mongoose schema has **no** student identifier, `parentIds`, `childIds`,
class/course references, or teacher/parent-specific profile fields. The four roles currently
share the same User collection and schema.

### Static permission codes in source

The source declares these codes:

- General: `dashboard.view`
- Students: `student.view`, `student.create`, `student.update`, `student.delete`
- Teachers: `teacher.view`, `teacher.create`, `teacher.update`, `teacher.delete`
- Parents: `parent.view`, `parent.create`, `parent.update`, `parent.delete`
- Classes: `class.view`, `class.create`, `class.update`, `class.delete`
- Attendance: `attendance.view`, `attendance.manage`
- Grades: `grade.view`, `grade.manage`
- Reports: `report.view`, `report.export`
- Settings: `setting.view`, `setting.manage`

These codes are assigned by role in `ROLE_PERMISSIONS`. The effective role-to-code mapping in
the current source is:

| Permission area / code | ADMIN | TEACHER | STUDENT | PARENT |
|---|:---:|:---:|:---:|:---:|
| `dashboard.view` | ✓ | ✓ | ✓ | ✓ |
| `student.view` | ✓ | ✓ | — | ✓ |
| `student.create` / `student.update` / `student.delete` | ✓ | — | — | — |
| `teacher.view` / `teacher.create` / `teacher.update` / `teacher.delete` | ✓ | — | — | — |
| `parent.view` / `parent.create` / `parent.update` / `parent.delete` | ✓ | — | — | — |
| `class.view` | ✓ | ✓ | ✓ | — |
| `class.create` / `class.update` | ✓ | ✓ | — | — |
| `class.delete` | ✓ | — | — | — |
| `attendance.view` | ✓ | ✓ | ✓ | ✓ |
| `attendance.manage` | ✓ | ✓ | — | — |
| `grade.view` | ✓ | ✓ | ✓ | ✓ |
| `grade.manage` | ✓ | ✓ | — | — |
| `report.view` | ✓ | ✓ | — | — |
| `report.export` | ✓ | — | — | — |
| `setting.view` / `setting.manage` | ✓ | — | — | — |

**Important interpretation:** The permission table describes code-level role capabilities, not a
complete, working API. `hasPermission()` looks up the role in `ROLE_PERMISSIONS`; it does not
consult the individual user's stored `permissions` array. `getRolePermissions()` is used when
creating default student or teacher accounts. Of the named domains, only `teacher.create` is
currently checked by an API controller. The other codes do not correspond to route handlers in
this checkout.

The backend's `navigation.config.ts` applies those same role permissions to menu entries:

| Backend navigation item | Required code | Roles that see it |
|---|---|---|
| Dashboard | `dashboard.view` | All four |
| Students | `student.view` | ADMIN, TEACHER, PARENT |
| Teachers | `teacher.view` | ADMIN |
| Parents | `parent.view` | ADMIN |
| Classes | `class.view` | ADMIN, TEACHER, STUDENT |
| Attendance | `attendance.view` | All four |
| Grades | `grade.view` | All four |
| Reports | `report.view` | ADMIN, TEACHER |
| Settings | `setting.view` | ADMIN |

These are backend navigation response entries, not confirmed frontend pages or API grants.

### API access and backend guards in this checkout

`backend/src/middleware.ts` runs for `/api/:path*`. It protects
`/api/auth/change-password`, `/api/auth/profile`, `/api/auth/logout`, and `/api/navigation`;
it applies the ADMIN check to all `/api/admin/**` paths. The middleware obtains identity from
the `accessToken` cookie, verifies it with `jose`, and forwards `x-user-id` and `x-user-role`
headers. It does not enforce `isActive` and does not apply per-permission checks globally.

| Endpoint / operation | ADMIN | TEACHER | STUDENT | PARENT | Actual enforcement |
|---|:---:|:---:|:---:|:---:|---|
| `GET /api/navigation` | ✓ | ✓ | ✓ | ✓ | Middleware requires valid access token; service filters menu by role permissions. |
| `POST /api/admin/teachers` | ✓ | 403 | 403 | 403 | Middleware requires ADMIN; controller also loads requester and requires `TEACHER_CREATE`. |
| Admin user/student/parent CRUD | — | — | — | — | No routes or controllers in this checkout. |
| Subjects/courses/classes/enrollments | — | — | — | — | No routes or domain models in this checkout. |
| Assignments/submissions/grades/attendance/reports | — | — | — | — | No routes or domain models in this checkout. |

The checked-in docs provide RBAC matrices for planned/completed-in-the-docs features (for example,
Phase 2's Subject/Course/Class matrix and later plans' enrollment/assignment/grade rules). Those
matrices should not be mistaken for runtime authorization in this source tree.

## 3. Dashboard routes and frontend guards

The frontend uses one authenticated dashboard boundary for every role. In
`frontend/src/app/(dashboard)/layout.tsx`, unauthenticated users are redirected to `/login`;
while auth state is loading, a spinner is shown. There is **no per-role page guard**.

| Frontend route | Roles | Guard/feature present |
|---|---|---|
| `/login` | Public | Login page. |
| `/dashboard` | All four roles | Authenticated-only layout; displays the user's name and role. |
| `/dashboard/profile` | All four roles | Authenticated-only layout; displays own profile and edit/change-password actions. |
| `/dashboard/profile/edit` | All four roles | Profile editing page in the authenticated route group. |
| `/dashboard/profile/change-password` | All four roles | Change-password page in the authenticated route group. |

The sidebar filters menu entries by `user.role`, but the actual frontend config contains only:

| Menu item | Roles |
|---|---|
| Dashboard | ADMIN, TEACHER, STUDENT, PARENT |
| Profile | ADMIN, TEACHER, STUDENT, PARENT |

This is presentation filtering only. API authorization must be enforced by the backend. The
frontend role enum mirrors backend role strings and explicitly documents that it is not an
authorization source.

Auth/session behavior in the source:

1. `AuthProvider` requests `GET /api/auth/profile` to restore a browser session.
2. Successful login stores a reduced user object in Redux; the role is used to filter the menu.
3. `useLogout()` calls the logout API, then dispatches `setUnauthenticated()` only on success.
   `AuthContext.logout()` differs: it clears local auth state in `finally`, even if the API call
   fails.
4. Axios sends credentials and has refresh/retry handling configured, but the corresponding
   backend auth routes are absent from the current checkout.

There are also source-level integration gaps in the auth path: `User.password` and
`User.refreshToken` are marked `select: false` in the schema, while the current repository's
`findByEmail()` does not explicitly select either field. `AuthService.login()` requires
`user.password`, and refresh-token rotation compares `userWithToken.refreshToken`; with Mongoose's
default projection, these values are not returned by those reads. Also, `AuthService.login()`
does not reject a user with `isActive === false`. These points make the current auth service an
incomplete runtime flow even aside from the missing route handlers.

## 4. Role-by-role flows: implemented vs documented

### Admin

**Implemented now**

1. Admin must hold a valid access-token cookie.
2. `POST /api/admin/teachers` enters through the `/api/admin` middleware gate.
3. The controller reads middleware-provided `x-user-id`, loads the requester, and checks
   `PermissionCode.TEACHER_CREATE`.
4. Zod validates `name` (2–100 characters), `email`, `password` (minimum 8 characters), and
   optional URL `avatar`.
5. `TeacherService` rejects an existing email, hashes the password, assigns role `TEACHER`,
   assigns the static teacher permissions, and creates the User.

**Not implemented in this checkout:** Admin CRUD/onboarding for students and parents; general
admin user management; subject, course, or class creation; enrollment management; timetable,
attendance, marks/grades, notifications, or reports. The role permission constants include some
of these domain names, but corresponding API operations are absent.

**Docs alignment:** `BACKEND_PHASE_2_FEATURE_PLAN.md` describes Admin/Teacher academic-structure
operations and states that an Admin may create a class on behalf of a teacher by specifying
`teacherId`. `BACKEND_PHASE_4_FEATURE_PLAN.md` describes Admin/Teacher enrollment operations and
student-parent relationships. These are documentation-level designs/claims; no such API files
or domain model files appear in the current source tree.

### Teacher

**Implemented now:** A teacher account can be created by the admin flow above. There is no
teacher-specific dashboard page or academic-action API.

**Not implemented in this checkout:** Teacher-owned subjects/classes, attendance taking, marks
entry, schedules, assignment creation, class roster access, or grade submission. The permission
codes grant the role static `class.create`, `class.update`, `attendance.manage`, and
`grade.manage` labels, but no matching route/service code exists. The
`backend/src/validations/teacher.validation.ts` schema validates teacher-account creation only;
it is not an academic validation schema.

**Docs alignment:** Phase 2 specifies a teacher ownership model (`teacherId`) and operations on
subjects/courses/classes. Phase 4 documentation outlines assignments, submissions, and grades.
Phase 6 is a planning document for attendance and explicitly identifies attendance as not yet
implemented at the time of that plan. These phases do not imply those APIs exist in the current
checkout.

### Student

**Implemented now:** Public registration logic in `AuthService.register()` creates a default
student role and assigns student permissions. Google login also creates a student by default.
The shared dashboard/profile UI displays the user's identity and role.

**Active-state handling:** `isActive` exists on the User schema and defaults to `true`, but the
current `AuthService.login()` and profile path do not check it. Thus the model has an account
active flag, but this checkout does not enforce it as an auth/dashboard guard.

**Not implemented in this checkout:** Student-specific dashboard widgets, class enrollment
views, attendance history, grades/marks, schedules, assignments, notifications, or reports.
There is no Student model separate from User and no student identifier field in the current
schema.

### Parent

**Implemented now:** `PARENT` is a valid role, receives the static dashboard/student-view/
attendance-view/grade-view permissions, and can access the same generic authenticated
dashboard/profile interface. No parent-specific APIs, pages, parent-child records, or metrics
are implemented in the current source.

**Database linkage answer:** The current User model does **not** contain `parentIds`,
`childIds`, or an equivalent relation, and there is no enrollment/parent repository in the
current tree. Therefore, a parent cannot currently be linked to a Student ID through the
checked-out schema.

The docs' Phase 4 overview says Phase 3 added `studentId` and `parentIds` to User and describes
`parentIds` as an array of User ObjectIds on the Student record, pointing to PARENT users. It
also describes a `findStudentsByParentId(parentId)` lookup, with Parent reads scoped to linked
children's enrollments and grades. That relationship is **documented but absent from the current
model/repository**; it must not be treated as a live database contract here.

**Authorized metrics:** The source only has the static labels `attendance.view` and `grade.view`
for Parent—no metrics API exists. The docs describe parent read scopes to children's enrollments,
submissions, grades/reports, and the Phase 6 attendance proposal describes parent access scoped
to children's attendance. Those are documented target capabilities, not currently queryable
metrics.

## 5. Documentation alignment and drift

The docs in `backend/docs/` were inspected, including the architecture audit, capability plan,
Phase 2, Phase 4 and 4B/4C/4D/4E materials, Phase 5, Phase 6, and the CSRF review. Their status
and claims vary:

| Document(s) | Relevant claims | Current-source reconciliation |
|---|---|---|
| `BACKEND_ARCHITECTURE_AUDIT.md` | Earlier auth-focused Next.js App Router architecture; says no permission-code system or navigation API at its audit date. | Older than current `permissions.ts` and navigation route, but still describes many auth routes not present in the current tree. |
| `BACKEND_FEATURE_CAPABILITY_PLAN.md` | Describes a much larger monorepo, auth routes, dashboard pages, and current/target LMS capabilities. | Its listed LMS routes/pages do not match the current source tree; use it as a planning/audit reference, not an endpoint inventory. |
| `BACKEND_PHASE_2_FEATURE_PLAN.md` | Subject → Course → Class domain and role matrix; teacher ownership model. | Those models and routes are absent from current source. |
| `BACKEND_PHASE_4_FEATURE_PLAN.md`, `BACKEND_PHASE_4B_SUBMISSION_FEATURE_PLAN.md`, `BACKEND_PHASE_4C_GRADE_FEATURE_PLAN.md` | Enrollment, `studentId`/`parentIds`, assignments, submissions, grades, and parent read scopes. | The related models/services/routes are absent from current source. |
| `BACKEND_PHASE_4D_SECURITY_INTEGRATION_AUDIT.md`, `BACKEND_PHASE_4E_Final Feature-Domain Audit Report.md` | Describe security and feature domains as implemented in the audited repository revision. | Their broad implementation claims are not reflected in the current checkout; current middleware also differs in protected route list and CSRF behavior. |
| `BACKEND_PHASE_5_FEATURE_PLAN.md` | Labels course materials/modules/lessons as implemented and documents role ownership rules. | No module, lesson, or material source files or routes appear in the current backend tree. |
| `BACKEND_PHASE_6_FEATURE_PLAN.md` | Planning-only attendance proposal; says attendance not yet implemented at its audit point; defines intended class/enrollment/parent scoping. | Consistent with current absence of attendance code, but its upstream class/enrollment dependencies are also absent now. |
| `CSRF_IMPLEMENTATION_REVIEW.md` | Describes a double-submit CSRF implementation and related middleware wiring. | Current middleware has no CSRF validation or `x-csrf-token` allowance. |

The docs sometimes explicitly say “planning only” and sometimes report completed work at a
historical repository revision. The code tree examined for this guide has only the User model
and two backend route handlers. A future API inventory should be regenerated from source or
the missing phase implementations restored before the historical docs are treated as current.

## 6. Cross-role interaction diagrams

### A. Documented LMS target flow (not executable in the current checkout)

This sequence follows the documented entity/workflow design: class ownership, enrollments,
teacher assignments and grading, student/parent read scoping. The notification step is shown as
a gap because the Phase 4E audit lists Notifications as planned, not implemented. In the source
checkout, none of these domain routes/models are present.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    actor Teacher
    actor Student
    actor Parent
    participant API as Documented LMS APIs
    participant DB as Documented MongoDB domain models
    participant Notify as Notifications domain (planned)

    Admin->>API: Create Class and assign teacherId
    Note over API,DB: Phase 2 design; no Class route/model in current checkout
    API->>DB: Persist Class with courseId and teacherId
    Admin->>API: Enroll Student in Class
    API->>DB: Persist Enrollment(studentId, classId, courseId)
    Note over DB: Parent relationship documented as Student.parentIds → Parent User IDs
    Teacher->>API: Create/publish assignment for owned Class
    API->>DB: Persist Assignment; ownership checked against Class/Teacher
    Student->>API: Submit work for enrolled Class
    API->>DB: Persist Submission with studentId from authenticated identity
    Teacher->>API: Grade submission / record marks
    API->>DB: Persist Grade; verify teacher ownership and student/class scope
    API-->>Notify: Emit grade/assignment event
    Note over Notify: Planned only; no notification service or route in current source
    Notify-->>Student: Notify Student (target behavior, not implemented)
    Student->>API: Read own grade/report
    API->>DB: Scope query to Student identity
    Parent->>API: Read child's grade/report
    API->>DB: Resolve linked Student via parentIds, then scope grade query
    API-->>Parent: Return authorized child metrics/report (documented target)
```

**Documentation basis:** `BACKEND_PHASE_2_FEATURE_PLAN.md` (class ownership);
`BACKEND_PHASE_4_FEATURE_PLAN.md` (enrollment/parent links and target assignment/submission
flows); `BACKEND_PHASE_4C_GRADE_FEATURE_PLAN.md` (grade and parent child-scoping); and
`BACKEND_PHASE_4E_Final Feature-Domain Audit Report.md` (notifications planned, not implemented).
The endpoint behavior shown is a documented design, not a claim about the current deployed API.

### B. Cross-role flow that the current source can execute (subject to backend integration)

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    actor Teacher
    actor Student
    actor Parent
    participant UI as Next.js Frontend
    participant MW as Backend Middleware
    participant API as Backend API
    participant Users as User model/repository
    participant Nav as Navigation service

    Admin->>UI: Sign in / open dashboard
    Note over UI,API: Auth route handlers are referenced by frontend but absent from current backend tree
    Admin->>API: POST /api/admin/teachers
    MW->>MW: Verify accessToken and require ADMIN for /api/admin/**
    MW->>API: Forward x-user-id from verified token
    API->>Users: Load requester and check TEACHER_CREATE
    API->>Users: Create teacher User with TEACHER role and role permissions
    API-->>Admin: 201 teacher created
    Teacher->>API: GET /api/navigation
    MW->>MW: Verify accessToken
    API->>Users: Load current User by middleware identity
    API->>Nav: Filter configured items using role-based permissions
    Nav-->>Teacher: Current navigation items (Dashboard / Students / Teachers / Classes / ...)
    Note over Student,Parent: These roles share the generic frontend dashboard and profile; no academic APIs or parent-child data flow exists here
```

The final navigation items returned by the backend API are filtered using its backend navigation
config, which has more entries than the frontend sidebar config. Those paths are not proof that
the corresponding page/API exists.

## 7. Practical conclusions

1. Treat the current application as a **role-aware account and dashboard shell**, not as a
   complete four-role LMS.
2. The only completed domain write flow in current backend code is Admin-created Teacher; the
   other assigned permission codes are not backed by API implementations here.
3. The frontend restricts dashboard entry by authentication only. Menu filtering is not a
   security boundary and there are no role-specific route guards.
4. Parent-child linkage and child metrics are not represented in current database types/models.
   The docs describe a `parentIds` design, but implementing parent reporting requires restoring
   or adding the relationship model and the scoped domain APIs.
5. Documentation that claims specific domains or security behavior should be reconciled with
   source before implementation decisions. In particular, current middleware does not enforce
   the CSRF design described in the CSRF review, and auth endpoint implementations are missing.

## 8. Source and documentation references

### Source files

- [Backend source](/home/lalit-ubuntu/Lalit/final_project/backend/src)
- [User role and interface](/home/lalit-ubuntu/Lalit/final_project/backend/src/types/user.types.ts)
- [User schema](/home/lalit-ubuntu/Lalit/final_project/backend/src/models/user.model.ts)
- [Permission codes](/home/lalit-ubuntu/Lalit/final_project/backend/src/types/permission.types.ts)
- [Role permission map](/home/lalit-ubuntu/Lalit/final_project/backend/src/lib/permissions.ts)
- [Backend middleware](/home/lalit-ubuntu/Lalit/final_project/backend/src/middleware.ts)
- [Teacher API route](/home/lalit-ubuntu/Lalit/final_project/backend/src/app/api/admin/teachers/route.ts)
- [Teacher controller](/home/lalit-ubuntu/Lalit/final_project/backend/src/controllers/teacher.controller.ts)
- [Teacher service](/home/lalit-ubuntu/Lalit/final_project/backend/src/services/teacher.service.ts)
- [Auth service](/home/lalit-ubuntu/Lalit/final_project/backend/src/services/auth.service.ts)
- [Navigation API route](/home/lalit-ubuntu/Lalit/final_project/backend/src/app/api/navigation/route.ts)
- [Backend navigation config](/home/lalit-ubuntu/Lalit/final_project/backend/src/config/navigation.config.ts)
- [Frontend dashboard guard](/home/lalit-ubuntu/Lalit/final_project/frontend/src/app/(dashboard)/layout.tsx)
- [Frontend role navigation config](/home/lalit-ubuntu/Lalit/final_project/frontend/src/config/navigation/navigation.ts)
- [Frontend role filter](/home/lalit-ubuntu/Lalit/final_project/frontend/src/config/navigation/roleAccess.ts)
- [Frontend logout hook](/home/lalit-ubuntu/Lalit/final_project/frontend/src/hooks/auth/useLogout.ts)

### Backend docs

- [Architecture audit](./backend/docs/BACKEND_ARCHITECTURE_AUDIT.md)
- [Feature capability plan](./backend/docs/BACKEND_FEATURE_CAPABILITY_PLAN.md)
- [Phase 2 feature plan](./backend/docs/BACKEND_PHASE_2_FEATURE_PLAN.md)
- [Phase 4 feature plan](./backend/docs/BACKEND_PHASE_4_FEATURE_PLAN.md)
- [Phase 4B submission feature plan](./backend/docs/BACKEND_PHASE_4B_SUBMISSION_FEATURE_PLAN.md)
- [Phase 4C grade feature plan](./backend/docs/BACKEND_PHASE_4C_GRADE_FEATURE_PLAN.md)
- [Phase 4D security integration audit](./backend/docs/BACKEND_PHASE_4D_SECURITY_INTEGRATION_AUDIT.md)
- [Phase 4E final feature-domain audit](./backend/docs/BACKEND_PHASE_4E_Final%20Feature-Domain%20Audit%20Report.md)
- [Phase 5 feature plan](./backend/docs/BACKEND_PHASE_5_FEATURE_PLAN.md)
- [Phase 6 attendance plan](./backend/docs/BACKEND_PHASE_6_FEATURE_PLAN.md)
- [CSRF implementation review](./backend/docs/CSRF_IMPLEMENTATION_REVIEW.md)
