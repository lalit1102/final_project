/**
 * Central API configuration.
 *
 * The backend uses HTTP-only cookies for authentication.
 * The frontend never reads or writes authentication cookies directly.
 * All requests must use withCredentials: true so the browser
 * automatically sends accessToken and refreshToken cookies.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

/** Request timeout in milliseconds. */
export const API_TIMEOUT_MS = 10000;

/**
 * API route paths — must match backend routes exactly.
 * Backend routes verified from backend/src/app/api/auth/
 */
export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    profile: "/api/auth/profile",
    changePassword: "/api/auth/change-password",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    google: "/api/auth/google",
  },
} as const;

/**
 * Endpoints that must NOT trigger the 401 refresh interceptor.
 *
 * - refresh: Reads refreshToken cookie directly. The backend middleware
 *   does NOT protect /api/auth/refresh (it is not in protectedRoutes).
 *   Calling refresh from within the refresh interceptor would cause
 *   an infinite loop.
 *
 * - login: Sets new cookies on response. A 401 on login means
 *   invalid credentials, not an expired access token.
 *
 * - register: No auth required. A 401 should prompt login, not refresh.
 *
 * - forgot-password: No auth required. Public endpoint.
 *
 * - reset-password: Uses reset token in body, not cookies. Public endpoint.
 *
 * - google: Uses Google ID token in body. No cookie-based auth needed.
 */
export const NO_REFRESH_PATHS = new Set<string>([
  API_ROUTES.auth.refresh,
  API_ROUTES.auth.login,
  API_ROUTES.auth.register,
  API_ROUTES.auth.forgotPassword,
  API_ROUTES.auth.resetPassword,
  API_ROUTES.auth.google,
]);

/**
 * Maximum retry attempts for a single request after a successful
 * token refresh. Set to 1 to prevent infinite retry loops.
 */
export const MAX_RETRY_ATTEMPTS = 1;