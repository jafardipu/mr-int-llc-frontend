import { Check } from "lucide-react";
import type { OrderStatus } from "@/services/orders.service";

const steps: Array<{ key: OrderStatus | "placed"; title: string }> = [
  { key: "placed", title: "Order Placed" },
  { key: "pending", title: "Awaiting Payment" },
  { key: "processing", title: "Paid & Processing" },
  { key: "completed", title: "Completed" },
];

function stepState(
  stepKey: (typeof steps)[number]["key"],
  status: OrderStatus,
): "complete" | "current" | "upcoming" | "cancelled" {
  if (status === "cancelled") {
    if (stepKey === "placed" || stepKey === "pending") return "complete";
    return "cancelled";
  }

  const order: Array<(typeof steps)[number]["key"]> = [
    "placed",
    "pending",
    "processing",
    "completed",
  ];
  const currentIndex = order.indexOf(status === "pending" ? "pending" : status);
  const stepIndex = order.indexOf(stepKey);

  if (stepKey === "placed") return "complete";
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export default function OrderTimelineCard({
  status,
  createdAt,
}: {
  status: OrderStatus;
  createdAt: string;
}) {
  const placedDate = (() => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return createdAt;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  })();

  return (
    <section className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
      <h2 className="text-base font-semibold text-[#374151]">Order Timeline</h2>

      {status === "cancelled" && (
        <p className="mt-3 rounded-lg bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#dc2626]">
          This order was cancelled.
        </p>
      )}

      <ol className="mt-5 space-y-0">
        {steps.map((step, index) => {
          const state = stepState(step.key, status);
          const isComplete = state === "complete";
          const isCurrent = state === "current";

          return (
            <li
              key={step.key}
              className="relative flex min-h-14 gap-3.5 pb-3 last:min-h-0 last:pb-0"
            >
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-2.75 top-6 h-[calc(100%-12px)] w-0.5 ${
                    isComplete ? "bg-[#10b981]" : "bg-[#e2e8f0]"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  isComplete
                    ? "border-[#10b981] bg-[#10b981] text-white"
                    : isCurrent
                      ? "border-[#f59e0b] bg-white text-[#f59e0b]"
                      : "border-[#d7dce3] bg-[#f3f4f6] text-[#cbd5e1]"
                }`}
              >
                {isComplete ? (
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-medium leading-5 ${
                    isComplete
                      ? "text-[#374151]"
                      : isCurrent
                        ? "text-[#d97706]"
                        : "text-[#9ca3af]"
                  }`}
                >
                  {step.title}
                </p>
                {step.key === "placed" && placedDate && (
                  <p className="mt-0.5 text-xs leading-4 text-[#a3acb9]">
                    {placedDate}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
