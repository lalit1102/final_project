/**
 * UserRole enum — compile-time mirror of backend/src/types/user.types.ts
 *
 * IMPORTANT: This is NOT authoritative for security/authorization.
 * The backend's UserRole enum in backend/src/types/user.types.ts is the
 * source of truth. The frontend only uses these values for UI navigation
 * visibility. All authorization is enforced by the backend.
 *
 * Values must match the backend exactly:
 *   ADMIN = "ADMIN"
 *   TEACHER = "TEACHER"
 *   STUDENT = "STUDENT"
 *   PARENT = "PARENT"
 */
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["PARENT"] = "PARENT";
})(UserRole || (UserRole = {}));
