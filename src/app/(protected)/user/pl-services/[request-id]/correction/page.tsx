import CorrectionUploadView from "../../_components/CorrectionUploadView";

export default async function CorrectionRequestPage({
  params,
}: {
  params: Promise<{ "request-id": string }>;
}) {
  const { "request-id": requestId } = await params;
  return <CorrectionUploadView requestId={requestId} />;
}
