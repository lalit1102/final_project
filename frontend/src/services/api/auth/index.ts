import { AxiosResponse } from "axios";
import type { AxiosError } from "axios";

import { apiClient } from "@/lib/axios";
import { API_ROUTES } from "@/config/api";
import type { ApiResponse } from "@/types/api";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  User,
} from "./types";

/**
 * Authentication API service.
 *
 * All requests use `apiClient` which is configured with:
 * - `withCredentials: true` — the browser sends HTTP-only cookies
 *   automatically (accessToken + refreshToken).
 * - Interceptors handle 401 → refresh → retry automatically.
 *
 * No request or response in this service reads, writes, or inspects
 * authentication cookies. The browser manages them entirely.
 */

/**
 * Authenticates a user with email and password.
 *
 * On success, the backend sets `accessToken` and `refreshToken`
 * HTTP-only cookies on the response.
 *
 * @param payload - { email, password }
 * @returns The authenticated user data
 */
export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response: AxiosResponse<ApiResponse<LoginResponse>> =
    await apiClient.post(API_ROUTES.auth.login, payload);

  return response.data.data as LoginResponse;
}

/**
 * Registers a new user account.
 *
 * @param payload - { name, email, password }
 * @returns The created user's basic info (no avatar, no tokens)
 */
export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response: AxiosResponse<ApiResponse<RegisterResponse>> =
    await apiClient.post(API_ROUTES.auth.register, payload);

  const data = response.data.data;
  if (data === null || data === undefined) {
    throw new Error("Registration response contained no user data");
  }

  return data;
}

/**
 * Logs out the current user.
 *
 * The backend clears the HTTP-only cookies and revokes the
 * refresh token in the database.
 */
export async function logout(): Promise<void> {
  await apiClient.post(API_ROUTES.auth.logout);
}

/**
 * Refreshes the access token.
 *
 * This function is called by the Axios interceptor. It does NOT
 * need to be called manually — the interceptor handles it automatically.
 *
 * The backend reads the `refreshToken` cookie and issues new cookies.
 */
export async function refresh(): Promise<void> {
  await apiClient.post(API_ROUTES.auth.refresh);
}

/**
 * Retrieves the current user's profile.
 *
 * Requires authentication (accessToken cookie must be valid).
 *
 * @returns The full user profile including avatar
 */
export async function getProfile(): Promise<ProfileResponse> {
  const response: AxiosResponse<ApiResponse<User>> =
    await apiClient.get(API_ROUTES.auth.profile);

  const data = response.data.data;
  if (data === null || data === undefined) {
    throw new Error("Profile response contained no user data");
  }

  return data;
}

/**
 * Updates the current user's profile.
 *
 * Requires authentication.
 *
 * @param payload - { name?, avatar? }
 * @returns The updated profile
 */
export async function updateProfile(
  payload: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const response: AxiosResponse<ApiResponse<UpdateProfileResponse>> =
    await apiClient.put(API_ROUTES.auth.profile, payload);

  const data = response.data.data;
  if (data === null || data === undefined) {
    throw new Error("Update profile response contained no user data");
  }

  return data;
}

/**
 * Changes the current user's password.
 *
 * Requires authentication. The backend clears cookies on success,
 * so the user must log in again.
 *
 * @param payload - { currentPassword, newPassword }
 */
export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<void> {
  await apiClient.post(API_ROUTES.auth.changePassword, payload);
}

/**
 * Sends a password reset email.
 *
 * Public endpoint. Always returns success even if the email does
 * not exist (prevents user enumeration).
 *
 * @param payload - { email }
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<void> {
  await apiClient.post(API_ROUTES.auth.forgotPassword, payload);
}

/**
 * Resets the password using a reset token.
 *
 * Public endpoint.
 *
 * @param payload - { token, newPassword }
 */
export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<void> {
  await apiClient.post(API_ROUTES.auth.resetPassword, payload);
}

/**
 * Logs in or registers a user using a Google ID token.
 *
 * On success, the backend sets `accessToken` and `refreshToken`
 * HTTP-only cookies on the response.
 *
 * @param payload - { idToken }
 * @returns The authenticated user data
 */
export async function googleLogin(
  payload: GoogleLoginRequest,
): Promise<LoginResponse> {
  const response: AxiosResponse<ApiResponse<LoginResponse>> =
    await apiClient.post(API_ROUTES.auth.google, payload);

  return response.data.data as LoginResponse;
}

/**
 * Extracts a meaningful error message from an Axios error.
 *
 * The backend returns { success, message, errors, data, timestamp }.
 *
 * @param error - The Axios error to extract a message from.
 * @returns A human-readable error message.
 */
export function getAuthErrorMessage(error: AxiosError): string {
  const backendErrors = error.response?.data as
    | ApiResponse<unknown>
    | undefined;

  if (backendErrors?.errors !== undefined && backendErrors.errors.length > 0) {
    return backendErrors.errors.join(", ");
  }

  if (backendErrors?.message !== undefined && backendErrors.message !== "") {
    return backendErrors.message;
  }

  return error.message;
}
