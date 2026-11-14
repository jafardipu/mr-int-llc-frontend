"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { usePrepServiceDetail } from "@/hooks/usePrepService";
import PrepRequestDetails from "./PrepRequestDetails";

export default function PrepRequestDetailView({
  requestId,
}: {
  requestId: string;
}) {
  const {
    data: request,
    isLoading,
    isError,
    error,
    refetch,
  } = usePrepServiceDetail(requestId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#edf0f3] bg-white py-20 text-center shadow-xs">
        <Loader2 className="size-8 animate-spin text-secondary-color" />
        <p className="mt-3 text-sm font-medium text-[#718096]">
          Loading request details...
        </p>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="space-y-4">
        <Link
          href="/user/pl-services"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
        >
          <ArrowLeft size={15} />
          Back to requests
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-800">
            Request not found or failed to load
          </p>
          <p className="mt-1 text-xs text-red-600">
            {(error as any)?.message ||
              "Could not retrieve details for this preparation request."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <PrepRequestDetails request={request} />;
}

