import type { OrderStatus } from "@/services/orders.service";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-[#f1f5f9] text-[#64748b]",
  processing: "bg-[#fff4e5] text-[#e58200]",
  completed: "bg-[#e5f7ed] text-[#16a34a]",
  cancelled: "bg-[#fee2e2] text-[#dc2626]",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex min-w-29 justify-center rounded-full px-4 py-2 text-sm font-medium capitalize ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
