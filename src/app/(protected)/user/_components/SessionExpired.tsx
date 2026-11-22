"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { logout } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";

/**
 * Rendered when the API rejects the access token (expired, or the account is
 * blocked or unverified). The auth cookies are cleared before going to /login,
 * because the proxy sends anyone who still has an access-token cookie away
 * from the login page and back to the account area, which would loop.
 */
export default function SessionExpired({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    // Signing out twice (StrictMode) is harmless; only the last run navigates.
    let cancelled = false;
    void (async () => {
      try {
        await logoutAction();
      } catch {
        // Still send the customer to sign in.
      }
      if (cancelled) return;
      dispatch(logout());
      router.replace(loginHref);
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, loginHref, router]);

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
