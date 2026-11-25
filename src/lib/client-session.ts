// Browser-side session helpers. Tokens live in httpOnly cookies, so this
// never reads or stores a token: it only signs out and keeps tabs in step.
import { logoutAction } from "@/actions/auth.actions";
import {
  loginPath,
  sessionEndReasonFor,
  type SessionEndReason,
} from "@/lib/auth-session";

const authEventKey = "mr-auth-event";

export type AuthEvent = "login" | "logout";

/**
 * Tells other tabs the session changed (they get a `storage` event). Only the
 * event type is written, never a token: other tabs already share the cookies.
 */
export function announceAuthChange(type: AuthEvent) {
  try {
    window.localStorage.setItem(
      authEventKey,
      JSON.stringify({ type, at: Date.now() }),
    );
  } catch {
    // Storage blocked (private mode): other tabs catch up on their next request.
  }
}

/** The auth change another tab announced, if this storage event is one. */
export function readAuthEvent(event: StorageEvent): AuthEvent | null {
  if (event.key !== authEventKey || !event.newValue) return null;
  try {
    const value: unknown = JSON.parse(event.newValue);
    const type =
      typeof value === "object" && value !== null && "type" in value
        ? value.type
        : null;
    return type === "login" || type === "logout" ? type : null;
  } catch {
    return null;
  }
}

/** The user chose to sign out. Clears both tokens and tells other tabs. */
export async function signOut() {
  await logoutAction();
  announceAuthChange("logout");
}

let ending: Promise<void> | null = null;

/**
 * The session is over: the refresh failed, there is no refresh token, or the
 * account is blocked, not verified or deleted. Clears both tokens, tells
 * other tabs and loads the login page with the reason. The full page load
 * also drops cached account data (React Query, the wishlist index).
 *
 * Safe to call from several failing requests at once: they share one run.
 * Pass `message` (an action's 401 message) or `reason`.
 */
export function endClientSession({
  reason,
  message,
  callbackUrl,
}: {
  reason?: SessionEndReason;
  message?: string;
  callbackUrl?: string;
} = {}): Promise<void> {
  ending ??= (async () => {
    try {
      await logoutAction();
    } catch {
      // Offline: still leave the account pages; the proxy re-checks.
    }
    announceAuthChange("logout");
    const target = loginPath({
      callbackUrl:
        callbackUrl ?? `${window.location.pathname}${window.location.search}`,
      reason: reason ?? sessionEndReasonFor(message),
    });
    window.location.replace(new URL(target, window.location.origin).href);
  })();
  return ending;
}
