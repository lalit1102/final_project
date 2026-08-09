import type { User } from "@/types/user";

/**
 * Authentication context value.
 *
 * This is the application-level authentication state interface.
 * It does NOT contain tokens — tokens remain in HTTP-only cookies.
 */
export interface AuthContextValue {
  /**
   * The current authenticated user, or null if unauthenticated.
   */
  user: User | null;

  /**
   * Whether the user is currently authenticated.
   * True when the session has been verified via /api/auth/profile.
   */
  isAuthenticated: boolean;

  /**
   * Whether the auth state is being initialized (session check in progress).
   * True during initial profile fetch on app load.
   */
  isLoading: boolean;

  /**
   * Authenticates the user with email and password.
   *
   * On success, the backend sets HTTP-only cookies and the
   * AuthContext updates the user state.
   */
  login: (payload: {
    email: string;
    password: string;
  }) => Promise<void>;

  /**
   * Logs out the current user.
   *
   * Calls the backend logout endpoint which clears HTTP-only cookies.
   * The AuthContext updates state regardless of whether the
   * backend call succeeds (idempotent cleanup).
   */
  logout: () => Promise<void>;

  /**
   * Re-fetches the user profile from the backend.
   *
   * Useful after profile updates, token refresh events,
   * or manual session revalidation.
   */
  refreshUser: () => Promise<void>;
}
