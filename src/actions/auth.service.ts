import "server-only";

import { authRequest } from "@/actions/auth-request";
import type { CreatedUser } from "@/actions/users.service";

export interface LoginResponse {
  user: CreatedUser;
  accessToken: string;
  refreshToken?: string;
}

export interface ForgotPasswordResponse {
  email: string;
  token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
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

export function changePassword(
  accessToken: string,
  body: PasswordBody & { oldPassword: string },
) {
  return authRequest<unknown>("/auth/change-password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

export function refreshAccessToken(refreshToken?: string) {
  return authRequest<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });
}
