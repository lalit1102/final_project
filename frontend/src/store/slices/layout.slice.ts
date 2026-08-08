import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LayoutState {
  collapsed: boolean;
  mobileDrawerOpen: boolean;
}

const initialState: LayoutState = {
  collapsed: false,
  mobileDrawerOpen: false,
};

export const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.collapsed = !state.collapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload;
    },
    toggleMobileDrawer: (state) => {
      state.mobileDrawerOpen = !state.mobileDrawerOpen;
    },
    setMobileDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileDrawerOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileDrawer,
  setMobileDrawerOpen,
} = layoutSlice.actions;

export default layoutSlice.reducer;
