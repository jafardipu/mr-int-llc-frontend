import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import Container from "@/components/container/Container";
import { Skeleton } from "@/components/ui/skeleton";
import SessionExpired from "@/app/(protected)/user/_components/SessionExpired";
import { formatFeeAmount, wholesaleFeePath } from "@/lib/wholesale-fee";
import { ApiRequestError } from "@/services/api-service";
import {
  getMyWholesaleFee,
  type WholesaleFee,
} from "@/services/wholesale-fee.service";
import PayWholesaleFeeButton from "./_components/PayWholesaleFeeButton";
import RetryButton from "./_components/RetryButton";
import WholesaleFeeLogoutButton from "./_components/WholesaleFeeLogoutButton";

export const metadata = {
  title: "Activate your wholesale account",
  description: "Pay the one-time fee to activate your wholesale account.",
};

const unlocks = [
  "Wholesale pricing on every product",
  "Your cart and checkout",
  "Orders, favorites and prep services",
];

export default function WholesaleFeePage() {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full max-w-lg">
        <Suspense
          fallback={
            <Skeleton
              aria-label="Loading your wholesale account fee"
              className="h-112 w-full rounded-2xl"
            />
          }
        >
          <WholesaleFeeContent />
        </Suspense>
      </main>
    </Container>
  );
}

async function WholesaleFeeContent() {
  let fee: WholesaleFee;
  try {
    fee = await getMyWholesaleFee();
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : undefined;
    if (status === 401) {
      return (
        <SessionExpired
          callbackUrl={wholesaleFeePath}
          message={error instanceof Error ? error.message : undefined}
        />
      );
    }
    // Not a wholesale account: there is nothing to pay.
    if (status === 403) redirect("/");

    return (
      <div className="space-y-4 rounded-2xl border border-[#E9E6DF] bg-white p-6 text-center sm:p-8">
        <p role="alert" className="text-sm text-[#4B5563]">
          {error instanceof ApiRequestError
            ? error.message
            : "We couldn't load your wholesale account fee."}
        </p>
        <RetryButton />
        <div>
          <WholesaleFeeLogoutButton />
        </div>
      </div>
    );
  }

  // Paid, never owed, or switched off by the admin.
  if (!fee.required) redirect("/");

  return (
    <section
      aria-labelledby="wholesale-fee-title"
      className="rounded-2xl border border-[#E9E6DF] bg-white p-6 shadow-sm sm:p-8"
    >
      <h1
        id="wholesale-fee-title"
        className="text-2xl font-bold tracking-tight text-[#24231F] sm:text-3xl"
      >
        Activate your wholesale account
      </h1>
      <p className="mt-2 text-sm text-[#6B7280]">
        One-time fee to activate your wholesale account.
      </p>

      <p className="mt-6 text-4xl font-bold text-[#24231F]">
        {formatFeeAmount(fee.amount)}
        <span className="ml-2 text-sm font-medium text-[#6B7280]">
          one-time
        </span>
      </p>

      <h2 className="mt-6 text-sm font-semibold text-[#24231F]">
        What it unlocks
      </h2>
      <ul className="mt-2 space-y-2 text-sm text-[#4B5563]">
        {unlocks.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check aria-hidden="true" className="mt-0.5 size-4 text-emerald-600" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PayWholesaleFeeButton amount={fee.amount} />
      </div>
      <p className="mt-3 text-center text-xs text-[#6B7280]">
        You&apos;ll pay on a secure Stripe page.
      </p>

      <div className="mt-6 border-t border-[#E9E6DF] pt-4 text-center">
        <WholesaleFeeLogoutButton />
      </div>
    </section>
  );
}
