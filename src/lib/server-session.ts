import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  accessTokenCookie,
  accessTokenCookieOptions,
  refreshTokenCookie,
} from "@/lib/auth-cookies";
import {
  forgetRefreshToken,
  knownReplacement,
  refreshAccessToken,
} from "@/lib/auth-refresh";
import {
  accessTokenState,
  classifyAuthFailure,
  offlineMessage,
  permissionDeniedMessage,
  sessionEndMessages,
  signInRequiredMessage,
  type AuthFailure,
  type RefreshSessionResult,
  type SessionEndReason,
} from "@/lib/auth-session";

/**
 * "required": no usable session is a 401. "optional": send the token when
 * there is one (role-based prices), otherwise call the API as a guest.
 */
export type SessionAuth = "required" | "optional";

type ErrorFactory = (message: string, status: number) => Error;

/** `Authorization: Bearer <token>`; the "Bearer " prefix is required by the API. */
export function withBearer(
  headers: HeadersInit | undefined,
  accessToken: string | undefined,
) {
  const result = new Headers(headers);
  if (accessToken) result.set("Authorization", `Bearer ${accessToken}`);
  return result;
}

type Session = {
  accessToken?: string;
  refreshToken?: string;
  /** Any auth cookie was present. */
  hadSession: boolean;
  ended?: SessionEndReason;
  unreachable?: boolean;
};

/**
 * Saves a refreshed access token. Server Functions and Route Handlers can;
 * Server Components can't, so there the proxy saves it on the next request.
 */
async function saveAccessToken(token: string) {
  try {
    (await cookies()).set(accessTokenCookie, token, accessTokenCookieOptions);
  } catch {
    // Rendering a Server Component: cookies are read-only.
  }
}

/** Clears both tokens. In a Server Component the page's 401 UI does it instead. */
export async function clearSession() {
  try {
    const store = await cookies();
    const refreshToken = store.get(refreshTokenCookie)?.value;
    if (refreshToken) forgetRefreshToken(refreshToken);
    store.delete(accessTokenCookie);
    store.delete(refreshTokenCookie);
  } catch {
    // Rendering a Server Component: cookies are read-only.
  }
}

/** True when the browser sent either auth cookie. */
export async function hasSessionCookie() {
  const store = await cookies();
  return Boolean(
    store.get(accessTokenCookie)?.value || store.get(refreshTokenCookie)?.value,
  );
}

/**
 * The access token to send. The proxy normally refreshed it already; this
 * also covers a token it couldn't save and calls it didn't see.
 */
async function loadSession(): Promise<Session> {
  const store = await cookies();
  const refreshToken = store.get(refreshTokenCookie)?.value || undefined;
  let accessToken = store.get(accessTokenCookie)?.value || undefined;
  const hadSession = Boolean(accessToken || refreshToken);
  if (!hadSession) return { hadSession };

  // Expiry checks read the clock, which a prerender (runtime prefetch) may
  // not do. Signed-in requests are per user and uncached anyway.
  await connection();

  if (refreshToken) {
    accessToken = knownReplacement(refreshToken, accessToken) ?? accessToken;
  }

  const state = accessToken ? accessTokenState(accessToken) : "expired";
  if (state === "fresh") return { accessToken, refreshToken, hadSession };

  if (!refreshToken) {
    // Signed up through OTP: there is no refresh token. Use the access token
    // until it expires, then the customer signs in again.
    if (accessToken && state === "expired") {
      await clearSession();
      return { hadSession, ended: "expired" };
    }
    return { accessToken, hadSession };
  }

  const outcome = await refreshAccessToken(refreshToken, accessToken);
  if (outcome.status === "refreshed") {
    await saveAccessToken(outcome.accessToken);
    return { accessToken: outcome.accessToken, refreshToken, hadSession };
  }
  if (outcome.status === "rejected") {
    await clearSession();
    return { hadSession, ended: "expired" };
  }

  // No answer: keep the tokens. A token that hasn't expired yet still works.
  return state === "expiring"
    ? { accessToken, refreshToken, hadSession }
    : { refreshToken, hadSession, unreachable: true };
}

