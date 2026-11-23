import { cn } from "@/lib/utils";
import { PREP_STATUS_LABELS } from "@/lib/prep-service";
import type { PrepServiceStatus } from "@/types/prepService";

const styles: Record<PrepServiceStatus, string> = {
  under_review: "border-[#fde68a] bg-[#fff3c4] text-[#a16207]",
  correction_required: "border-[#fca5a5] bg-[#fee2e2] text-[#dc2626]",
  completed: "border-[#bbf7d0] bg-[#dcfce7] text-[#16a34a]",
};

export default function PrepRequestStatusBadge({
  status,
  className,
}: {
  status: PrepServiceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      {PREP_STATUS_LABELS[status]}
    </span>
  );
}
