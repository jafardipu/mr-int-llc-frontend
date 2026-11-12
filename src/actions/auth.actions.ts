"use server";

import { cookies } from "next/headers";
import {
  accessTokenCookie,
  accessTokenCookieOptions,
  refreshTokenCookie,
  refreshTokenCookieOptions,
} from "@/lib/auth-cookies";
import {
  changePassword,
  forgotPassword,
  loginUser,
  resetPassword,
} from "@/actions/auth.service";
import { AuthApiError } from "@/actions/auth-request";
import { resendOtp, verifyOtp } from "@/actions/otp.service";
import { createUser } from "@/actions/users.service";
import type { AuthActionState, AuthFlow } from "./auth.types";

const signupEmailCookie = "signup-email";
const otpTokenCookie = "otp-session-token";
const authFlowCookie = "auth-flow";
const otpMaxAge = 3 * 60;
const emailMaxAge = 10 * 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function getFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getRawFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function failure(error: unknown, fallback: string): AuthActionState {
  if (error instanceof AuthApiError && error.message) {
    return { status: "error", message: error.message };
  }
  return { status: "error", message: fallback };
}

function verificationFailure(error: unknown): AuthActionState {
  if (!(error instanceof AuthApiError) || !error.message) {
    return {
      status: "error",
      message: "Unable to verify the code. Please try again.",
    };
  }

  const message = error.message.toLowerCase();
  if (
    error.status === 401 ||
    message.includes("expired") ||
    message.includes("jwt")
  ) {
    return {
      status: "error",
      message: "Your verification session expired. Resend the code.",
    };
  }

  return { status: "error", message: error.message };
}

async function storeAuthSession(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();
  cookieStore.set(accessTokenCookie, accessToken, accessTokenCookieOptions);
  if (refreshToken) {
    cookieStore.set(refreshTokenCookie, refreshToken, refreshTokenCookieOptions);
  }
}

async function storeOtpSession(token: string, email: string, flow: AuthFlow) {
  const cookieStore = await cookies();
  cookieStore.set(otpTokenCookie, token, cookieOptions(otpMaxAge));
  cookieStore.set(signupEmailCookie, email, cookieOptions(emailMaxAge));
  cookieStore.set(authFlowCookie, flow, cookieOptions(emailMaxAge));
}

async function readOtpSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(otpTokenCookie)?.value;
  const email = cookieStore.get(signupEmailCookie)?.value;
  const flow = cookieStore.get(authFlowCookie)?.value;
  return {
    token,
    email,
    flow: flow === "reset" ? "reset" : "signup",
  } as const;
}

function readSessionToken(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  if (isRecord(data.otpToken) && typeof data.otpToken.token === "string") {
    return data.otpToken.token;
  }
  if (typeof data.token === "string") return data.token;
  return undefined;
}

export async function registerUserAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = getFormValue(formData, "name");
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getRawFormValue(formData, "password");
  const confirmPassword = getRawFormValue(formData, "confirmPassword");
  const role = getFormValue(formData, "role");
  const agreedToTerms = formData.get("agreeToTerms") === "on";

  if (name.length < 2) {
    return { status: "error", message: "Please enter your full name." };
  }
  if (!isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (password.length < 6) {
    return {
      status: "error",
      message: "Password must be at least 6 characters.",
    };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }
  if (role !== "retail" && role !== "wholesale") {
    return { status: "error", message: "Please select a valid customer type." };
  }
  if (!agreedToTerms) {
    return {
      status: "error",
      message: "You must agree to the Terms & Conditions.",
    };
  }

  const body = new FormData();
  body.set("name", name);
  body.set("email", email);
  body.set("password", password);
  body.set("role", role);

  try {
    const result = await createUser(body);
    const otpToken = readSessionToken(result.data);
    const createdEmail =
      isRecord(result.data) &&
      isRecord(result.data.user) &&
      typeof result.data.user.email === "string"
        ? result.data.user.email
        : email;

    if (!otpToken) {
      return {
        status: "error",
        message: "The signup response did not include a verification token.",
      };
    }

    await storeOtpSession(otpToken, createdEmail, "signup");
    return {
      status: "success",
      message:
        result.message ||
        "Account created. Enter the verification code sent to your email.",
      email: createdEmail,
      flow: "signup",
    };
  } catch (error) {
    return failure(error, "Unable to create the account. Please try again.");
  }
}

export async function resendSignupOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void _previousState;
  void formData;

  const session = await readOtpSession();
  if (!session.email || !isValidEmail(session.email)) {
    return {
      status: "error",
      message: "Your sign-up session expired. Please sign up again.",
    };
  }

  try {
    const result = await resendOtp(session.email);
    const otpToken = readSessionToken(result.data);
    if (!otpToken) {
      return {
        status: "error",
        message: "The resend response did not include a verification token.",
      };
    }

    await storeOtpSession(otpToken, session.email, session.flow);
    return {
      status: "success",
      message: result.message || "A new verification code has been sent to your email.",
      email: session.email,
      flow: session.flow,
    };
  } catch (error) {
    return failure(error, "Unable to resend the code. Please try again.");
  }
}

