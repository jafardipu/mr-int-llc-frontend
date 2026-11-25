"use server";

import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";
import type { RefreshSessionResult } from "@/lib/auth-session";
import { refreshSessionForClient } from "@/lib/server-session";

/**
 * The access token for the browser's API client (the cookie is httpOnly).
 * The proxy runs before this action, so an expiring token is already
 * refreshed. The refresh token never leaves the server.
 */
export async function getAccessTokenAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(accessTokenCookie)?.value ?? null;
}

/**
 * Called by the browser's API client after a 401 that calls for a refresh.
 * `failedAccessToken` is the token the API rejected. Saves the new token in
 * the cookie, or clears both tokens when the session is over.
 */
export async function refreshSessionAction(
  failedAccessToken?: string,
): Promise<RefreshSessionResult> {
  return refreshSessionForClient(
    typeof failedAccessToken === "string" ? failedAccessToken : undefined,
  );
}
