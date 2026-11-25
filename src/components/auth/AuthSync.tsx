"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginPath, requiresLogin } from "@/lib/auth-session";
import { readAuthEvent } from "@/lib/client-session";
import { logout } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";

/**
 * Keeps tabs in step. Tabs share the auth cookies, so a refreshed token is
 * picked up by every tab on its next request without anything here. A
 * sign-in or sign-out in another tab is announced through `storage` (see
 * `announceAuthChange`), and this tab follows: it leaves account pages after
 * a sign-out and re-renders so the navbar, prices and wishlist match.
 */
export default function AuthSync() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const type = readAuthEvent(event);
      if (!type) return;

      if (type === "logout") {
        dispatch(logout());
        const { pathname, search, origin } = window.location;
        // A full load also drops this tab's cached account data.
        const target = requiresLogin(pathname)
          ? loginPath({ callbackUrl: `${pathname}${search}` })
          : `${pathname}${search}`;
        window.location.replace(new URL(target, origin).href);
        return;
      }

      router.refresh();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch, router]);

  return null;
}
