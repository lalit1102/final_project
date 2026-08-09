/**
 * API response wrapper — matches the backend's ApiResponse interface exactly.
 * backend/src/interfaces/response.interface.ts
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: string;
}
