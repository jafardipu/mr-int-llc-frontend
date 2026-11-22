import Link from "next/link";
import { Suspense } from "react";
import { Package, Search } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import PaginationSection from "@/components/shared/pagination/PaginationSection";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import {
  getMyOrders,
  orderItemCount,
  orderNeedsPayment,
  orderPrimaryImage,
  type OrderStatus,
} from "@/services/orders.service";
import OrderStatusBadge from "./OrderStatusBadge";
import OrdersFilters from "./OrdersFilters";
import OrderThumbnail from "./OrderThumbnail";
import PaymentStatusBadge from "./PaymentStatusBadge";
import PayNowButton from "./PayNowButton";

const pageSize = 10;
const statuses = new Set<OrderStatus>([
  "pending",
  "processing",
  "completed",
  "cancelled",
]);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type SearchParams = Record<string, string | string[] | undefined>;

function param(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(param(value));
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

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

export function OrdersListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading orders" className="space-y-7">
      <Skeleton className="h-11 w-full max-w-134 rounded-xl" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default async function OrdersList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const page = pageNumber(params.page);
  const searchTerm = param(params.searchTerm);
  const statusParam = param(params.status);
  const status =
    statusParam && statuses.has(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  let result: Awaited<ReturnType<typeof getMyOrders>>;
  try {
    result = await getMyOrders({
      page,
      limit: pageSize,
      sort: "-createdAt",
      searchTerm,
      status,
    });
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load orders.";

    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {message}
      </p>
    );
  }

  return (
    <section className="space-y-7" aria-label="Orders">
      <Suspense
        fallback={
          <div className="space-y-7">
            <Skeleton className="h-11 w-full max-w-134 rounded-xl" />
            <div className="flex gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </div>
        }
      >
        <OrdersFilters />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState
          icon={searchTerm || status ? Search : Package}
          message={
            searchTerm || status
              ? "No orders match these filters."
              : "No orders yet."
          }
          className="min-h-64 rounded-2xl border border-[#e3e7ec] bg-white"
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white shadow-[0_1px_3px_rgba(27,39,58,0.06)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse text-left">
                <thead className="bg-[#fafafa] text-sm font-semibold text-[#737b89]">
                  <tr>
                    <th scope="col" className="px-7 py-6">
                      Order No.
                    </th>
                    <th scope="col" className="px-5 py-6">
                      Date
                    </th>
                    <th scope="col" className="px-5 py-6">
                      Items
                    </th>
                    <th scope="col" className="px-5 py-6">
                      Total Amount
                    </th>
                    <th scope="col" className="px-5 py-6">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-6 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((order) => {
                    const count = orderItemCount(order);
                    const image = orderPrimaryImage(order);
                    const unpaid = orderNeedsPayment(order);
                    return (
                      <tr
                        key={order.id}
                        className="border-t border-[#edf0f3] text-base"
                      >
                        <td className="whitespace-nowrap px-7 py-6">
                          <span className="flex items-center gap-3">
                            <OrderThumbnail
                              image={image}
                              alt={order.items[0]?.name ?? order.orderNumber}
                            />
                            <span className="font-semibold text-[#1f2937]">
                              {order.orderNumber}
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-6 text-[#737b89]">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-6 text-[#596273]">
                          {count} {count === 1 ? "item" : "items"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-6 font-semibold text-[#374151]">
                          {currency.format(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-6">
                          <div className="flex flex-col items-start gap-2">
                            <OrderStatusBadge status={order.status} />
                            <PaymentStatusBadge status={order.payment?.status} />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-5">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <Link
                              href={`/user/orders/${order.id}`}
                              className="rounded-xl border border-[#e1e5eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
                            >
                              View
                            </Link>
                            {unpaid && <PayNowButton orderId={order.id} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {result.data.map((order) => {
              const count = orderItemCount(order);
              const image = orderPrimaryImage(order);
              const unpaid = orderNeedsPayment(order);
              return (
                <li
                  key={order.id}
                  className="rounded-2xl border border-[#e3e7ec] bg-white p-4 shadow-[0_1px_3px_rgba(27,39,58,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <OrderThumbnail
                        image={image}
                        alt={order.items[0]?.name ?? order.orderNumber}
                      />
                      <div>
                        <p className="font-semibold text-[#1f2937]">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-sm text-[#737b89]">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.payment?.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf0f3] pt-4">
                    <div>
                      <p className="text-sm text-[#737b89]">
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                      <p className="mt-1 font-semibold text-[#374151]">
                        {currency.format(order.total)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/user/orders/${order.id}`}
                        className="rounded-xl border border-[#e1e5eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
                      >
                        View
                      </Link>
                      {unpaid && <PayNowButton orderId={order.id} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {result.meta.total > result.meta.limit && (
            <PaginationSection
              total={result.meta.total}
              current={result.meta.page}
              pageSize={result.meta.limit}
            />
          )}
        </>
      )}
    </section>
  );
}
