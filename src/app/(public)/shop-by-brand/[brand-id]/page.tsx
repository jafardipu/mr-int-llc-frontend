import { Suspense } from "react";
import { notFound } from "next/navigation";
import Container from "@/components/container/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { getBrandById } from "@/services/brands.service";
import BrandProductContainer from "./_components/BrandProductContainer";

type BrandShopPageProps = {
  params: Promise<{ "brand-id": string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function BrandShopSkeleton() {
  return (
    <Container className="page-padding">
      <Skeleton className="mb-5 h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <Skeleton className="hidden min-h-96 rounded-xl lg:block" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-[0.8/1] rounded-md" />
          ))}
        </div>
      </div>
    </Container>
  );
}

export default function BrandShopDetailsPages({
  params,
  searchParams,
}: BrandShopPageProps) {
  return (
    <Suspense fallback={<BrandShopSkeleton />}>
      <BrandShopDetailsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function BrandShopDetailsContent({
  params,
  searchParams,
}: BrandShopPageProps) {
  const brandParams = await params;
  let brandId = brandParams["brand-id"];
  try {
    brandId = decodeURIComponent(brandId);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }

  try {
    const brand = await getBrandById(brandId);
    if (!brand) notFound();

    return (
      <Container className="page-padding">
        <h4 className="mb-5 text-2xl font-semibold">
          Shop by Brand | {brand.name}
        </h4>
        <BrandProductContainer brandId={brand.id} searchParams={searchParams} />
      </Container>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load this brand.";

    return (
      <Container className="page-padding">
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      </Container>
    );
  }
}
