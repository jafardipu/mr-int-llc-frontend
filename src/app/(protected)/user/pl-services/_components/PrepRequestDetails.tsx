"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { formatPrepDate, prepRequestRef } from "@/lib/prep-service";
import type { PrepServiceRequest } from "@/types/prepService";
import PrepRequestAttachments from "./PrepRequestAttachments";
import PrepRequestStatusBadge from "./PrepRequestStatusBadge";
import ResubmitFilesForm from "./ResubmitFilesForm";

function StatusCallout({ request }: { request: PrepServiceRequest }) {
  if (request.status === "correction_required") {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-[#fdba74] bg-[#fff7ed] p-4 text-[#9a3412] sm:p-5">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#ea580c]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Action needed</p>
          {request.adminNote ? (
            <>
              <p className="mt-1 text-sm">The admin asked for changes:</p>
              <p className="mt-2 whitespace-pre-line rounded-lg border border-[#fed7aa] bg-white px-3.5 py-3 text-sm leading-relaxed text-[#431407]">
                {request.adminNote}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm">Please review your files and resubmit.</p>
          )}
          <p className="mt-2 text-sm">Upload the corrected files below.</p>
        </div>
      </div>
    );
  }

  if (request.status === "completed") {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-[#065f46] sm:p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#059669]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Approved</p>
          <p className="mt-1 text-sm">Your prep request has been approved.</p>
          {request.adminNote && (
            <p className="mt-2 whitespace-pre-line rounded-lg border border-[#a7f3d0] bg-white px-3.5 py-3 text-sm leading-relaxed text-[#064e3b]">
              <span className="font-semibold">Note from the admin: </span>
              {request.adminNote}
            </p>
          )}
        </div>
      </div>
    );
  }

  // under_review: any adminNote is left over from the previous review, so it's not shown.
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-[#1e40af] sm:p-5">
      <Clock className="mt-0.5 size-5 shrink-0 text-[#2563eb]" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold">Waiting for review</p>
        <p className="mt-1 text-sm">
          Our team is reviewing your files. You&apos;ll be notified when the request
          is approved or if anything needs changing.
        </p>
      </div>
    </div>
  );
}

export default function PrepRequestDetails({
  request,
  onRefresh,
}: {
  request: PrepServiceRequest;
  onRefresh: () => void;
}) {
  const needsCorrection = request.status === "correction_required";

  return (
    <div className="w-full space-y-6">
      <Link
        href="/user/pl-services"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to prep requests
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
            Prep request {prepRequestRef(request.id)}
          </h1>
          <PrepRequestStatusBadge status={request.status} />
        </div>
        <dl className="grid gap-3 rounded-xl border border-[#edf0f3] bg-white px-4 py-3.5 text-sm shadow-xs sm:grid-cols-2 sm:px-5">
          <div>
            <dt className="text-xs text-[#9ca3af]">Submitted</dt>
            <dd className="mt-0.5 font-medium text-[#374151]">
              {formatPrepDate(request.createdAt, true)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#9ca3af]">Last updated</dt>
            <dd className="mt-0.5 font-medium text-[#374151]">
              {formatPrepDate(request.updatedAt, true)}
            </dd>
          </div>
        </dl>
      </header>

      <StatusCallout request={request} />

      <PrepRequestAttachments
        attachments={request.attachments}
        title={needsCorrection ? "Current files" : "Files"}
      />

      {needsCorrection && <ResubmitFilesForm requestId={request.id} onRefresh={onRefresh} />}
    </div>
  );
}
