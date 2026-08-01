export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred.',
  UNAUTHORIZED: 'Unauthorized access.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation failed.',
  USER_EXISTS: 'User with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Token has expired.',
  TOKEN_INVALID: 'Invalid token.',
  ACCOUNT_LOCKED: 'Account is locked due to too many failed login attempts.',
  ACCOUNT_UNVERIFIED: 'Please verify your email address.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
} as const;
