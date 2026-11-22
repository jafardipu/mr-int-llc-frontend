import { Suspense } from "react";
import Container from "@/components/container/Container";
import CheckoutResult, {
  CheckoutResultSkeleton,
  firstParam,
} from "../_components/CheckoutResult";

export const metadata = {
  title: "Payment not completed",
  description: "Your order is saved but has not been paid.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Stripe sends customers here (?orderId=…) when they leave Checkout without
// paying. The path is built by the backend from CLIENT_URL; don't move it.
export default function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Container className="page-padding">
      <Suspense fallback={<CheckoutResultSkeleton label="Loading" />}>
        <CancelContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function CancelContent({ searchParams }: { searchParams: SearchParams }) {
  const orderId = firstParam((await searchParams).orderId);

  return (
    <CheckoutResult
      variant="cancel"
      title="Payment not completed"
      orderId={orderId}
      primaryLabel="Pay or cancel order"
    >
      <p>
        Your order has been saved, but it hasn&apos;t been paid yet. You
        weren&apos;t charged.
      </p>
      <p>
        You can pay for it or cancel it from the order page. Unpaid orders may
        be cancelled automatically after a while.
      </p>
    </CheckoutResult>
  );
}
