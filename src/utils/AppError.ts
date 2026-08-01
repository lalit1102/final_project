import { StatusCode } from '../constants/statusCodes';

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
