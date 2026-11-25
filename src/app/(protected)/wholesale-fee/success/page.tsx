import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Container from "@/components/container/Container";
import ConfirmWholesaleFee from "../_components/ConfirmWholesaleFee";

// Stripe returns here with `?session_id=…`. The backend fixes this path.
export const metadata = {
  title: "Confirming your payment",
};

export default function WholesaleFeeSuccessPage() {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full max-w-lg">
        <Suspense
          fallback={
            <div className="flex flex-col items-center rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center">
              <Loader2
                aria-hidden="true"
                className="mb-4 size-10 animate-spin text-secondary-color"
              />
              <p role="status" className="text-sm font-medium text-[#24231F]">
                Confirming your payment…
              </p>
            </div>
          }
        >
          <ConfirmWholesaleFee />
        </Suspense>
      </main>
    </Container>
  );
}
