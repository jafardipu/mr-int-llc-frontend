"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import {
  confirmPaymentAction,
  createPaymentAction,
} from "@/actions/payments.actions";
import { getStripe, getStripePublishableKey } from "@/lib/stripe";
import {
  clearPendingPayment,
  readPendingPayment,
} from "@/lib/payment-session";
import PaymentResultModal from "./PaymentResultModal";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type PaymentFormProps = {
  orderId: string;
  orderNumber: string;
  amount: number;
};

type ResultState = {
  variant: "success" | "failed";
  title: string;
  message: string;
} | null;

function CheckoutForm({
  orderId,
  orderNumber,
  amount,
  paymentIntentId,
  onResult,
}: PaymentFormProps & {
  paymentIntentId: string;
  onResult: (result: NonNullable<ResultState>) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finishFailed = (message: string) => {
    setError(message);
    setSubmitting(false);
    onResult({
      variant: "failed",
      title: "Payment failed",
      message,
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError("");

    const returnUrl = `${window.location.origin}/user/orders/${orderId}/pay`;
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (result.error) {
      finishFailed(
        result.error.message || "Payment failed. Please try again.",
      );
      return;
    }

    const intentStatus = result.paymentIntent?.status;
    if (intentStatus && intentStatus !== "succeeded") {
      finishFailed(
        intentStatus === "canceled"
          ? "Payment was canceled."
          : "Payment was not completed.",
      );
      return;
    }

    const intentId = result.paymentIntent?.id || paymentIntentId;
    const confirmed = await confirmPaymentAction(intentId);
    clearPendingPayment();

    if (confirmed.status === "error") {
      finishFailed(confirmed.message);
      return;
    }

    setSubmitting(false);
    onResult({
      variant: "success",
      title: "Payment successful",
      message:
        confirmed.message ||
        "Your payment went through. We’re preparing your order.",
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[#9ca3af]">Paying for</p>
            <p className="mt-1 text-lg font-semibold text-[#1f2937]">
              {orderNumber}
            </p>
          </div>
          <p className="text-xl font-bold text-[#1f2937]">
            {currency.format(amount)}
          </p>
        </div>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            clearPendingPayment();
            onResult({
              variant: "failed",
              title: "Payment canceled",
              message: "You canceled the payment. You can pay this order later.",
            });
          }}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#e1e5eb] bg-white px-5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:opacity-60 sm:flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#995618] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7a4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
        >
          {submitting ? "Processing…" : `Pay ${currency.format(amount)}`}
        </button>
      </div>
    </form>
  );
}

export default function PaymentForm({
  orderId,
  orderNumber,
  amount,
}: PaymentFormProps) {
  const stripePromise = useMemo(() => getStripe(), []);
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [result, setResult] = useState<ResultState>(null);

  const goToOrder = () => {
    clearPendingPayment();
    router.replace(`/user/orders/${orderId}`);
    router.refresh();
  };

  useEffect(() => {
    let cancelled = false;

    async function startPayment() {
      if (!getStripePublishableKey()) {
        const message = "Stripe publishable key is not configured.";
        setBootError(message);
        setLoading(false);
        toast.error(message);
        window.setTimeout(() => {
          if (!cancelled) goToOrder();
        }, 1800);
        return;
      }

      const pending = readPendingPayment(orderId);
      if (pending) {
        setClientSecret(pending.clientSecret);
        setPaymentIntentId(pending.paymentIntentId);
        setLoading(false);
        return;
      }

      const created = await createPaymentAction({
        orderId,
        paymentMethod: "card",
      });

      if (cancelled) return;

      if (created.status === "error") {
        if (created.message.toLowerCase().includes("already paid")) {
          toast.success("This order is already paid.");
          goToOrder();
          return;
        }

        setBootError(created.message);
        setLoading(false);
        toast.error(created.message);
        window.setTimeout(() => {
          if (!cancelled) goToOrder();
        }, 1800);
        return;
      }

      setClientSecret(created.data.clientSecret);
      setPaymentIntentId(created.data.paymentIntentId);
      setLoading(false);
    }

    void startPayment();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per order
  }, [orderId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectedIntent =
      params.get("payment_intent") || params.get("paymentIntentId");
    if (!redirectedIntent) return;

    let cancelled = false;
    (async () => {
      const confirmed = await confirmPaymentAction(redirectedIntent);
      if (cancelled) return;

      clearPendingPayment();
      if (confirmed.status === "error") {
        setResult({
          variant: "failed",
          title: "Payment failed",
          message: confirmed.message,
        });
        return;
      }

      setResult({
        variant: "success",
        title: "Payment successful",
        message:
          confirmed.message ||
          "Your payment went through. We’re preparing your order.",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Preparing payment"
        className="min-h-64 animate-pulse rounded-2xl bg-[#f1f0ed]"
      />
    );
  }

  if (bootError) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {bootError} Redirecting to order details…
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        Unable to start payment. Redirecting to order details…
      </p>
    );
  }

  return (
    <>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#995618",
            },
          },
        }}
      >
        <CheckoutForm
          orderId={orderId}
          orderNumber={orderNumber}
          amount={amount}
          paymentIntentId={paymentIntentId}
          onResult={setResult}
        />
      </Elements>

      <PaymentResultModal
        open={result !== null}
        variant={result?.variant ?? "failed"}
        title={result?.title ?? ""}
        message={result?.message ?? ""}
        actionLabel={
          result?.variant === "success" ? "View order" : "Back to order"
        }
        onContinue={goToOrder}
      />
    </>
  );
}
