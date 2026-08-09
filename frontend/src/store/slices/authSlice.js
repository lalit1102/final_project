import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    status: "unknown",
    user: null,
};
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthenticated: (state, action) => {
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
export const { setAuthenticated, setUnauthenticated, clearAuth, } = authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
