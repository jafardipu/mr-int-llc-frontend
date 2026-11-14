import { Check, Clock, AlertCircle } from "lucide-react";
import type { PrepServiceStatus } from "@/types/prepService";

export default function PrepRequestTimeline({
  status,
  createdAt,
  updatedAt,
}: {
  status: PrepServiceStatus | string;
  createdAt?: string;
  updatedAt?: string;
}) {
  const isCompleted = status === "completed" || status === "Completed";
  const isCorrection =
    status === "correction_required" || status === "Correction Required";
  const isUnderReview = status === "under_review" || status === "Under Review";

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Pending action";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const steps = [
    {
      title: "Request Submitted",
      date: formatDate(createdAt),
      description: "Service request and files submitted successfully.",
      isDone: true,
      isCurrent: false,
    },
    {
      title: isCorrection ? "Correction Required" : "Under Admin Review",
      date: isCorrection || isUnderReview || isCompleted ? formatDate(updatedAt || createdAt) : "Pending",
      description: isCorrection
        ? "Action needed: Please review admin notes and update."
        : "The admin team is reviewing your files and requirements.",
      isDone: isCompleted,
      isCurrent: isUnderReview || isCorrection,
      isWarning: isCorrection,
    },
    {
      title: "Completed",
      date: isCompleted ? formatDate(updatedAt) : "Pending",
      description: isCompleted
        ? "Prep service completed and ready."
        : "Final completion following approval.",
      isDone: isCompleted,
      isCurrent: false,
    },
  ];

  return (
    <section
      aria-labelledby="request-timeline-title"
      className="rounded-xl border border-[#dfe6ef] bg-white px-4 py-5 shadow-xs sm:px-6"
    >
      <h2
        id="request-timeline-title"
        className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]"
      >
        REQUEST STATUS TIMELINE
      </h2>

      <div className="relative mt-6">
        {/* Horizontal Line for Desktop */}
        <div
          aria-hidden="true"
          className="absolute left-6 right-6 top-4 hidden h-0.5 bg-[#e2e8f0] sm:block"
        />
        <div
          aria-hidden="true"
          className={`absolute left-6 top-4 hidden h-0.5 sm:block transition-all ${
            isCompleted
              ? "w-[calc(100%-3rem)] bg-[#22c55e]"
              : isCorrection
                ? "w-[calc(50%-1.5rem)] bg-red-500"
                : "w-[calc(50%-1.5rem)] bg-[#995618]"
          }`}
        />

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors z-10 ${
                  step.isDone
                    ? "border-[#22c55e] bg-[#22c55e] text-white"
                    : step.isWarning
                      ? "border-red-500 bg-red-500 text-white"
                      : step.isCurrent
                        ? "border-[#995618] bg-[#995618] text-white"
                        : "border-[#cbd5e1] bg-white text-[#94a3b8]"
                }`}
              >
                {step.isDone ? (
                  <Check className="size-4" />
                ) : step.isWarning ? (
                  <AlertCircle className="size-4" />
                ) : step.isCurrent ? (
                  <Clock className="size-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <div className="min-w-0 sm:mt-2">
                <p className="text-sm font-semibold text-[#1e293b]">
                  {step.title}
                </p>
                <p className="text-xs text-[#64748b]">{step.date}</p>
                <p className="mt-1 text-xs text-[#94a3b8] hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
