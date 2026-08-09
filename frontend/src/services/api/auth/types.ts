import type { User } from "@/types/user";

/**
 * Request body types — mirror the backend Zod validation schemas
 * found in backend/src/validations/auth.validation.ts
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

/**
 * Response data types — mirror the backend controller response shapes.
 *
 * The User type at frontend/src/types/user.ts mirrors the backend's
 * getProfile return: { id, name, email, role, avatar }
 */
export type { User };

export interface LoginResponse {
  user: User;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: User["role"];
}

export interface ProfileResponse extends User {}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}
