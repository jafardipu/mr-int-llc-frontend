// Session rules shared by the proxy, server code and the browser. Keep this
// module free of `next/headers`, React and secrets so all three can use it.
import { jwtDecode } from "jwt-decode";

/** Refresh an access token that expires within this window. */
const refreshWindowMs = 24 * 60 * 60 * 1000;

export type SessionEndReason = "expired" | "blocked" | "unverified";

export const sessionEndMessages: Record<SessionEndReason, string> = {
  expired: "Your session has expired, please log in again.",
  blocked: "Your account is blocked. Please contact support.",
  unverified:
    "Your account is not verified. Please verify your email, then log in again.",
};

export const signInRequiredMessage = "Please sign in to continue.";
export const permissionDeniedMessage = "You don't have permission for this.";
export const offlineMessage =
  "Couldn't reach the server. Check your connection and try again.";

export function isSessionEndReason(value: unknown): value is SessionEndReason {
  return value === "expired" || value === "blocked" || value === "unverified";
}

/** Maps a 401 message from a Server Action back to its reason (for the login notice). */
export function sessionEndReasonFor(message: string | undefined) {
  if (message === signInRequiredMessage) return undefined;
  if (message === sessionEndMessages.blocked) return "blocked";
  if (message === sessionEndMessages.unverified) return "unverified";
  return "expired";
}

/** What the browser's API client gets back when it asks for a refresh. */
export type RefreshSessionResult =
  | { status: "refreshed"; accessToken: string }
  | { status: "ended" }
  | { status: "unreachable" };

export type AccessTokenState = "fresh" | "expiring" | "expired";

/**
 * Reads the JWT's `exp` claim without verifying it. A value that isn't a JWT
 * can never be accepted, so it counts as expired. No `exp` means no expiry.
 */
export function accessTokenState(
  token: string,
  now = Date.now(),
): AccessTokenState {
  let exp: unknown;
  try {
    exp = jwtDecode(token).exp;
  } catch {
    return "expired";
  }
  if (typeof exp !== "number") return "fresh";

  const expiresAt = exp * 1000;
  if (expiresAt <= now) return "expired";
  return expiresAt - now <= refreshWindowMs ? "expiring" : "fresh";
}

export type AuthFailure =
  | { action: "refresh" }
  | { action: "end-session"; reason: SessionEndReason }
  | { action: "forbidden" }
  | { action: "wholesale-fee" };

/**
 * The one place that reads the backend's auth answers. The messages are
 * case-sensitive and compared exactly: "You are not authorized" (role not
 * allowed) is a different answer from "you are not authorized!" (no token).
 * Any other 401 is passed through untouched (e.g. a wrong current password).
 */
export function classifyAuthFailure(
  status: number | undefined,
  message: unknown,
): AuthFailure | null {
  // Wholesale fee unpaid: not an auth problem. Never refresh or sign out.
  if (status === 402) return { action: "wholesale-fee" };
  // The auth check's own lookup: the account was deleted.
  if (status === 404) {
    return message === "user not found"
      ? { action: "end-session", reason: "expired" }
      : null;
  }
  if (status !== 401) return null;

  switch (message) {
    case "unauthorized": // expired or invalid access token
    case "you are not authorized!": // no token was sent
      return { action: "refresh" };
    case "your account is blocked":
      return { action: "end-session", reason: "blocked" };
    case "your account is not verified":
      return { action: "end-session", reason: "unverified" };
    case "You are not authorized": // signed in, but the role isn't allowed
      return { action: "forbidden" };
    default:
      return null;
  }
}

/**
 * Endpoints that must never trigger a refresh: the refresh call itself and
 * the sign-in flows, which don't use the access token.
 */
export function isAuthEndpoint(path: string) {
  const pathname = `/${path.split("?")[0].replace(/^\/+/, "")}`.replace(
    /\/+$/,
    "",
  );
  return (
    /\/auth\/(refresh-token|login|register|forgot-password|reset-password)$/.test(
      pathname,
    ) || /\/otp(\/|$)/.test(pathname)
  );
}

/** Pages that need a signed-in user. The proxy sends guests to /login. */
export function requiresLogin(pathname: string) {
  return (
    pathname === "/user" ||
    pathname.startsWith("/user/") ||
    pathname === "/3pl-prep-service/prep-request" ||
    pathname === "/wholesale-fee" ||
    pathname.startsWith("/wholesale-fee/")
  );
}

/** `/login`, keeping a same-site callback and the reason the session ended. */
export function loginPath({
  callbackUrl,
  reason,
}: { callbackUrl?: string; reason?: SessionEndReason } = {}) {
  const params = new URLSearchParams();
  if (
    callbackUrl?.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.startsWith("/login")
  ) {
    params.set("callbackUrl", callbackUrl);
  }
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
