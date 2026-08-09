import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UIState {
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  themeMode: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
  },
});

export const { setSidebarCollapsed, toggleSidebar, setThemeMode } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export default uiSlice.reducer;