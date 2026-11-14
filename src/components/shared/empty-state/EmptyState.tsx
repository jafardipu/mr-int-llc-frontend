import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export default function EmptyState({
  icon: Icon,
  message,
  className,
}: {
  icon: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Icon
          aria-hidden="true"
          className="size-7 text-[#9CA3AF]"
          strokeWidth={1.5}
        />
      </span>
      <p className="text-sm text-[#6B7280]">{message}</p>
    </div>
  );
}
