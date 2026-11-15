import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Order } from "@/services/orders.service";
import OrderStatusBadge from "./OrderStatusBadge";
import PrintInvoiceButton from "./PrintInvoiceButton";

function formatDateTime(value: string) {
  if (!value) return "—";
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

export default function OrderDetailsHeader({ order }: { order: Order }) {
  return (
    <header className="space-y-5">
      <Link
        href="/user/orders"
        className="inline-flex items-center gap-2 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to My Orders
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
            Order Details
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-[#1f2937]">
              {order.orderNumber}
            </p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-4">
            <p className="text-sm text-[#9ca3af]">Order Date</p>
            <p className="mt-1 text-sm font-medium text-[#374151]">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <PrintInvoiceButton />
      </div>
    </header>
  );
}
