"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

const searchDebounceMs = 400;

interface ProductResultsHeaderProps {
  resultCount: number;
}

export default function ProductResultsHeader({
  resultCount,
}: ProductResultsHeaderProps) {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const updateSearchParamsRef = useRef(updateSearchParams);
  const searchTimerRef = useRef<number | undefined>(undefined);
  const requestedSort = searchParams.get("sort");
  const searchTerm = searchParams.get("searchTerm") ?? "";
  const [searchValue, setSearchValue] = useState(searchTerm);
  const pushedSearchRef = useRef(searchTerm);

  useEffect(() => {
    updateSearchParamsRef.current = updateSearchParams;
  }, [updateSearchParams]);

  useEffect(() => {
    if (searchTerm === pushedSearchRef.current) return;
    pushedSearchRef.current = searchTerm;
    setSearchValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => window.clearTimeout(searchTimerRef.current);
  }, []);

  const applySearch = (value: string) => {
    const nextSearch = value.trim();
    if (nextSearch === searchTerm) return;

    pushedSearchRef.current = nextSearch;
    updateSearchParamsRef.current({
      searchTerm: nextSearch || null,
      page: "1",
    });
  };

  const scheduleSearch = (value: string) => {
    window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      applySearch(value);
    }, searchDebounceMs);
  };
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

      <form
        className="flex min-w-48 flex-1 gap-2 sm:max-w-sm"
        onSubmit={(event) => {
          event.preventDefault();
          window.clearTimeout(searchTimerRef.current);
          applySearch(searchValue);
        }}
      >
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          name="searchTerm"
          type="search"
          value={searchValue}
          placeholder="Search products"
          onChange={(event) => {
            const nextValue = event.target.value;
            setSearchValue(nextValue);
            scheduleSearch(nextValue);
          }}
          className="w-full rounded-md border border-[#E9E6DF] bg-white px-3 py-2 text-sm text-[#34332F] outline-none focus:border-secondary-color bg-gray-200"
        />
        {/* <button
          type="submit"
          className="shrink-0 rounded-md bg-secondary-color px-3 py-2 text-sm font-medium text-white"
        >
          Search
        </button> */}
      </form>

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
          className="cursor-pointer rounded-md border border-[#E9E6DF] bg-white px-2.5 py-2 text-sm font-medium text-[#34332F] outline-none focus:border-secondary-color bg-gray-200"
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
