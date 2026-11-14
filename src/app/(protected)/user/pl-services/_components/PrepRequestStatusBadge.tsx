import type { PrepServiceStatus } from "@/types/prepService";

type ExtendedStatus = PrepServiceStatus | "submitted" | "Submitted" | "Under Review" | "Completed" | "Correction Required";

const statusFormatMap: Record<string, { label: string; style: string }> = {
  under_review: {
    label: "Under Review",
    style: "bg-[#fff3c4] text-[#c47a00] border border-[#fde68a]",
  },
  "Under Review": {
    label: "Under Review",
    style: "bg-[#fff3c4] text-[#c47a00] border border-[#fde68a]",
  },
  correction_required: {
    label: "Correction Required",
    style: "bg-[#fee2e2] text-[#ef4444] border border-[#fca5a5]",
  },
  "Correction Required": {
    label: "Correction Required",
    style: "bg-[#fee2e2] text-[#ef4444] border border-[#fca5a5]",
  },
  completed: {
    label: "Completed",
    style: "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]",
  },
  Completed: {
    label: "Completed",
    style: "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]",
  },
  submitted: {
    label: "Submitted",
    style: "bg-[#e0f2ff] text-[#0284c7] border border-[#bae6fd]",
  },
  Submitted: {
    label: "Submitted",
    style: "bg-[#e0f2ff] text-[#0284c7] border border-[#bae6fd]",
  },
};

export default function PrepRequestStatusBadge({
  status,
}: {
  status: ExtendedStatus | string;
}) {
  const config = statusFormatMap[status] ?? {
    label: status.replace(/_/g, " "),
    style: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span
      className={`inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${config.style}`}
    >
      {config.label}
    </span>
  );
}
