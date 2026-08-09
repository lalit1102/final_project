import axios, { type AxiosInstance } from "axios";

import { API_BASE_URL, API_TIMEOUT_MS } from "@/config/api";

import { registerInterceptors } from "./interceptors";

/**
 * Centralized Axios HTTP client.
 *
 * Design decisions:
 * - withCredentials: true — the backend authenticates via HTTP-only cookies
 *   (accessToken + refreshToken). The browser sends these automatically.
 * - The frontend never reads or writes these cookies directly.
 * - No Authorization header is set — auth is cookie-based only.
 * - Request and response interceptors are registered here at module
 *   initialization, guaranteeing they execute exactly once.
 * - No browser-only APIs are referenced at module level, making this safe
 *   for both Next.js server components and client components.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

registerInterceptors(apiClient);

export default apiClient;
