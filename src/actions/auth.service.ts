import "server-only";

import { authRequest } from "@/actions/auth-request";
import type { CreatedUser } from "@/actions/users.service";

export interface LoginResponse {
  user: CreatedUser;
  accessToken: string;
  refreshToken?: string;
  wholesaleFee?: unknown;
}

export interface ForgotPasswordResponse {
  email: string;
  token: string;
}

export interface PasswordBody {
  newPassword: string;
  confirmPassword: string;
}

export function loginUser(body: {
  email: string;
  password: string;
  fcmToken?: string;
}) {
  return authRequest<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function forgotPassword(email: string) {
  return authRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, body: PasswordBody) {
  return authRequest<unknown>("/auth/reset-password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify(body),
  });
}

export function changePassword(body: PasswordBody & { oldPassword: string }) {
  return authRequest<unknown>(
    "/auth/change-password",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { auth: "required" },
  );
}

// Refreshing the access token lives in src/lib/auth-refresh.ts (single
// flight, used by the proxy and sendWithSession).
