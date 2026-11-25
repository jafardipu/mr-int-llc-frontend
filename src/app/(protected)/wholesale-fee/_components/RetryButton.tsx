"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the server page, which asks the API again. */
export default function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-10 cursor-pointer items-center rounded-full bg-secondary-color px-5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Retrying…" : "Retry"}
    </button>
  );
}
