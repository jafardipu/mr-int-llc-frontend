"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loginPath, sessionEndReasonFor } from "@/lib/auth-session";
import { endClientSession } from "@/lib/client-session";
import { logout } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";

/**
 * Rendered when the API still rejects the session after the server tried to
 * refresh it (refresh token expired or invalid, account blocked, not
 * verified or deleted). A Server Component can't clear cookies, so this
 * clears both tokens before going to /login; otherwise the proxy would send
 * the user straight back. Pass the 401's message to show why.
 */
export default function SessionExpired({
  callbackUrl,
  message,
}: {
  callbackUrl: string;
  message?: string;
}) {
  const dispatch = useAppDispatch();
  const loginHref = loginPath({
    callbackUrl,
    reason: sessionEndReasonFor(message),
  });

  useEffect(() => {
    dispatch(logout());
    // Single flight: StrictMode's second run joins the first.
    void endClientSession({ callbackUrl, message });
  }, [callbackUrl, dispatch, message]);

  return (
    <p
      role="status"
      className="rounded-md bg-amber-50 p-3 text-sm text-amber-800"
    >
      Your session has ended. Taking you to sign in…{" "}
      <Link href={loginHref} className="font-medium underline">
        Sign in
      </Link>
    </p>
  );
}
