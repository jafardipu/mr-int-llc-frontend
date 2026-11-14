"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useMyPrepServices } from "@/hooks/usePrepService";
import type { PrepServiceStatus } from "@/types/prepService";
import PrepRequestStatusBadge from "./PrepRequestStatusBadge";

type StatusFilter = "All Orders" | PrepServiceStatus;

const filters: { label: string; value: StatusFilter }[] = [
  { label: "All Orders", value: "All Orders" },
  { label: "Under Review", value: "under_review" },
  { label: "Correction Required", value: "correction_required" },
  { label: "Completed", value: "completed" },
];

function requestHref(requestId: string, status: PrepServiceStatus | string) {
  const baseHref = `/user/pl-services/${requestId}`;
  return status === "correction_required" ? `${baseHref}/correction` : baseHref;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function getFileName(attachments: string[] | undefined, defaultType: string) {
  if (attachments && attachments.length > 0) {
    const raw = attachments[0].split("/").pop() || "file";
    if (attachments.length > 1) {
      return `${raw} (+${attachments.length - 1})`;
    }
    return raw;
  }
  return defaultType || "Prep file";
}

export default function PrepRequestsList() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All Orders");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    return {
      page,
      limit: 20,
      searchTerm: search.trim() || undefined,
      status: activeFilter === "All Orders" ? undefined : activeFilter,
    };
  }, [page, search, activeFilter]);

  const { data, isLoading, isError, error, refetch } =
    useMyPrepServices(queryParams);

  const requests = data?.data || [];
  const meta = data?.meta;

  return (
    <section className="space-y-5" aria-label="3PL preparation requests">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-[390px]">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <span className="sr-only">Search requests</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by ID, service type or notes..."
            className="h-11 w-full rounded-xl border border-[#e1e5eb] bg-white pl-10 pr-4 text-sm text-[#374151] shadow-xs outline-none placeholder:text-[#9ca3af] focus:border-[#995618] focus:ring-2 focus:ring-[#995618]/15"
          />
        </label>

        <Link
          href="/3pl-prep-service/prep-request"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary-color px-5 text-sm font-semibold text-white transition hover:bg-[#7d391b] shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          New Prep Request
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3"
        role="tablist"
        aria-label="Filter requests by status"
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveFilter(filter.value);
                setPage(1);
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium shadow-xs transition-colors sm:px-5 sm:text-sm cursor-pointer ${
                isActive
                  ? "border-[#995618] bg-[#995618] text-white"
                  : "border-[#e1e5eb] bg-white text-[#4b5563] hover:border-[#c7cdd5]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading preparation requests"
          className="space-y-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">
            Failed to load prep service requests
          </p>
          <p className="mt-1 text-xs text-red-600">
            {(error as any)?.message || "Please check your network connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : requests.length > 0 ? (
        /* Requests Table / Cards */
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#edf0f3] bg-white shadow-xs md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-[#fafbfc] text-xs font-semibold uppercase tracking-wide text-[#718096]">
                  <tr>
                    <th scope="col" className="px-6 py-4">Request ID</th>
                    <th scope="col" className="px-5 py-4">Service Type</th>
                    <th scope="col" className="px-5 py-4">Date Submitted</th>
                    <th scope="col" className="px-5 py-4">File Name</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-t border-[#edf0f3] text-sm hover:bg-[#fcfbf9] transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-[#374151]">
                        #{request.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#1f2937]">
                        {request.serviceType}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#718096]">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-[#64748b]">
                        {getFileName(request.attachments, request.serviceType)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <PrepRequestStatusBadge status={request.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-center">
                        <Link
                          href={requestHref(request.id, request.status)}
                          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#e1e5eb] px-4 text-sm font-medium text-[#4b5563] transition-colors hover:bg-[#f9fafb] hover:border-[#995618] hover:text-[#995618] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <ul className="space-y-3 md:hidden">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-[#edf0f3] bg-white p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-[#64748b]">
                      #{request.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[#1f2937]">
                      {request.serviceType}
                    </p>
                    <p className="mt-1 text-xs text-[#718096]">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <PrepRequestStatusBadge status={request.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#edf0f3] pt-3">
                  <p className="min-w-0 truncate font-mono text-xs text-[#64748b]">
                    {getFileName(request.attachments, request.serviceType)}
                  </p>
                  <Link
                    href={requestHref(request.id, request.status)}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-[#e1e5eb] px-3 text-xs font-medium text-[#4b5563] transition-colors hover:bg-[#f9fafb]"
                  >
                    View Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-between border-t border-[#edf0f3] pt-4">
              <span className="text-xs text-[#6b7280]">
                Showing {requests.length} of {meta.total} requests
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[#e1e5eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * meta.limit >= meta.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-[#e1e5eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#edf0f3] bg-white px-5 py-14 text-center">
          <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <ClipboardList
              aria-hidden="true"
              className="size-7 text-[#9CA3AF]"
              strokeWidth={1.5}
            />
          </span>
          <p className="text-base font-semibold text-[#1f2937]">
            No preparation requests found
          </p>
          <p className="mt-1 text-sm text-[#718096]">
            {search || activeFilter !== "All Orders"
              ? "Try adjusting your search query or filter."
              : "You haven't submitted any 3PL preparation requests yet."}
          </p>
          <Link
            href="/3pl-prep-service/prep-request"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-secondary-color px-5 py-2 text-xs font-semibold text-white hover:bg-[#7d391b] transition-colors"
          >
            <Plus size={14} />
            Submit Your First Request
          </Link>
        </div>
      )}
    </section>
  );
}
