import { Suspense } from "react";
import Container from "@/components/container/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { getStorePrices } from "@/services/contents.service";
import CheckoutFlow from "./_components/CheckoutFlow";

export const metadata = {
  title: "Checkout",
  description: "Choose a shipping address and place your order.",
};

export default function ShippingAddressPage() {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full">
        <Suspense
          fallback={
            <Skeleton
              aria-label="Loading checkout"
              className="h-96 w-full rounded-2xl"
            />
          }
        >
          <CheckoutWithTaxRate />
        </Suspense>
      </main>
    </Container>
  );
}

async function CheckoutWithTaxRate() {
  // Only labels the tax line; amounts come from checkout-summary.
  const prices = await getStorePrices().catch(() => null);
  return <CheckoutFlow taxRate={prices?.taxRate ?? null} />;
}
