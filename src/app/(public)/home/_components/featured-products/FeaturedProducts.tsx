import { Package } from "lucide-react";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import ProductCard from "@/components/shared/cards/product/ProductCard";
import SectionTitle from "@/components/shared/section/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { mapCatalogProduct } from "@/lib/catalog-api";
import { ApiRequestError } from "@/services/api-service";
import { getFeaturedProducts } from "@/services/products.service";

export function FeaturedProductsSkeleton() {
  return (
    <Container aria-busy="true" aria-label="Loading featured products">
      <Skeleton className="h-8 w-56" />
      <div className="mt-7 grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:mt-10 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-[0.85/1] w-full rounded-md" />
        ))}
      </div>
    </Container>
  );
}

export default async function FeaturedProducts() {
  try {
    const result = await getFeaturedProducts({ limit: 8 });
    const products = result.data.map((product) => {
      const mapped = mapCatalogProduct(product);
      return {
        ...mapped,
        href: `/products/${product.id}`,
        price: product.displayPrice ?? mapped.price,
      };
    });

    const isFallback = result.source === "fallback";

    return (
      <Container>
        <SectionTitle
          title="Featured Products"
          subTitle={isFallback ? "Popular picks" : undefined}
          btnHref="/products"
        />
        <section aria-label="Featured products" className="mt-7 lg:mt-10">
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              message="No featured products yet."
              className="min-h-64 rounded-2xl border border-[#e3e7ec] bg-white"
            />
          ) : (
            <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </section>
      </Container>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load featured products.";

    return (
      <Container>
        <SectionTitle title="Featured Products" btnHref="/products" />
        <EmptyState
          icon={Package}
          message={message}
          className="mt-7 min-h-64 rounded-2xl border border-[#e3e7ec] bg-white lg:mt-10"
        />
      </Container>
    );
  }
}
