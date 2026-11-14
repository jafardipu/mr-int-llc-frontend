import { Store } from "lucide-react";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import SectionTitle from "@/components/shared/section/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { getBrands } from "@/services/brands.service";
import BrandCarousel from "./BrandCarousel";

export function BrandsSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading brands" className="py-6 sm:py-8">
      <Container>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
        <div className="mt-7 flex gap-3 sm:gap-5 lg:mt-10">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-18 w-42 shrink-0 rounded-2xl sm:h-22.5 sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-100px)/6)]"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default async function Brands() {
  try {
    const result = await getBrands({ limit: 20, sort: "name" });

    return (
      <section aria-label="Featured brands" className="py-6 sm:py-8">
        <Container>
          <SectionTitle
            title="Shop by Brand"
            subTitle="We work with trusted global brands to bring you the best products."
            btnHref="/shop-by-brand"
          />
          {result.data.length === 0 ? (
            <EmptyState icon={Store} message="No brands yet." />
          ) : (
            <BrandCarousel
              brands={result.data.map(({ id, name, image }) => ({
                id,
                name,
                image,
              }))}
            />
          )}
        </Container>
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load brands.";

    return (
      <section className="py-6 sm:py-8">
        <Container>
          <SectionTitle
            title="Shop by Brand"
            subTitle="We work with trusted global brands to bring you the best products."
            btn={false}
          />
          <p role="alert" className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        </Container>
      </section>
    );
  }
}
