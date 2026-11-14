import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { mapCatalogProduct } from "@/lib/catalog-api";
import { ApiRequestError } from "@/services/api-service";
import { getCategoryById } from "@/services/categories.service";
import ProductGrid from "@/app/(public)/products/_components/ProductGrid";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

function CategoryDetailSkeleton() {
  return (
    <Container className="page-padding">
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-6 h-5 w-32" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="aspect-[0.8/1] rounded-md" />
        ))}
      </div>
    </Container>
  );
}

export default function CategoryDetailPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryDetailSkeleton />}>
      <CategoryDetailContent params={params} />
    </Suspense>
  );
}

async function CategoryDetailContent({ params }: CategoryPageProps) {
  let { id } = await params;
  try {
    id = decodeURIComponent(id);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }

  try {
    const category = await getCategoryById(id);
    if (!category || category.status !== "active") notFound();

    const products = category.products.map((product) => ({
      ...mapCatalogProduct(product),
      category: product.category?.name ?? category.name,
    }));

    return (
      <Container className="page-padding">
        <h1 className="text-2xl font-semibold text-[#34332F]">{category.name}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {category._count.products}{" "}
          {category._count.products === 1 ? "product" : "products"}
        </p>
        <div className="mt-6">
          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              message="No products in this category."
            />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
        {category._count.products > products.length && (
          <Link
            href={`/products?categoryId=${category.id}`}
            className="mt-6 inline-flex text-sm font-semibold text-secondary-color"
          >
            View all {category._count.products} products
          </Link>
        )}
      </Container>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load this category.";

    return (
      <Container className="page-padding">
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      </Container>
    );
  }
}
