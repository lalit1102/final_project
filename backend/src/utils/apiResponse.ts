import { ApiResponse } from '../interfaces/response.interface';

export const sendResponse = <T>(
  data: T | null = null,
  message: string = 'Success',
  errors: string[] = []
): ApiResponse<T> => {
  return {
    success: errors.length === 0,
    message,
    data,
    errors,
    timestamp: new Date().toISOString(),
  };
};
