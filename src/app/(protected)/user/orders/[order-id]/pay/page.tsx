import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApiRequestError } from "@/services/api-service";
import {
  getOrderById,
  orderNeedsPayment,
} from "@/services/orders.service";
import PaymentForm from "../../_components/PaymentForm";

type PayOrderPageProps = {
  params: Promise<{ "order-id": string }>;
};

export default function PayOrderPage({ params }: PayOrderPageProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          aria-label="Loading payment"
          className="min-h-72 animate-pulse rounded-xl bg-[#f1f0ed]"
        />
      }
    >
      <PayOrderContent params={params} />
    </Suspense>
  );
}

async function PayOrderContent({ params }: PayOrderPageProps) {
  let { "order-id": orderId } = await params;
  try {
    orderId = decodeURIComponent(orderId);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }

  let order;
  try {
    order = await getOrderById(orderId);
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load this order.";

    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {message}
      </p>
    );
  }

  if (!order) notFound();
  if (!orderNeedsPayment(order)) {
    redirect(`/user/orders/${order.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div>
        <Link
          href={`/user/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to order
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
          Pay now
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Complete payment for order {order.orderNumber}.
        </p>
      </div>

      <PaymentForm
        orderId={order.id}
        orderNumber={order.orderNumber}
        amount={order.payment?.amount ?? order.total}
      />
    </div>
  );
}
