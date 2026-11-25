// Calls POST /auth/refresh-token. Used by the proxy and by server code; never
// import it into the browser (the refresh token stays on the server).
import { envConfig } from "@/config";
import { accessTokenState } from "@/lib/auth-session";

export type RefreshOutcome =
  | { status: "refreshed"; accessToken: string }
  /** The API answered with an error: the session is over. */
  | { status: "rejected" }
  /** No answer (network, timeout): not a logout, keep the tokens. */
  | { status: "unreachable" };

type RecentRefresh = {
  accessToken: string;
  /** The access token this one replaced (undefined when there was none). */
  replaced: string | undefined;
  at: number;
};

/** One refresh per refresh token at a time; everyone else waits for it. */
const inFlight = new Map<string, Promise<RefreshOutcome>>();
/**
 * Tokens minted in the last hour, by refresh token. Server Components can't
 * save cookies, so later requests may still carry the replaced token; this
 * lets them reuse the new one instead of refreshing again (the auth endpoints
 * are rate limited).
 */
const recent = new Map<string, RecentRefresh>();
/** Refresh tokens the API rejected, so a cookie that couldn't be cleared isn't retried on every render. */
const rejected = new Map<string, number>();

const reuseMs = 60 * 60 * 1000;
const rejectedMs = 10 * 60 * 1000;
const maxEntries = 1000;
const timeoutMs = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prune(now: number) {
  for (const [key, entry] of recent) {
    if (now - entry.at > reuseMs) recent.delete(key);
  }
  for (const [key, at] of rejected) {
    if (now - at > rejectedMs) rejected.delete(key);
  }
  // Maps keep insertion order: drop the oldest first.
  for (const map of [recent, rejected]) {
    while (map.size > maxEntries) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
  }
}

function reusable(refreshToken: string, now: number) {
  const entry = recent.get(refreshToken);
  if (!entry || now - entry.at > reuseMs) return undefined;
  if (accessTokenState(entry.accessToken, now) === "expired") return undefined;
  return entry;
}

/** The token already minted to replace `accessToken`, if any. */
export function knownReplacement(
  refreshToken: string,
  accessToken: string | undefined,
) {
  const entry = reusable(refreshToken, Date.now());
  return entry && entry.replaced === accessToken ? entry.accessToken : undefined;
}

/** Called on logout. */
export function forgetRefreshToken(refreshToken: string) {
  recent.delete(refreshToken);
}

async function callRefreshEndpoint(refreshToken: string): Promise<RefreshOutcome> {
  const baseUrl = (envConfig.serverUrl ?? envConfig.baseUrl)?.replace(/\/+$/, "");
  if (!baseUrl) return { status: "unreachable" };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: "POST",
      // Always send the body: without it the API answers 500.
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      // The API reads its own cookie before the body; never let a stale one win.
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { status: "unreachable" };
  }

  // Expired/invalid/missing token (500), deleted (403), unknown user (404),
  // rate limited (429)… any error answer ends the session.
  if (!response.ok) return { status: "rejected" };

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "rejected" };
  }
  const data = isRecord(payload) && payload.success !== false ? payload.data : null;
  const accessToken =
    isRecord(data) && typeof data.accessToken === "string"
      ? data.accessToken.trim()
      : "";
  // Only the access token comes back; the refresh token is not rotated.
  return accessToken
    ? { status: "refreshed", accessToken }
    : { status: "rejected" };
}

/**
 * Gets a new access token. `failedAccessToken` is the token that was just
 * rejected or is about to expire (undefined when there was none). Concurrent
 * callers share one request, and a token minted in the last hour that isn't
 * the failed one is reused without calling the API.
 */
export function refreshAccessToken(
  refreshToken: string,
  failedAccessToken: string | undefined,
): Promise<RefreshOutcome> {
  const now = Date.now();
  prune(now);

  if (rejected.has(refreshToken)) {
    return Promise.resolve({ status: "rejected" });
  }
  const entry = reusable(refreshToken, now);
  if (entry && entry.accessToken !== failedAccessToken) {
    // Remember this stale token too, so the next render sends the new one
    // straight away (see knownReplacement).
    entry.replaced = failedAccessToken;
    return Promise.resolve({ status: "refreshed", accessToken: entry.accessToken });
  }

  const running = inFlight.get(refreshToken);
  if (running) return running;

  const request = callRefreshEndpoint(refreshToken)
    .then((outcome) => {
      if (outcome.status === "refreshed") {
        recent.set(refreshToken, {
          accessToken: outcome.accessToken,
          replaced: failedAccessToken,
          at: Date.now(),
        });
      } else if (outcome.status === "rejected") {
        recent.delete(refreshToken);
        rejected.set(refreshToken, Date.now());
      }
      return outcome;
    })
    .finally(() => {
      inFlight.delete(refreshToken);
    });

  inFlight.set(refreshToken, request);
  return request;
}
