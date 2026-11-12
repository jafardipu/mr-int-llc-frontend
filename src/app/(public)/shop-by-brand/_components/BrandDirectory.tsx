import Link from "next/link";
import { Suspense } from "react";
import PaginationSection from "@/components/shared/pagination/PaginationSection";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { getBrands } from "@/services/brands.service";
import BrandLogo from "./BrandLogo";
import BrandSearch from "./BrandSearch";

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

export function BrandDirectorySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading brands"
      className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-16.5 rounded-xl" />
      ))}
    </div>
  );
}

export default async function BrandDirectory({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const page = pageNumber(params.page);
  const sort = param(params.sort);
  const searchTerm = param(params.searchTerm);

  try {
    const result = await getBrands({
      page,
      limit: pageSize,
      searchTerm,
      sort: sort && sorts.has(sort) ? sort : "name",
    });

    return (
      <>
        <Suspense fallback={<div className="mt-8 h-10" />}>
          <BrandSearch resultCount={result.meta.total} />
        </Suspense>
        {result.data.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[#D6D3CD] px-5 py-12 text-center text-sm text-[#77766F]">
            {searchTerm ? "No brands match your search." : "No brands yet."}
          </p>
        ) : (
          <ul
            aria-label="Our brands"
            className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
          >
            {result.data.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/shop-by-brand/${brand.id}`}
                  className="flex h-16.5 items-center justify-center rounded-xl border border-[#E8E5E2] bg-white px-3 transition-colors hover:border-[#D4CEC8]"
                >
                  <BrandLogo name={brand.name} image={brand.image} />
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
        : "Unable to load brands.";

    return (
      <p role="alert" className="mt-8 rounded-md bg-red-50 p-3 text-sm text-red-700">
        {message}
      </p>
    );
  }
}
