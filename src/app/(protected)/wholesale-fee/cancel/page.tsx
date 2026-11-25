import Link from "next/link";
import { CircleAlert } from "lucide-react";
import Container from "@/components/container/Container";
import { wholesaleFeePath } from "@/lib/wholesale-fee";

// Stripe returns here when the customer leaves its page without paying. The
// backend fixes this path.
export const metadata = {
  title: "Payment not completed",
};

export default function WholesaleFeeCancelPage() {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full max-w-lg">
        <section className="flex flex-col items-center rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center shadow-sm">
          <CircleAlert aria-hidden="true" className="mb-4 size-10 text-amber-600" />
          <h1 className="text-xl font-bold text-[#24231F]">
            Payment not completed
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Payment not completed. Your wholesale account isn&apos;t active yet.
          </p>
          <Link
            href={wholesaleFeePath}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary-color px-6 text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color"
          >
            Try again
          </Link>
        </section>
      </main>
    </Container>
  );
}
