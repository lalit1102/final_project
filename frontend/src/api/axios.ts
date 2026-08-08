import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";

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

    if (status === 401) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
export default axiosInstance;
