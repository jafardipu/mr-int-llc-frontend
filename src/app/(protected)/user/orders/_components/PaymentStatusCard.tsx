import Link from "next/link";
import type { OrderPayment } from "@/services/orders.service";

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
  payment,
  orderId,
  needsPayment,
}: {
  payment: OrderPayment | null;
  orderId: string;
  needsPayment: boolean;
}) {
  const isPaid = payment?.status === "paid";

  return (
    <section className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#374151]">Payment</h2>
        {isPaid ? (
          <span className="rounded-full bg-[#e5f7ed] px-3 py-1 text-xs font-semibold text-[#16a34a]">
            Paid
          </span>
        ) : (
          <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-xs font-semibold text-[#e58200]">
            {payment?.status ? payment.status : "Unpaid"}
          </span>
        )}
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
              <dd className="text-[#374151]">{payment.paymentMethod}</dd>
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

      {needsPayment && (
        <Link
          href={`/user/orders/${orderId}/pay`}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#995618] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7a4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
        >
          Pay Now
        </Link>
      )}
    </section>
  );
}
