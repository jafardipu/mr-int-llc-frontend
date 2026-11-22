import type { Order } from "@/services/orders.service";
import { orderNeedsPayment } from "@/services/orders.service";
import CancelOrderButton from "./CancelOrderButton";
import PaymentStatusBadge from "./PaymentStatusBadge";
import PayNowButton from "./PayNowButton";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PaymentStatusCard({
  order,
}: {
  order: Pick<Order, "id" | "orderNumber" | "status" | "payment" | "total">;
}) {
  const { payment } = order;
  const canPay = orderNeedsPayment(order);

  return (
    <section className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#374151]">Payment</h2>
        <PaymentStatusBadge
          status={payment?.status}
          className="px-3 py-1"
        />
      </div>

      {payment ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#9ca3af]">Status</dt>
            <dd className="font-medium capitalize text-[#374151]">
              {payment.status}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#9ca3af]">Amount</dt>
            <dd className="font-semibold text-[#374151]">
              {currency.format(payment.amount)}
            </dd>
          </div>
          {payment.paymentMethod && (
            <div className="flex justify-between gap-3">
              <dt className="text-[#9ca3af]">Method</dt>
              <dd className="capitalize text-[#374151]">{payment.paymentMethod}</dd>
            </div>
          )}
          {payment.transactionId && (
            <div className="flex justify-between gap-3">
              <dt className="text-[#9ca3af]">Transaction</dt>
              <dd className="truncate text-[#374151]">{payment.transactionId}</dd>
            </div>
          )}
          {payment.paidAt && (
            <div className="flex justify-between gap-3">
              <dt className="text-[#9ca3af]">Paid at</dt>
              <dd className="text-[#374151]">{formatDateTime(payment.paidAt)}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-[#9ca3af]">No payment record yet.</p>
      )}

      {order.status === "cancelled" && payment?.status === "refunded" && (
        <p className="mt-4 rounded-lg bg-[#e0f2fe] px-3 py-2 text-sm text-[#0369a1]">
          This order was cancelled and your payment has been refunded.
        </p>
      )}

      {canPay && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-[#737b89]">
            This order is awaiting payment of{" "}
            <span className="font-semibold text-[#374151]">
              {currency.format(order.total)}
            </span>
            . Unpaid orders may be cancelled automatically after a while.
          </p>
          <PayNowButton orderId={order.id} className="h-11 w-full" />
          <CancelOrderButton
            orderId={order.id}
            orderNumber={order.orderNumber}
            className="h-11 w-full"
          />
        </div>
      )}
    </section>
  );
}
