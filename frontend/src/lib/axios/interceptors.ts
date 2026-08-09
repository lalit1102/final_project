import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import { isAxiosError } from "axios";
import { NO_REFRESH_PATHS } from "@/config/api";
import { store } from "@/store";
import { setUnauthenticated } from "@/store/slices/authSlice";
import { getOrCreateRefreshPromise, hasRefreshFailureBeenNotified, markRefreshFailureNotified } from "./refresh";

/**
 * Extension of Axios request config to carry retry metadata.
 *
 * The `_retry` flag is used by the refresh + retry layer to mark a
 * request as having already been retried, preventing infinite
 * refresh loops when a 401 response cannot be resolved by a
 * token refresh.
 */
export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Extracts the request path from an Axios config for comparison
 * against NO_REFRESH_PATHS.
 *
 * Axios may provide `baseURL` and `url` separately. This helper
 * reconstructs the full path and strips query/hash fragments so
 * that path matching is reliable.
 */
function getRequestPath(config: RetryableRequestConfig): string {
  const base = config.baseURL ?? "";
  const url = config.url ?? "";
  const fullUrl = base + url;

  return fullUrl.split("?")[0]?.split("#")[0] ?? "";
}

/**
 * Determines whether a request targets an endpoint that must not
 * trigger the automatic 401 refresh mechanism.
 *
 * Endpoints excluded from refresh:
 * - refresh — not middleware-protected; reads refreshToken cookie directly.
 *   A 401 here means the refresh token is invalid; refreshing again loops.
 * - login — 401 means invalid credentials, not expired token.
 * - register — public endpoint; 401 should prompt login, not refresh.
 * - forgot-password — public endpoint; always returns 200.
 * - reset-password — uses reset token in body, not cookie-based.
 * - google — uses Google ID token in body, not cookie-based.
 *
 * @param config - The Axios request configuration.
 * @returns true if the endpoint should skip token refresh on 401.
 */
function isNoRefreshPath(config: RetryableRequestConfig): boolean {
  const requestPath = getRequestPath(config);

  for (const noRefreshPath of NO_REFRESH_PATHS) {
    if (requestPath.endsWith(noRefreshPath)) {
      return true;
    }
  }
  return false;
}

/**
 * Registers request and response interceptors on the given Axios
 * instance.
 *
 * This function accepts the client instance explicitly to avoid
 * circular dependencies (interceptors.ts must not import client.ts).
 *
 * The store and auth actions are imported from the Redux store module,
 * which does not import from lib/axios — therefore there is no
 * circular dependency.
 *
 * Registered interceptors:
 * - Request interceptor: passes config through unchanged.
 * - Response interceptor: passes 2xx responses through unchanged.
 *   On 401 from a refresh-eligible endpoint, implements the
 *   refresh + retry flow:
 *     1. Checks `_retry` flag to prevent infinite loops
 *     2. Sets `_retry = true` to mark the request as retried
 *     3. Calls the shared refresh promise (getOrCreateRefreshPromise)
 *        — concurrent 401s share one refresh request
 *     4. On refresh success: retries the original request once
 *     5. On refresh failure: dispatches setUnauthenticated once
 *        and rejects with the refresh error
 *
 * The refresh lock coordination lives in refresh.ts.
 * Auth state updates live in store/slices/authSlice.ts.
 *
 * @param client - The Axios instance to attach interceptors to.
 */
export function registerInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      return config;
    },
    (error: unknown): Promise<never> => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    (error: unknown): Promise<unknown> => {
      if (!isAxiosError(error)) {
        return Promise.reject(error);
      }

      const config = error.config as RetryableRequestConfig | undefined;

      if (config === undefined) {
        return Promise.reject(error);
      }

      const status = error.response?.status ?? 0;

      if (status !== 401) {
        return Promise.reject(error);
      }

      const skipRefresh = isNoRefreshPath(config);

      if (skipRefresh) {
        return Promise.reject(error);
      }

      if (config._retry === true) {
        return Promise.reject(error);
      }

      config._retry = true;

      return getOrCreateRefreshPromise(client)
        .then((): Promise<unknown> => {
          return client(config);
        })
        .catch((refreshError: unknown): Promise<never> => {
          if (!hasRefreshFailureBeenNotified()) {
            markRefreshFailureNotified();
            store.dispatch(setUnauthenticated());
          }
          return Promise.reject(refreshError);
        });
    },
  );
}
