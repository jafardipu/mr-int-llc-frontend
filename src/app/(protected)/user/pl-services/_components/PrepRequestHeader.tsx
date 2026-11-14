import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrepRequestStatusBadge from "./PrepRequestStatusBadge";
import type { PrepServiceRequest } from "@/types/prepService";
import type { PrepRequest } from "../_data/prep-requests";

type RequestType = PrepServiceRequest | PrepRequest;

export default function PrepRequestHeader({
  request,
}: {
  request: RequestType;
}) {
  const serviceType =
    "serviceType" in request && request.serviceType ? request.serviceType : null;

  return (
    <>
      <Link
        href="/user/pl-services"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] transition-colors hover:text-[#995618]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to requests
      </Link>
      <header className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
            {serviceType ? `${serviceType} Request` : "Preparation Request"}
          </h1>
          <p className="mt-1 break-all text-sm text-[#74839b]">
            <span className="text-[#64748B]">Request ID: </span>
            <span className="font-mono font-medium text-[#334155]">
              #{request.id}
            </span>
          </p>
        </div>
        <PrepRequestStatusBadge status={request.status} />
      </header>
    </>
  );
}
