import { NextResponse, type NextRequest } from "next/server";
import {
  accessTokenCookie,
  accessTokenCookieOptions,
  refreshTokenCookie,
} from "@/lib/auth-cookies";
import { refreshAccessToken } from "@/lib/auth-refresh";
import { accessTokenState, loginPath, requiresLogin } from "@/lib/auth-session";

const authPages = [
  "/login",
  "/sign-up",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

type SessionChange =
  | { kind: "unchanged" }
  | { kind: "refreshed"; accessToken: string }
  | { kind: "ended" };

/**
 * Proactive refresh. Before a page or Server Function runs, an access token
 * that is missing, expired or expires within 24 hours is swapped for a new
 * one. It is written to the forwarded request (so `cookies()` sees it in this
 * request) and to the response (so the browser keeps it). Server Components
 * can't set cookies, which is why this happens here.
 */
async function refreshSession(request: NextRequest): Promise<SessionChange> {
  const accessToken = request.cookies.get(accessTokenCookie)?.value;
  const refreshToken = request.cookies.get(refreshTokenCookie)?.value;
  if (!accessToken && !refreshToken) return { kind: "unchanged" };

  const state = accessToken ? accessTokenState(accessToken) : "expired";
  if (state === "fresh") return { kind: "unchanged" };

  const end = (): SessionChange => {
    request.cookies.delete(accessTokenCookie);
    request.cookies.delete(refreshTokenCookie);
    return { kind: "ended" };
  };

  if (!refreshToken) {
    // OTP sign-up gives no refresh token: use the token until it expires.
    return state === "expired" ? end() : { kind: "unchanged" };
  }

  const outcome = await refreshAccessToken(refreshToken, accessToken);
  if (outcome.status === "refreshed") {
    request.cookies.set(accessTokenCookie, outcome.accessToken);
    return { kind: "refreshed", accessToken: outcome.accessToken };
  }
  if (outcome.status === "rejected") return end();
  // No answer from the API: not a logout. Keep the tokens; the page reports
  // the outage if it needs the API.
  return { kind: "unchanged" };
}

function withSessionCookies(response: NextResponse, change: SessionChange) {
  if (change.kind === "refreshed") {
    response.cookies.set(
      accessTokenCookie,
      change.accessToken,
      accessTokenCookieOptions,
    );
  } else if (change.kind === "ended") {
    response.cookies.delete(accessTokenCookie);
    response.cookies.delete(refreshTokenCookie);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const change = await refreshSession(request);
  const { pathname, search } = request.nextUrl;
  // A refresh token alone still counts: the API may just be unreachable.
  const isLoggedIn = Boolean(
    request.cookies.get(accessTokenCookie)?.value ||
      request.cookies.get(refreshTokenCookie)?.value,
  );
  const isAuthPage = authPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  // A Server Function call is a POST to the page. Never redirect it: the
  // caller would get HTML instead of its result. It runs without a session,
  // answers 401, and the browser sends the user to sign in.
  const isServerAction =
    request.method === "POST" && request.headers.has("next-action");

  if (!isServerAction && requiresLogin(pathname) && !isLoggedIn) {
    // Keep the query: Stripe's return URL carries `?session_id=`.
    const loginUrl = new URL(
      loginPath({
        callbackUrl: `${pathname}${search}`,
        reason: change.kind === "ended" ? "expired" : undefined,
      }),
      request.url,
    );
    return withSessionCookies(NextResponse.redirect(loginUrl), change);
  }

  if (!isServerAction && isAuthPage && isLoggedIn) {
    return withSessionCookies(
      NextResponse.redirect(new URL("/user/dashboard", request.url)),
      change,
    );
  }

  return withSessionCookies(
    change.kind === "unchanged"
      ? NextResponse.next()
      : NextResponse.next({ request: { headers: request.headers } }),
    change,
  );
}

export const config = {
  matcher: [
    // Every page and Server Function call, so the token is refreshed before
    // anything uses it (product prices, cart, checkout, the account area).
    // Skips build output, image optimization and static files.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|txt|xml|json|webmanifest|woff2?|ttf|otf|map|js|css)$).*)",
  ],
};
