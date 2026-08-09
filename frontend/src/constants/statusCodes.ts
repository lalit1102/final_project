/**
 * HTTP status codes used by the frontend.
 *
 * These mirror HTTP status code definitions, used for frontend
 * error handling and routing decisions. The backend remains the
 * authoritative source for all security and authorization logic.
 */
export const STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
} as const;
