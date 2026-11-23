import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PrepRequestDetailView from "../_components/PrepRequestDetailView";

type PrepRequestDetailsPageProps = {
  params: Promise<{ "request-id": string }>;
};

export default function PrepRequestDetailsPage({ params }: PrepRequestDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading prep request" className="space-y-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <PrepRequestDetailsContent params={params} />
    </Suspense>
  );
}

async function PrepRequestDetailsContent({ params }: PrepRequestDetailsPageProps) {
  let { "request-id": requestId } = await params;
  try {
    requestId = decodeURIComponent(requestId);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }
  return <PrepRequestDetailView requestId={requestId} />;
}
