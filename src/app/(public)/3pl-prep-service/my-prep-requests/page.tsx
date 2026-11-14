"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, Clock, FileText, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPrepServices } from "@/hooks/usePrepService";
import PrepRequestStatusBadge from "@/app/(protected)/user/pl-services/_components/PrepRequestStatusBadge";

export default function MyPrepRequestPage() {
  const { data, isLoading, isError } = useMyPrepServices({ limit: 10 });
  const requests = data?.data || [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href="/3pl-prep-service"
        className="inline-flex items-center gap-1.5 text-sm text-[#4B5563] transition-colors hover:text-[#263449] group"
      >
        <ArrowLeft
          size={14}
          aria-hidden="true"
          className="group-hover:-translate-x-0.5 duration-300 transition-all"
        />
        Back to 3PL Prep Services
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0F172A]">
            My Preparation Requests
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Track and monitor the status of your submitted 3PL prep requests.
          </p>
        </div>
        <Link
          href="/3pl-prep-service/prep-request"
          className="inline-flex items-center gap-2 rounded-full bg-secondary-color px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7d391b] transition shadow-xs"
        >
          <Plus size={15} />
          Submit New Request
        </Link>
      </header>

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading preparation requests"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-800">
            Failed to load requests
          </p>
          <p className="mt-1 text-xs text-red-600">
            Please make sure you are signed in and try again.
          </p>
          <Link
            href="/login?callbackUrl=/3pl-prep-service/my-prep-requests"
            className="mt-4 inline-flex items-center rounded-full bg-secondary-color px-5 py-2 text-xs font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      ) : requests.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col justify-between rounded-2xl border border-[#dfe6ef] bg-white p-5 shadow-xs hover:border-[#995618]/40 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#64748b]">
                    #{request.id.slice(-8).toUpperCase()}
                  </span>
                  <PrepRequestStatusBadge status={request.status} />
                </div>
                <h3 className="mt-3 text-base font-bold text-[#111827]">
                  {request.serviceType}
                </h3>
                {request.notes && (
                  <p className="mt-1 text-xs text-[#64748b] line-clamp-2">
                    {request.notes}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-[#94a3b8]">
                  <Clock size={13} />
                  <span>
                    {new Date(request.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
                <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <FileText size={14} className="text-[#a45a1a]" />
                  {request.attachments?.length || 0} attachment(s)
                </span>
                <Link
                  href={`/user/pl-services/${request.id}`}
                  className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#334155] hover:bg-gray-50 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dfe6ef] bg-white py-16 text-center">
          <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <ClipboardList
              aria-hidden="true"
              className="size-7 text-[#9CA3AF]"
              strokeWidth={1.5}
            />
          </span>
          <p className="text-base font-semibold text-[#1e293b]">
            No preparation requests yet
          </p>
          <p className="mt-1 text-sm text-[#64748b]">
            Submit your first 3PL prep request to track it here.
          </p>
          <Link
            href="/3pl-prep-service/prep-request"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary-color px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7d391b] transition"
          >
            <Plus size={14} />
            Submit Request
          </Link>
        </div>
      )}
    </main>
  );
}
