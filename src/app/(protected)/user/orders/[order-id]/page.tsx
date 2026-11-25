import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApiRequestError } from "@/services/api-service";
import { redirectIfWholesaleFeeRequired } from "@/services/wholesale-fee.service";
import { getOrderById } from "@/services/orders.service";
import OrderDetailsHeader from "../_components/OrderDetailsHeader";
import OrderItemsCard from "../_components/OrderItemsCard";
import OrderTimelineCard from "../_components/OrderTimelineCard";
import PaymentStatusCard from "../_components/PaymentStatusCard";
import ShippingAddressCard from "../_components/ShippingAddressCard";

type OrderDetailsPageProps = {
  params: Promise<{ "order-id": string }>;
};

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          aria-label="Loading order details"
          className="min-h-72 animate-pulse rounded-xl bg-[#f1f0ed]"
        />
      }
    >
      <OrderDetailsContent params={params} />
    </Suspense>
  );
}

async function OrderDetailsContent({ params }: OrderDetailsPageProps) {
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
    redirectIfWholesaleFeeRequired(error);
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

  return (
    <div className="space-y-6">
      <OrderDetailsHeader order={order} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(250px,0.9fr)] xl:gap-6">
        <OrderItemsCard order={order} />
        <aside className="space-y-5">
          <ShippingAddressCard address={order.address} />
          <PaymentStatusCard order={order} />
          <OrderTimelineCard status={order.status} createdAt={order.createdAt} />
          {order.notes && (
            <section className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
              <h2 className="text-base font-semibold text-[#374151]">Notes</h2>
              <p className="mt-3 text-sm text-[#737b89]">{order.notes}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
