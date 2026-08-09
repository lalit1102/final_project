import { authReducer } from "./slices/authSlice";
import { uiReducer } from "./slices/uiSlice";

export const rootReducer = {
  ui: uiReducer,
  auth: authReducer,
};
