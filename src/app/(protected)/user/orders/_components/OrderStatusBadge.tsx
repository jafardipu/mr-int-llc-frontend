import { cn } from "cn";
import type { OrderStatus } from "@/services/orders.service";

// Order statuses use "cancelled" (two Ls); payment statuses use "canceled".
const statuses: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Awaiting payment", className: "bg-[#f1f5f9] text-[#64748b]" },
  processing: { label: "Processing", className: "bg-[#fff4e5] text-[#e58200]" },
  completed: { label: "Completed", className: "bg-[#e5f7ed] text-[#16a34a]" },
  cancelled: { label: "Cancelled", className: "bg-[#fee2e2] text-[#dc2626]" },
};

const unknownStyle = "bg-[#f1f5f9] text-[#64748b]";

export default function OrderStatusBadge({
  status,
  className,
}: {
  /** Unknown values are shown as-is. */
  status: OrderStatus | (string & {});
  className?: string;
}) {
  const known = Object.hasOwn(statuses, status)
    ? statuses[status as OrderStatus]
    : null;

  return (
    <span
      className={cn(
        "inline-flex min-w-29 justify-center rounded-full px-4 py-2 text-sm font-medium",
        known?.className ?? unknownStyle,
        className,
      )}
    >
      {known?.label ?? (status || "Unknown")}
    </span>
  );
}
