import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "cn";

const variants = {
  success: { Icon: CheckCircle2, className: "bg-[#e5f7ed] text-[#16a34a]" },
  pending: { Icon: Clock, className: "bg-[#fff4e5] text-[#e58200]" },
  cancel: { Icon: XCircle, className: "bg-[#f1f5f9] text-[#64748b]" },
  error: { Icon: AlertCircle, className: "bg-[#fee2e2] text-[#dc2626]" },
} as const;

export function orderHref(orderId: string | undefined) {
  return orderId
    ? `/user/orders/${encodeURIComponent(orderId)}`
    : "/user/orders";
}

export function firstParam(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

export default function CheckoutResult({
  variant,
  title,
  children,
  orderId,
  primaryLabel = "View order",
}: {
  variant: keyof typeof variants;
  title: string;
  children: ReactNode;
  orderId?: string;
  primaryLabel?: string;
}) {
  const { Icon, className } = variants[variant];

  return (
    <section
      aria-labelledby="checkout-result-title"
      className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-[#edf0f3] bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:px-10"
    >
      <span
        className={cn(
          "flex size-16 items-center justify-center rounded-full",
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-8" strokeWidth={1.75} />
      </span>
      <h1
        id="checkout-result-title"
        className="mt-5 text-2xl font-bold tracking-tight text-[#111827]"
      >
        {title}
      </h1>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#6B7280]">
        {children}
      </div>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={orderHref(orderId)}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#995618] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7a4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
        >
          {orderId ? primaryLabel : "View my orders"}
        </Link>
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e1e5eb] bg-white px-5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

export function CheckoutResultSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="mx-auto h-80 max-w-lg animate-pulse rounded-2xl bg-[#f1f0ed]"
    />
  );
}
