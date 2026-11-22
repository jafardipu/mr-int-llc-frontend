import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import AnimatedArrow from "@/components/animation/AnimatedArrow";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import type { DashboardOrder } from "@/services/orders.service";
import OrderStatusBadge from "../../orders/_components/OrderStatusBadge";
import OrderThumbnail from "../../orders/_components/OrderThumbnail";
import PaymentStatusBadge from "../../orders/_components/PaymentStatusBadge";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RecentOrders({ orders }: { orders: DashboardOrder[] }) {
  return (
    <section
      aria-labelledby="recent-orders-heading"
      className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-7"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="recent-orders-heading"
          className="text-xl font-bold tracking-tight text-[#111827]"
        >
          Recent Orders
        </h2>
        <Link
          href="/user/orders"
          className="group inline-flex cursor-pointer items-center gap-1 text-base font-semibold text-[#995618] hover:text-[#5f350d]"
        >
          View All Orders <AnimatedArrow size={16} />
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center pb-4">
          <EmptyState
            icon={Package}
            message="You haven't placed any orders yet. When you do, they'll show up here."
            className="min-h-0 pb-4 pt-6"
          />
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#995618] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7a4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const name = order.firstItemName ?? `Order #${order.orderNumber}`;
            return (
              <li key={order.id}>
                <Link
                  href={`/user/orders/${order.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-[#edf0f3] p-4 transition-colors hover:border-[#e6d8c8] hover:bg-[#fdfbf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] sm:gap-4"
                >
                  <OrderThumbnail
                    image={order.image}
                    alt={name}
                    className="size-16"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 truncate text-base font-semibold text-[#111827]">
                        {name}
                      </h3>
                      <p className="shrink-0 text-base font-bold text-[#111827]">
                        {currency.format(order.total)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      Order #{order.orderNumber} · {formatDate(order.createdAt)}{" "}
                      · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OrderStatusBadge
                        status={order.status}
                        className="min-w-0 px-2.5 py-0.5 text-xs font-semibold"
                      />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="hidden shrink-0 text-[#9aa4b4] transition-transform duration-300 group-hover:translate-x-1.5 sm:block"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
