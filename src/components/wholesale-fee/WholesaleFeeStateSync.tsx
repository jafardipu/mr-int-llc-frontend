"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setWholesaleFeeState } from "./wholesale-fee-store";

const refreshCooldownMs = 10_000;

/**
 * Copies the server's view of the fee (from `/users/my-profile`) into the
 * client store, so client components can swap their buttons.
 *
 * This app has no notification socket. To pick up a payment made in another
 * tab, an unpaid customer's tab re-renders from the server whenever it becomes
 * visible again; the Navbar then reports the new state.
 */
export default function WholesaleFeeStateSync({
  required,
  amount,
}: {
  required: boolean;
  amount: number | null;
}) {
  const router = useRouter();

  useEffect(() => {
    setWholesaleFeeState({ required, amount });
  }, [required, amount]);

  useEffect(() => {
    if (!required) return;

    let lastRefresh = Date.now();
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh < refreshCooldownMs) return;
      lastRefresh = Date.now();
      router.refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [required, router]);

  return null;
}