function readFailure(error: unknown): AuthFailure | null {
  if (
    !(error instanceof Error) ||
    !("status" in error) ||
    typeof error.status !== "number"
  ) {
    return null;
  }
  return classifyAuthFailure(error.status, error.message);
}

/**
 * Runs `send` with the signed-in user's access token and applies the auth
 * rules: refresh before it expires, refresh and retry once on a 401 that
 * calls for it, end the session when that fails or the account is blocked,
 * not verified or deleted, and turn a role-not-allowed 401 into a 403.
 *
 * `send` must throw an error with a numeric `status` and the API's message
 * (ApiRequestError / AuthApiError); `toError` builds the same kind.
 */
export async function sendWithSession<T>(
  send: (accessToken: string | undefined) => Promise<T>,
  { auth, toError }: { auth: SessionAuth; toError: ErrorFactory },
): Promise<T> {
  const session = await loadSession();

  if (!session.accessToken) {
    if (auth === "optional") return send(undefined);
    if (session.unreachable) throw toError(offlineMessage, 0);
    throw toError(
      session.ended
        ? sessionEndMessages[session.ended]
        : session.hadSession
          ? sessionEndMessages.expired
          : signInRequiredMessage,
      401,
    );
  }

  // Session over: clear both tokens. Public data still loads as a guest.
  const endSession = async (reason: SessionEndReason): Promise<T> => {
    await clearSession();
    if (auth === "optional") return send(undefined);
    throw toError(sessionEndMessages[reason], 401);
  };

  const first = await attempt(send, session.accessToken);
  if (first.ok) return first.value;
  const failure = first.failure;
  if (!failure || failure.action === "wholesale-fee") throw first.error;
  if (failure.action === "forbidden") {
    throw toError(permissionDeniedMessage, 403);
  }
  if (failure.action === "end-session") return endSession(failure.reason);

  // Expired or invalid token (or none was sent): refresh, then retry once.
  if (!session.refreshToken) return endSession("expired");
  const outcome = await refreshAccessToken(
    session.refreshToken,
    session.accessToken,
  );
  if (outcome.status === "unreachable") throw toError(offlineMessage, 0);
  if (outcome.status === "rejected") return endSession("expired");
  await saveAccessToken(outcome.accessToken);

  const retry = await attempt(send, outcome.accessToken);
  if (retry.ok) return retry.value;
  const again = retry.failure;
  if (!again || again.action === "wholesale-fee") throw retry.error;
  if (again.action === "forbidden") throw toError(permissionDeniedMessage, 403);
  // A second 401 with a brand-new token: stop here, never loop.
  return endSession(again.action === "end-session" ? again.reason : "expired");
}

async function attempt<T>(
  send: (accessToken: string | undefined) => Promise<T>,
  accessToken: string,
): Promise<
  | { ok: true; value: T }
  | { ok: false; error: unknown; failure: AuthFailure | null }
> {
  try {
    return { ok: true, value: await send(accessToken) };
  } catch (error) {
    return { ok: false, error, failure: readFailure(error) };
  }
}

/**
 * For the browser's API client after a 401. `failedAccessToken` is the token
 * the API just rejected; if the cookie already holds a newer one (another
 * tab, or the proxy, refreshed first) that one is returned without a call.
 * Must run in a Server Function so the new cookie is saved.
 */
export async function refreshSessionForClient(
  failedAccessToken: string | undefined,
): Promise<RefreshSessionResult> {
  const store = await cookies();
  const refreshToken = store.get(refreshTokenCookie)?.value;
  const current = store.get(accessTokenCookie)?.value;

  if (
    current &&
    current !== failedAccessToken &&
    accessTokenState(current) !== "expired"
  ) {
    return { status: "refreshed", accessToken: current };
  }
  if (!refreshToken) {
    await clearSession();
    return { status: "ended" };
  }

  const outcome = await refreshAccessToken(refreshToken, failedAccessToken ?? current);
  if (outcome.status === "refreshed") {
    await saveAccessToken(outcome.accessToken);
    return outcome;
  }
  if (outcome.status === "rejected") {
    await clearSession();
    return { status: "ended" };
  }
  return { status: "unreachable" };
}
