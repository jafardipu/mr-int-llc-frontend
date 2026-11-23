"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrepServiceDetail } from "@/hooks/usePrepService";
import { readApiError } from "@/lib/apiClient";
import SessionExpired from "../../_components/SessionExpired";
import PrepRequestDetails from "./PrepRequestDetails";

function errorCopy(statusCode: number | undefined, message: string) {
  if (statusCode === 403) {
    return { title: "You can't view this request", body: "It belongs to a different account.", canRetry: false };
  }
  if (statusCode === 404) {
    return { title: "Request not found", body: "It may have been removed, or the link is wrong.", canRetry: false };
  }
  return { title: "Failed to load this request", body: message, canRetry: true };
}

export default function PrepRequestDetailView({ requestId }: { requestId: string }) {
  const { data: request, isPending, isError, error, refetch, isRefetching } =
    usePrepServiceDetail(requestId);

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading prep request" className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const { statusCode, message } = readApiError(error, "Please try again.");
    if (statusCode === 401) {
      return <SessionExpired callbackUrl={`/user/pl-services/${encodeURIComponent(requestId)}`} />;
    }
    const copy = errorCopy(statusCode, message);

    return (
      <div className="space-y-4">
        <Link
          href="/user/pl-services"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to prep requests
        </Link>
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">{copy.title}</p>
          <p className="mt-1 text-xs text-red-600">{copy.body}</p>
          {copy.canRetry && (
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isRefetching ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return <PrepRequestDetails request={request} onRefresh={() => void refetch()} />;
}