export async function verifySignupOtpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const otp = getFormValue(formData, "otp");
  if (!/^\d{6}$/.test(otp)) {
    return { status: "error", message: "Enter the 6-digit verification code." };
  }

  const session = await readOtpSession();
  if (!session.token) {
    return {
      status: "error",
      message: "Your verification session expired. Resend the code.",
    };
  }

  try {
    const result = await verifyOtp(session.token, otp);
    const accessToken =
      isRecord(result.data) && typeof result.data.token === "string"
        ? result.data.token
        : undefined;

    if (session.flow === "reset") {
      return {
        status: "success",
        message: result.message || "Code verified. Set your new password.",
        flow: "reset",
        email: session.email,
      };
    }

    if (!accessToken) {
      return {
        status: "error",
        message: "The verification response did not include an access token.",
      };
    }

    const cookieStore = await cookies();
    cookieStore.delete(otpTokenCookie);
    cookieStore.delete(signupEmailCookie);
    cookieStore.delete(authFlowCookie);
    await storeAuthSession(accessToken);

    return {
      status: "success",
      message: result.message || "Email verified.",
      flow: "signup",
    };
  } catch (error) {
    return verificationFailure(error);
  }
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getRawFormValue(formData, "password");

  if (!isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!password) {
    return { status: "error", message: "Password is required." };
  }

  try {
    const result = await loginUser({ email, password });
    const data: unknown = result.data;
    const record = isRecord(data) ? data : {};
    const accessToken =
      typeof record.accessToken === "string" ? record.accessToken : undefined;
    if (!accessToken) {
      return {
        status: "error",
        message: "The login response did not include an access token.",
      };
    }

    const refreshToken =
      typeof record.refreshToken === "string" ? record.refreshToken : undefined;
    await storeAuthSession(accessToken, refreshToken);
    return {
      status: "success",
      message: result.message || "Login successful.",
    };
  } catch (error) {
    return failure(error, "Unable to sign in. Please try again.");
  }
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getFormValue(formData, "email").toLowerCase();
  if (!isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    const result = await forgotPassword(email);
    const data: unknown = result.data;
    const record = isRecord(data) ? data : {};
    const otpToken = typeof record.token === "string" ? record.token : undefined;
    const sessionEmail =
      typeof record.email === "string" ? record.email : email;
    if (!otpToken) {
      return {
        status: "error",
        message: "The reset response did not include a verification token.",
      };
    }

    await storeOtpSession(otpToken, sessionEmail, "reset");
    return {
      status: "success",
      message: result.message || "A verification code has been sent to your email.",
      email: sessionEmail,
      flow: "reset",
    };
  } catch (error) {
    return failure(error, "Unable to send a reset code. Please try again.");
  }
}

export async function resetPasswordAction(input: {
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthActionState> {
  if (input.newPassword.length < 6) {
    return {
      status: "error",
      message: "Password must be at least 6 characters.",
    };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  const session = await readOtpSession();
  if (!session.token) {
    return {
      status: "error",
      message: "Your reset session expired. Request a new code.",
    };
  }

  try {
    const result = await resetPassword(session.token, {
      newPassword: input.newPassword,
      confirmPassword: input.confirmPassword,
    });
    const cookieStore = await cookies();
    cookieStore.delete(otpTokenCookie);
    cookieStore.delete(signupEmailCookie);
    cookieStore.delete(authFlowCookie);
    return {
      status: "success",
      message: result.message || "Password reset. You can now sign in.",
    };
  } catch (error) {
    return failure(error, "Unable to reset the password. Please try again.");
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(accessTokenCookie);
  cookieStore.delete(refreshTokenCookie);
  cookieStore.delete(otpTokenCookie);
  cookieStore.delete(signupEmailCookie);
  cookieStore.delete(authFlowCookie);
}

export async function changePasswordAction(input: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthActionState> {
  if (!input.oldPassword) {
    return { status: "error", message: "Current password is required." };
  }
  if (input.newPassword.length < 6) {
    return {
      status: "error",
      message: "Password must be at least 6 characters.",
    };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  const accessToken = (await cookies()).get(accessTokenCookie)?.value;
  if (!accessToken) {
    return { status: "error", message: "Please sign in again." };
  }

  try {
    const result = await changePassword(accessToken, {
      oldPassword: input.oldPassword,
      newPassword: input.newPassword,
      confirmPassword: input.confirmPassword,
    });
    return {
      status: "success",
      message: result.message || "Password updated.",
    };
  } catch (error) {
    return failure(error, "Unable to update the password. Please try again.");
  }
}
