"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { createPaymentAction } from "@/actions/payments.actions";
import { endClientSession } from "@/lib/client-session";
import { goToWholesaleFeeIfRequired } from "@/lib/wholesale-fee";

/**
 * Sends the customer to the order's Stripe Checkout page. The backend reuses
 * the order's open session, so repeated clicks are safe.
 */
export default function PayNowButton({
  orderId,
  className,
  label = "Pay Now",
}: {
  orderId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const busyRef = useRef(false);

  const onPay = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRedirecting(true);

    const result = await createPaymentAction(orderId);

    if (result.status === "error") {
      if (goToWholesaleFeeIfRequired(result.statusCode)) return;
      console.error("[orders] start payment failed", result);
      busyRef.current = false;
      setRedirecting(false);

      if (result.statusCode === 401) {
        void endClientSession({
          message: result.message,
          callbackUrl: `/user/orders/${orderId}`,
        });
        return;
      }
      // Cancelled, already paid, or 409 "still processing": show the reason
      // and reload the order so its current status is visible.
      toast.error(result.message);
      router.refresh();
      return;
    }

    window.location.assign(result.data.checkoutUrl);
  };

  return (
    <button
      type="button"
      onClick={() => void onPay()}
      disabled={redirecting}
      aria-busy={redirecting}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-[#995618] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7a4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      {redirecting ? "Redirecting…" : label}
    </button>
  );
}
