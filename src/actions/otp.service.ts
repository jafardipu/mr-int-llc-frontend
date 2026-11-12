import "server-only";

import { authRequest } from "@/actions/auth-request";
import type { CreatedUser } from "@/actions/users.service";

export interface VerifyOtpResponse {
  user: CreatedUser;
  token: string;
}

export interface ResendOtpResponse {
  token: string;
}

export function verifyOtp(token: string, otp: string) {
  return authRequest<VerifyOtpResponse>("/otp/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      token,
    },
    body: JSON.stringify({ otp }),
  });
}

export function resendOtp(email: string) {
  return authRequest<ResendOtpResponse>("/otp/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}
