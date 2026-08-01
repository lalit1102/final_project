import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { message } from "antd";

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, "");

const getApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    return normalizeBaseUrl(`http://${window.location.hostname}:3001/api`);
  }

  return "http://localhost:3001/api";
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let isRedirectingToLogin = false;

const redirectToLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  window.dispatchEvent(new Event("auth:unauthorized"));
  window.location.assign("/auth/login");

  window.setTimeout(() => {
    isRedirectingToLogin = false;
  }, 1000);
};

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const nextConfig = { ...config };
  const headers = AxiosHeaders.from(nextConfig.headers);

  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  nextConfig.headers = headers;

  return nextConfig;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: string[] }>) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message ?? error.message ?? "Request failed";
    const validationErrors = error.response?.data?.errors ?? [];

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      message.error("The request timed out. Please try again.");
    } else if (!error.response) {
      message.error("Unable to reach the server. Please check that the backend is running.");
    } else if (status === 401) {
      message.warning("Your session has expired. Please sign in again.");
      redirectToLogin();
    } else if (status === 403) {
      message.error("You do not have permission to perform this action.");
    } else if (status === 500) {
      message.error("A server error occurred. Please try again later.");
    } else if (validationErrors.length > 0) {
      message.error(validationErrors.join(" "));
    } else if (errorMessage) {
      message.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
export default axiosInstance;
