"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import {
  loadMyWholesaleFeeAction,
  startWholesaleFeeCheckoutAction,
} from "@/actions/wholesale-fee.actions";
import { endClientSession } from "@/lib/client-session";
import { formatFeeAmount, wholesaleFeePath } from "@/lib/wholesale-fee";


export default function PayWholesaleFeeButton({ amount }: { amount: number }) {
  const router = useRouter();
  // Stays true from the click until the browser leaves for Stripe, so a
  // second click can't start a second session.
  const [pending, setPending] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");

  const onPay = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    setMessage("");

    const result = await startWholesaleFeeCheckoutAction();
    if (result.status === "success") {
      // Stripe-hosted page: full navigation, not the Next.js router.
      window.location.assign(result.data.checkoutUrl);
      return;
    }

    if (result.statusCode === 401) {
      void endClientSession({
        message: result.message,
        callbackUrl: wholesaleFeePath,
      });
      return;
    }

    if (result.statusCode === 400) {
      // "Already paid", or the admin switched the fee off. Either way the
      // account may be unlocked now: check before showing an error.
      const fee = await loadMyWholesaleFeeAction();
      if (fee.status === "success" && !fee.data.required) {
        // Re-render the layout too, so the fee banner and buttons update.
        router.replace("/");
        router.refresh();
        return;
      }
    }

    // Includes 409 "still processing": the customer can retry in a minute.
    busyRef.current = false;
    setPending(false);
    setMessage(result.message);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void onPay()}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-color px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Opening secure payment…
          </>
        ) : (
          <>
            <Lock aria-hidden="true" className="size-4" />
            Pay {formatFeeAmount(amount)}
          </>
        )}
      </button>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
