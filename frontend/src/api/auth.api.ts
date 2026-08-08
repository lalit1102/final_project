import type { AxiosResponse } from "axios";
import { axiosInstance } from "./axios";
import type {
  ApiResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleLoginPayload,
  GoogleLoginResponse,
  LoginPayload,
  LoginResponse,
  ProfileResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from "@/types/auth";

const buildUrl = (path: string) => `${path}`;

const authApi = {
  login: (payload: LoginPayload): Promise<AxiosResponse<ApiResponse<LoginResponse>>> =>
    axiosInstance.post<ApiResponse<LoginResponse>>(buildUrl("/auth/login"), payload),

  register: (payload: RegisterPayload): Promise<AxiosResponse<ApiResponse<RegisterResponse>>> =>
    axiosInstance.post<ApiResponse<RegisterResponse>>(buildUrl("/auth/register"), payload),

  logout: (): Promise<AxiosResponse<ApiResponse<null>>> => axiosInstance.post<ApiResponse<null>>(buildUrl("/auth/logout")),

  profile: (): Promise<AxiosResponse<ApiResponse<ProfileResponse>>> =>
    axiosInstance.get<ApiResponse<ProfileResponse>>(buildUrl("/auth/profile")),

  refresh: (): Promise<AxiosResponse<ApiResponse<null>>> => axiosInstance.post<ApiResponse<null>>(buildUrl("/auth/refresh")),

  forgotPassword: (payload: ForgotPasswordPayload): Promise<AxiosResponse<ApiResponse<null>>> =>
    axiosInstance.post<ApiResponse<null>>(buildUrl("/auth/forgot-password"), payload),

  resetPassword: (payload: ResetPasswordPayload): Promise<AxiosResponse<ApiResponse<null>>> =>
    axiosInstance.post<ApiResponse<null>>(buildUrl("/auth/reset-password"), payload),

  changePassword: (payload: ChangePasswordPayload): Promise<AxiosResponse<ApiResponse<null>>> =>
    axiosInstance.post<ApiResponse<null>>(buildUrl("/auth/change-password"), payload),
  
  googleLogin: (
    payload: GoogleLoginPayload
  ): Promise<AxiosResponse<ApiResponse<GoogleLoginResponse>>> =>
    axiosInstance.post<ApiResponse<GoogleLoginResponse>>(
      buildUrl("/auth/google"),
      payload
    ),
};

export const {
  login,
  register,
  googleLogin,
  logout,
  profile,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
} = authApi;

export default authApi;
