import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  user: Record<string, unknown> | null;
};

const initialState: AuthState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user?: Record<string, unknown> | null }>) => {
      state.user = action.payload.user ?? null;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const { setUser, logout } = authSlice.actions;

export default authSlice.reducer;
