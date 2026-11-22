import { Suspense } from "react";
import Container from "@/components/container/Container";
import { AuthApiError } from "@/actions/auth-request";
import { confirmPayment } from "@/actions/payments.service";
import CheckoutResult, {
  CheckoutResultSkeleton,
  firstParam,
} from "../_components/CheckoutResult";
import SuccessConfetti from "./_components/SuccessConfetti";

export const metadata = {
  title: "Payment",
  description: "Confirming your payment.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Stripe redirects here with ?session_id=…&orderId=… (built by the backend
// from its CLIENT_URL setting, so this path must not change).
export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Container className="page-padding">
      <Suspense fallback={<CheckoutResultSkeleton label="Confirming payment" />}>
        <ConfirmPayment searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ConfirmPayment({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sessionId = firstParam(params.session_id) ?? firstParam(params.sessionId);
  const orderId = firstParam(params.orderId);

  if (!sessionId) {
    return (
      <CheckoutResult variant="error" title="Missing payment details" orderId={orderId}>
        <p>
          We couldn&apos;t find a payment session in this link. Check your
          order to see its payment status.
        </p>
      </CheckoutResult>
    );
  }

  let status: string;
  try {
    // Public endpoint; safe to call more than once.
    ({ status } = await confirmPayment(sessionId));
  } catch (error) {
    return (
      <CheckoutResult variant="error" title="We couldn't confirm your payment" orderId={orderId}>
        <p>
          {error instanceof AuthApiError
            ? error.message
            : "Something went wrong while confirming your payment."}
        </p>
        <p>
          If you were charged, your order will update automatically in a few
          minutes.
        </p>
      </CheckoutResult>
    );
  }

  if (status === "paid") {
    return (
      <>
        <SuccessConfetti />
        <CheckoutResult variant="success" title="Payment successful" orderId={orderId}>
          <p>Thank you! Your payment went through and we&apos;re preparing your order.</p>
        </CheckoutResult>
      </>
    );
  }

  return (
    <CheckoutResult variant="pending" title="Your payment is being confirmed" orderId={orderId}>
      <p>
        Stripe is still confirming your payment. Your order will update
        automatically in a few minutes, so there&apos;s no need to pay again.
      </p>
    </CheckoutResult>
  );
}
