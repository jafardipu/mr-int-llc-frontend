"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "cn";

export default function FaqError() {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  return (
    <div
      role="alert"
      className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-[#F0F0F0] bg-white px-4 py-10 text-center sm:mt-12"
    >
      <p className="text-sm text-[#6B7280]">
        We couldn&apos;t load the FAQs right now. Please try again.
      </p>
      <button
        type="button"
        // Re-renders the server components, which requests the FAQs again.
        onClick={() => startRetry(() => router.refresh())}
        disabled={isRetrying}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-secondary-color px-5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RotateCw
          aria-hidden="true"
          className={cn("size-4", isRetrying && "animate-spin")}
        />
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
