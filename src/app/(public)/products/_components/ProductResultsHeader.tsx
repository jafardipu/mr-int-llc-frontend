"use client";

import { useSearchParams } from "next/navigation";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

interface ProductResultsHeaderProps {
  resultCount: number;
}

export default function ProductResultsHeader({
  resultCount,
}: ProductResultsHeaderProps) {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const requestedSort = searchParams.get("sort");
  const sortBy =
    requestedSort &&
    ["retailPrice", "-retailPrice", "-avgRating", "-createdAt"].includes(
      requestedSort,
    )
      ? requestedSort
      : "featured";

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className=" font-semibold text-[#34332F] sm:text-lg">
        Found {resultCount} {resultCount === 1 ? "result" : "results"}
      </p>

      <label className="flex items-center gap-2 text-sm text-[#77766F]">
        <span>Sort by</span>
        <select
          value={sortBy}
          onChange={(event) =>
            updateSearchParams({
              sort: event.target.value === "featured" ? null : event.target.value,
              page: "1",
            })
          }
          className="cursor-pointer rounded-md border border-[#E9E6DF] bg-white px-2.5 py-2 text-sm font-medium text-[#34332F] outline-none focus:border-secondary-color"
        >
          <option value="featured">Featured</option>
          <option value="retailPrice">Price: Low to High</option>
          <option value="-retailPrice">Price: High to Low</option>
          <option value="-avgRating">Top Rated</option>
          <option value="-createdAt">Newest</option>
        </select>
      </label>
    </div>
  );
}
