"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, ClipboardList, FileText, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyPrepServices } from "@/hooks/usePrepService";
import { readApiError } from "@/lib/apiClient";
import { formatPrepDate, prepRequestRef } from "@/lib/prep-service";
import type { PrepServiceRequest, PrepServiceStatus } from "@/types/prepService";
import SessionExpired from "../../_components/SessionExpired";
import PrepRequestStatusBadge from "./PrepRequestStatusBadge";

type StatusFilter = "all" | PrepServiceStatus;

const filters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Under review", value: "under_review" },
  { label: "Needs correction", value: "correction_required" },
  { label: "Approved", value: "completed" },
];

const PAGE_SIZE = 10;

function requestHref(id: string) {
  return `/user/pl-services/${encodeURIComponent(id)}`;
}

function fileCount(request: PrepServiceRequest) {
  const count = request.attachments.length;
  return `${count} ${count === 1 ? "file" : "files"}`;
}

function ActionNeeded() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-xs font-semibold text-[#c2410c]">
      <AlertCircle size={12} aria-hidden="true" />
      Action needed
    </span>
  );
}

const newRequestClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary-color px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]";

export default function PrepRequestsList() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } =
    useMyPrepServices({
      page,
      limit: PAGE_SIZE,
      status: activeFilter === "all" ? undefined : activeFilter,
    });

  const requests = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const apiError = isError ? readApiError(error, "Failed to load your prep requests.") : null;

  if (apiError?.statusCode === 401) {
    return <SessionExpired callbackUrl="/user/pl-services" />;
  }

  return (
    <section className="space-y-5" aria-label="Prep requests">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Filter by status"
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActiveFilter(filter.value);
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium shadow-xs transition-colors sm:px-5 sm:text-sm",
                  isActive
                    ? "border-[#995618] bg-[#995618] text-white"
                    : "border-[#e1e5eb] bg-white text-[#4b5563] hover:border-[#c7cdd5]",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <Link href="/3pl-prep-service/prep-request" className={cn(newRequestClass, "shrink-0")}>
          <Plus size={16} aria-hidden="true" />
          New request
        </Link>
      </div>

      {isPending ? (
        <div aria-busy="true" aria-label="Loading prep requests" className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : apiError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">Failed to load your prep requests</p>
          <p className="mt-1 text-xs text-red-600">{apiError.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-white px-5 py-14 text-center">
          <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <ClipboardList aria-hidden="true" className="size-7 text-[#9CA3AF]" strokeWidth={1.5} />
          </span>
          <p className="text-base font-semibold text-[#1f2937]">No prep requests found</p>
          <p className="mt-1 text-sm text-[#718096]">
            {page > 1
              ? "There's nothing on this page."
              : activeFilter === "all"
                ? "You haven't submitted any prep requests yet."
                : "No requests have this status."}
          </p>
          {page > 1 ? (
            <button
              type="button"
              onClick={() => setPage(1)}
              className="mt-4 cursor-pointer rounded-full border border-[#e1e5eb] bg-white px-4 py-1.5 text-xs font-semibold text-[#374151] hover:bg-gray-50"
            >
              Back to first page
            </button>
          ) : activeFilter === "all" && (
            <Link href="/3pl-prep-service/prep-request" className={cn(newRequestClass, "mt-4")}>
              <Plus size={16} aria-hidden="true" />
              New request
            </Link>
          )}
        </div>
      ) : (
        <div
          className={cn("space-y-4 transition-opacity", isPlaceholderData && isFetching && "opacity-60")}
          aria-busy={isFetching}
        >
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-[#edf0f3] bg-white shadow-xs md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#fafbfc] text-xs font-semibold uppercase tracking-wide text-[#718096]">
                <tr>
                  <th scope="col" className="px-6 py-4">Request</th>
                  <th scope="col" className="px-5 py-4">Submitted</th>
                  <th scope="col" className="px-5 py-4">Files</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const needsAction = request.status === "correction_required";
                  return (
                    <tr
                      key={request.id}
                      className={cn(
                        "border-t border-[#edf0f3] text-sm transition-colors",
                        needsAction ? "bg-[#fffaf5] hover:bg-[#fff4e8]" : "hover:bg-[#fcfbf9]",
                      )}
                    >
                      <td
                        className={cn(
                          "whitespace-nowrap border-l-4 px-6 py-4 font-mono font-medium text-[#374151]",
                          needsAction ? "border-l-[#f97316]" : "border-l-transparent",
                        )}
                      >
                        {prepRequestRef(request.id)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#4b5563]">
                        {formatPrepDate(request.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#4b5563]">
                        <span className="inline-flex items-center gap-1.5">
                          <FileText size={14} aria-hidden="true" className="text-[#a45a1a]" />
                          {fileCount(request)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <PrepRequestStatusBadge status={request.status} />
                          {needsAction && <ActionNeeded />}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <Link
                          href={requestHref(request.id)}
                          aria-label={`${needsAction ? "Resubmit files for" : "View"} request ${prepRequestRef(request.id)}`}
                          className={cn(
                            "inline-flex min-h-9 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]",
                            needsAction
                              ? "border-[#995618] bg-[#995618] text-white hover:bg-[#7a4513]"
                              : "border-[#e1e5eb] text-[#4b5563] hover:border-[#995618] hover:text-[#995618]",
                          )}
                        >
                          {needsAction ? "Resubmit files" : "View details"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {requests.map((request) => {
              const needsAction = request.status === "correction_required";
              return (
                <li key={request.id}>
                  <Link
                    href={requestHref(request.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-white p-4 shadow-xs transition-colors",
                      needsAction
                        ? "border-[#fdba74] border-l-4 border-l-[#f97316] bg-[#fffaf5]"
                        : "border-[#edf0f3] hover:bg-[#fcfbf9]",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#64748b]">
                          {prepRequestRef(request.id)}
                        </span>
                        <PrepRequestStatusBadge status={request.status} />
                        {needsAction && <ActionNeeded />}
                      </div>
                      <p className="text-xs text-[#6b7280]">
                        Submitted {formatPrepDate(request.createdAt)} · {fileCount(request)}
                      </p>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[#9ca3af]" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {meta && totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-[#edf0f3] pt-4"
            >
              <span className="text-xs text-[#6b7280]">
                Page {page} of {totalPages} · {meta.total} requests
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="cursor-pointer rounded-lg border border-[#e1e5eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="cursor-pointer rounded-lg border border-[#e1e5eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
