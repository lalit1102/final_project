import { API_ROUTES } from "@/config/api";
/**
 * Module-level lock to ensure a single refresh request is created
 * when multiple API calls receive 401 simultaneously.
 *
 * While `refreshPromise` is non-null, all concurrent 401 handlers will
 * await the same promise instead of issuing duplicate refresh requests.
 */
let refreshPromise = null;
/**
 * Tracks whether a refresh failure has already been processed.
 *
 * When multiple concurrent requests share one refresh promise and
 * it rejects, each request's `.catch` handler will fire. This flag
 * ensures `setUnauthenticated` is dispatched only once per
 * refresh-failure event.
 */
let refreshFailureNotified = false;
/**
 * Clears the refresh lock and resets the failure notification flag.
 *
 * Called internally after a refresh attempt resolves or rejects.
 */
function clearRefreshLock() {
    refreshPromise = null;
    refreshFailureNotified = false;
}
/**
 * Returns whether a refresh failure has already been notified.
 */
export function hasRefreshFailureBeenNotified() {
    return refreshFailureNotified;
}
/**
 * Marks that a refresh failure has been notified, preventing
 * duplicate dispatch of unauthenticated state.
 */
export function markRefreshFailureNotified() {
    refreshFailureNotified = true;
}
/**
 * Initiates a single token refresh via the backend endpoint.
 *
 * The backend endpoint is:
 *   POST /api/auth/refresh
 *
 * It requires no request body. The browser automatically sends the
 * `refreshToken` HTTP-only cookie because Axios uses
 * `withCredentials: true`.
 *
 * The client instance is passed explicitly to:
 *   1. Avoid a circular dependency on client.ts
 *   2. Ensure the refresh request is excluded from its own 401 refresh
 *      logic — NO_REFRESH_PATHS already contains /api/auth/refresh,
 *      so the response interceptor will never attempt to refresh again
 *      when the refresh endpoint itself returns 401.
 *
 * @param client - The Axios instance to use for the refresh request.
 * @returns A promise that resolves on successful refresh or rejects
 *          if the refresh fails.
 */
export function refreshAccessToken(client) {
    const promise = client
        .post(API_ROUTES.auth.refresh)
        .then((response) => {
        if (response.data?.success === false) {
            throw new Error(response.data.message ?? "Refresh response indicated failure");
        }
    })
        .catch((error) => {
        throw error;
    })
        .finally(() => {
        clearRefreshLock();
    });
    return promise;
}
/**
 * Coordinates access to the shared refresh promise.
 *
 * If a refresh is already in progress, returns the existing promise.
 * If not, creates a new refresh promise via `refreshAccessToken`.
 *
 * This guarantees that N simultaneous 401 responses produce exactly
 * one network call to /api/auth/refresh.
 *
 * @param client - The Axios instance used to perform the refresh.
 * @returns A promise that resolves when the refresh completes
 *          successfully, or rejects if the refresh fails.
 */
export function getOrCreateRefreshPromise(client) {
    if (refreshPromise !== null) {
        return refreshPromise;
    }
    refreshPromise = refreshAccessToken(client);
    return refreshPromise;
}
/**
 * Clears any pending refresh lock state.
 *
 * Intended for use when the application needs to forcibly reset
 * authentication state (e.g. after a hard logout).
 */
export function resetRefreshLock() {
    clearRefreshLock();
}
