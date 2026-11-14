import Link from "next/link";
import { Suspense } from "react";
import { LayoutGrid, Search } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import PaginationSection from "@/components/shared/pagination/PaginationSection";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { getCategories } from "@/services/categories.service";
import CategoryImage from "./CategoryImage";
import CategorySearch from "./CategorySearch";

const pageSize = 12;
const sorts = new Set(["name", "-name", "createdAt", "-createdAt"]);

type SearchParams = Record<string, string | string[] | undefined>;

function param(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || undefined;
}

function pageNumber(value: string | string[] | undefined) {
  const parsed = Number(param(value));
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function CategoryDirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading categories" className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-[0.57/1] rounded-none" />
        ))}
      </div>
    </div>
  );
}

export default async function CategoryDirectory({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const page = pageNumber(params.page);
  const sort = param(params.sort);
  const searchTerm = param(params.searchTerm);

  try {
    const result = await getCategories({
      page,
      limit: pageSize,
      searchTerm,
      sort: sort && sorts.has(sort) ? sort : "name",
    });
    const categories = result.data.filter(
      (category) => category.status === "active",
    );

    return (
      <>
        <Suspense
          fallback={
            <div className="mt-8 flex items-center justify-between gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-10 w-64" />
            </div>
          }
        >
          <CategorySearch resultCount={result.meta.total} />
        </Suspense>
        {categories.length === 0 ? (
          <EmptyState
            icon={searchTerm ? Search : LayoutGrid}
            message={
              searchTerm
                ? "No categories match your search."
                : "No categories yet."
            }
          />
        ) : (
          <ul
            aria-label="Product categories"
            className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          >
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.id}`}
                  aria-label={`Explore ${category.name} products`}
                  className="relative block aspect-[0.57/1] overflow-hidden bg-slate-200"
                >
                  <CategoryImage image={category.image} />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
                  />
                  <span className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-1 text-white">
                    <span className="truncate text-sm font-semibold sm:text-base">
                      {category.name}
                    </span>
                    <span className="text-[9px] text-white/75 sm:text-xs">
                      {category._count.products}{" "}
                      {category._count.products === 1 ? "product" : "products"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {result.meta.total > result.meta.limit && (
          <PaginationSection
            total={result.meta.total}
            current={result.meta.page}
            pageSize={result.meta.limit}
          />
        )}
      </>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load categories.";

    return (
      <p role="alert" className="mt-8 rounded-md bg-red-50 p-3 text-sm text-red-700">
        {message}
      </p>
    );
  }
}
