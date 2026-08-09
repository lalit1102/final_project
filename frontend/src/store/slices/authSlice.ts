import { createSlice } from "@reduxjs/toolkit";

import type { User } from "@/types/user";

/**
 * Authentication state.
 *
 * Stores only safe application-level auth state. Never stores
 * accessToken, refreshToken, JWT, or cookie contents.
 * Tokens are managed exclusively via HTTP-only cookies by the browser.
 */
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

const initialState: AuthState = {
  status: "unknown",
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (
      state,
      action: { payload: { user: User } },
    ) => {
      state.status = "authenticated";
      state.user = action.payload.user;
    },
    setUnauthenticated: (state) => {
      state.status = "unauthenticated";
      state.user = null;
    },
    clearAuth: (state) => {
      state.status = "unknown";
      state.user = null;
    },
  },
});

export const {
  setAuthenticated,
  setUnauthenticated,
  clearAuth,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
export default authSlice.reducer;
