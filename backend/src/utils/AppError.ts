import { StatusCode } from '../constants/statusCodes';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export class AppError extends Error {
  public readonly statusCode: StatusCode;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: StatusCode,
    errors: string[] = [],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Converts Mongoose/MongoDB errors into AppError instances.
 * Handles duplicate-key errors (code 11000) as 409 Conflict.
 */
export function handleMongoError(error: unknown): AppError | null {
  if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
    return new AppError(
      ERROR_MESSAGES.USER_EXISTS,
      409 as StatusCode,
      ['A user with this email already exists.'],
    );
  }
  return null;
}
