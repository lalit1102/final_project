import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    sidebarCollapsed: false,
    themeMode: 'light',
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSidebarCollapsed: (state, action) => {
            state.sidebarCollapsed = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setThemeMode: (state, action) => {
            state.themeMode = action.payload;
        },
    },
});
export const { setSidebarCollapsed, toggleSidebar, setThemeMode } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export default uiSlice.reducer;
