import { cn } from "cn";
import type { PaymentStatus } from "@/services/orders.service";

const awaiting = "bg-[#fff4e5] text-[#e58200]";
const neutral = "bg-[#f1f5f9] text-[#64748b]";

// Payment statuses use "canceled" (one L); order statuses use "cancelled".
const styles: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-[#e5f7ed] text-[#16a34a]" },
  pending: { label: "Unpaid", className: awaiting },
  refunded: { label: "Refunded", className: "bg-[#e0f2fe] text-[#0369a1]" },
  canceled: { label: "Canceled", className: neutral },
  failed: { label: "Failed", className: "bg-[#fee2e2] text-[#dc2626]" },
};

/** No payment record: the customer never started a payment. */
const notStarted = { label: "Not paid", className: awaiting };

export default function PaymentStatusBadge({
  status,
  className,
}: {
  /** Unknown values are shown as-is. */
  status: PaymentStatus | null | undefined;
  className?: string;
}) {
  const style = !status
    ? notStarted
    : Object.hasOwn(styles, status)
      ? styles[status]
      : { label: status, className: neutral };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
