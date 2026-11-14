"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Upload } from "lucide-react";
import type { PrepServiceRequest } from "@/types/prepService";
import type { PrepRequest } from "../_data/prep-requests";
import PrepRequestFileCard from "./PrepRequestFileCard";
import PrepRequestHeader from "./PrepRequestHeader";
import PrepRequestTimeline from "./PrepRequestTimeline";

type RequestType = PrepServiceRequest | PrepRequest;

export default function PrepRequestDetails({
  request,
}: {
  request: RequestType;
}) {
  const isComplete =
    request.status === "completed" || request.status === "Completed";
  const isCorrection =
    request.status === "correction_required" ||
    request.status === "Correction Required";

  const createdAt = "createdAt" in request ? request.createdAt : undefined;
  const updatedAt = "updatedAt" in request ? request.updatedAt : undefined;

  return (
    <main className="w-full space-y-6">
      <PrepRequestHeader request={request} />

      {/* Status Notice Banner */}
      <div
        role="status"
        className={`flex items-start justify-between gap-3 rounded-xl border p-4 sm:p-5 shadow-xs ${
          isComplete
            ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]"
            : isCorrection
              ? "border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]"
              : "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
        }`}
      >
        <div className="flex gap-3">
          {isComplete ? (
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-[#059669]"
              aria-hidden="true"
            />
          ) : isCorrection ? (
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-[#dc2626]"
              aria-hidden="true"
            />
          ) : (
            <Clock
              className="mt-0.5 size-5 shrink-0 text-[#2563eb]"
              aria-hidden="true"
            />
          )}
          <div>
            <p className="text-sm font-bold">
              {isComplete
                ? "Request Completed"
                : isCorrection
                  ? "Correction Required"
                  : "Under Admin Review"}
            </p>
            <p className="mt-1 text-sm leading-5">
              {isComplete
                ? "Your preparation request has been completed successfully."
                : isCorrection
                  ? "The admin team has requested corrections for your submission. Please check the notes and submit updated files."
                  : "The admin team is currently reviewing your preparation request and attachments."}
            </p>
          </div>
        </div>

        {isCorrection && (
          <Link
            href={`/user/pl-services/${request.id}/correction`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition"
          >
            <Upload size={14} />
            Submit Correction
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <PrepRequestFileCard request={request} />
        <PrepRequestTimeline
          status={request.status}
          createdAt={createdAt}
          updatedAt={updatedAt}
        />
      </div>
    </main>
  );
}
