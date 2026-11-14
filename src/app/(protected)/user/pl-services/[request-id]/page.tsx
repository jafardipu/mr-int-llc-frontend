import PrepRequestDetailView from "../_components/PrepRequestDetailView";

export default async function PrepRequestDetailsPage({
  params,
}: {
  params: Promise<{ "request-id": string }>;
}) {
  const { "request-id": requestId } = await params;
  return <PrepRequestDetailView requestId={requestId} />;
}
