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
 *
 * By default, duplicate-key errors produce a domain-neutral message.
 * Callers may pass a custom `duplicateMessage` for domain-specific
 * messaging (e.g., "A grade for this student and assignment already exists.").
 *
 * All other Mongo errors return null so the caller can handle them.
 */
export function handleMongoError(error: unknown, duplicateMessage?: string): AppError | null {
  if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
    const message = duplicateMessage ?? ERROR_MESSAGES.DUPLICATE_RESOURCE;
    const detailMessage = duplicateMessage
      ? [duplicateMessage]
      : ['A resource with this value already exists.'];
    return new AppError(
      message,
      409 as StatusCode,
      detailMessage,
    );
  }
  return null;
}
