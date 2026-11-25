"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { confirmWholesaleFeeAction } from "@/actions/wholesale-fee.actions";
import { setWholesaleFeeState } from "@/components/wholesale-fee/wholesale-fee-store";
import { endClientSession } from "@/lib/client-session";
import { wholesaleFeePath } from "@/lib/wholesale-fee";

const retryDelayMs = 3_000;
const maxRetries = 10;

type View =
  | { kind: "confirming" }
  | { kind: "active" }
  | { kind: "still-confirming"; checking: boolean }
  | { kind: "error"; message: string };

type Outcome = "active" | "not-paid-yet" | "handled";

export default function ConfirmWholesaleFee() {
  const router = useRouter();
  const sessionId = useSearchParams().get("session_id")?.trim() ?? "";
  const [view, setView] = useState<View>({ kind: "confirming" });

  useEffect(() => {
    if (!sessionId) {
      router.replace(wholesaleFeePath);
      return;
    }

    // Confirming is a read, so StrictMode's second run is harmless; the
    // cleanup stops the first run's retries.
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attempt = async (retriesLeft: number) => {
      const outcome = await confirmOnce(sessionId, setView);
      if (cancelled || outcome !== "not-paid-yet") return;
      if (retriesLeft > 0) {
        timer = setTimeout(() => void attempt(retriesLeft - 1), retryDelayMs);
      } else {
        setView({ kind: "still-confirming", checking: false });
      }
    };

    void attempt(maxRetries);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router, sessionId]);

  const checkAgain = async () => {
    setView({ kind: "still-confirming", checking: true });
    const outcome = await confirmOnce(sessionId, setView);
    if (outcome === "not-paid-yet") {
      setView({ kind: "still-confirming", checking: false });
    }
  };

  if (view.kind === "active") {
    return (
      <Panel icon={<CheckCircle2 aria-hidden="true" className="size-10 text-emerald-600" />}>
        <h1 className="text-2xl font-bold text-[#24231F]">
          Your wholesale account is active
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Wholesale pricing, your cart and checkout are unlocked.
        </p>
        {/* The confirm action purged the cached pages, so this loads
            products with wholesale prices. */}
        <Link
          href="/products"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary-color px-6 text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color"
        >
          Start shopping
        </Link>
      </Panel>
    );
  }

  if (view.kind === "still-confirming") {
    return (
      <Panel icon={<Clock aria-hidden="true" className="size-10 text-amber-600" />}>
        <h1 className="text-xl font-bold text-[#24231F]">
          We&apos;re still confirming your payment
        </h1>
        <p role="status" className="mt-2 text-sm text-[#6B7280]">
          We&apos;re still confirming your payment. This can take a few minutes.
        </p>
        <button
          type="button"
          onClick={() => void checkAgain()}
          disabled={view.checking}
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-secondary-color px-6 text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color disabled:cursor-wait disabled:opacity-70"
        >
          {view.checking && (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          )}
          {view.checking ? "Checking…" : "Check again"}
        </button>
      </Panel>
    );
  }

  if (view.kind === "error") {
    return (
      <Panel>
        <p role="alert" className="text-sm text-red-700">
          {view.message}
        </p>
        <Link
          href={wholesaleFeePath}
          className="mt-4 inline-flex text-sm font-semibold text-secondary-color underline underline-offset-2"
        >
          Back to the wholesale fee page
        </Link>
      </Panel>
    );
  }

  return (
    <Panel icon={<Loader2 aria-hidden="true" className="size-10 animate-spin text-secondary-color" />}>
      <p role="status" className="text-sm font-medium text-[#24231F]">
        Confirming your payment…
      </p>
    </Panel>
  );
}

async function confirmOnce(
  sessionId: string,
  setView: (view: View) => void,
): Promise<Outcome> {
  const result = await confirmWholesaleFeeAction(sessionId);

  if (result.status === "error") {
    if (result.statusCode === 401) {
      const back = `${wholesaleFeePath}/success?session_id=${encodeURIComponent(sessionId)}`;
      void endClientSession({ message: result.message, callbackUrl: back });
      return "handled";
    }
    setView({ kind: "error", message: result.message });
    return "handled";
  }

  // Paid, or the admin switched the fee off meanwhile: either way unlocked.
  if (result.data.status === "paid" || !result.data.required) {
    setWholesaleFeeState({ required: false, amount: null });
    setView({ kind: "active" });
    return "active";
  }

  return "not-paid-yet";
}

function Panel({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center shadow-sm">
      {icon && <div className="mb-4">{icon}</div>}
      {children}
    </section>
  );
}
