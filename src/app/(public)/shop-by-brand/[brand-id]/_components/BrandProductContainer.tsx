import { Suspense } from "react";
import ProductFilterSidebar from "@/app/(public)/products/_components/ProductFilterSidebar";
import ProductGrid from "@/app/(public)/products/_components/ProductGrid";
import ProductResultsHeader from "@/app/(public)/products/_components/ProductResultsHeader";
import PaginationSection from "@/components/shared/pagination/PaginationSection";
import { getCatalogFilters, getCatalogProducts } from "@/lib/catalog-api";

type SearchParams = Record<string, string | string[] | undefined>;

const productsPerPage = 9;
const sortableFields = new Set([
  "retailPrice",
  "-retailPrice",
  "-avgRating",
  "-createdAt",
]);

function getParamValue(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue?.trim() || undefined;
}

function getPositiveInteger(value: string | string[] | undefined) {
  const parsed = Number(getParamValue(value));
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getPriceParam(value: string | string[] | undefined) {
  const rawValue = getParamValue(value);
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function BrandProductContainer({
  brandId,
  searchParams,
}: {
  brandId: string;
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = getPositiveInteger(params.page);
  const minPrice = getPriceParam(params.minPrice);
  const maxPrice = getPriceParam(params.maxPrice);
  const sort = getParamValue(params.sort);
  const invalidPrice =
    minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;
  const [filters, products] = await Promise.all([
    getCatalogFilters(),
    invalidPrice
      ? Promise.resolve({
          data: [],
          meta: { page: 1, limit: productsPerPage, total: 0 },
        })
      : getCatalogProducts({
          page,
          limit: productsPerPage,
          brandId,
          categoryId: getParamValue(params.categoryId),
          minPrice,
          maxPrice,
          searchTerm: getParamValue(params.searchTerm),
          deal: getParamValue(params.deal) === "true",
          sort: sort && sortableFields.has(sort) ? sort : undefined,
        }),
  ]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
      <Suspense
        fallback={
          <>
            <div className="mb-4 h-10 w-28 animate-pulse rounded-md bg-[#F1F0ED] lg:hidden" />
            <aside
              aria-busy="true"
              aria-label="Loading product filters"
              className="hidden min-h-96 rounded-xl border border-[#E9E6DF] bg-white p-5 lg:block"
            />
          </>
        }
      >
        <ProductFilterSidebar
          page="brand"
          categories={filters.categories}
          showCatalogTags={false}
          mobileSheet
        />
      </Suspense>

      <section aria-label="Product results" className="min-w-0">
        <Suspense
          fallback={<div className="mb-5 h-10 animate-pulse rounded bg-[#F1F0ED]" />}
        >
          <ProductResultsHeader resultCount={products.meta.total} />
        </Suspense>
        <ProductGrid products={products.data} />
        <PaginationSection
          total={products.meta.total}
          current={products.meta.page}
          pageSize={products.meta.limit}
        />
      </section>
    </div>
  );
}
