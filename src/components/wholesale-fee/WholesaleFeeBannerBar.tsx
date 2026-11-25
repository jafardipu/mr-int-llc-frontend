"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatFeeAmount, wholesaleFeePath } from "@/lib/wholesale-fee";

/** Slim notice shown on every page while the wholesale fee is unpaid. */
export default function WholesaleFeeBannerBar({
  amount,
}: {
  amount: number | null;
}) {
  const pathname = usePathname();
  // The fee pages explain the fee themselves.
  if (pathname.startsWith(wholesaleFeePath)) return null;

  const fee = amount !== null ? `${formatFeeAmount(amount)} ` : "";

  return (
    <div
      role="region"
      aria-label="Wholesale account fee"
      className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
    >
      Complete your one-time {fee}wholesale fee to unlock wholesale pricing.{" "}
      <Link
        href={wholesaleFeePath}
        className="font-semibold underline underline-offset-2 hover:text-amber-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
      >
        Pay now
      </Link>
    </div>
  );
}
