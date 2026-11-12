"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

const searchDebounceMs = 400;
const sorts = [
  { value: "name", label: "Name" },
  { value: "-name", label: "Name: Z to A" },
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
];

export default function BrandSearch({ resultCount }: { resultCount: number }) {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const updateSearchParamsRef = useRef(updateSearchParams);
  const searchTimerRef = useRef<number | undefined>(undefined);
  const searchTerm = searchParams.get("searchTerm") ?? "";
  const [searchValue, setSearchValue] = useState(searchTerm);
  const pushedSearchRef = useRef(searchTerm);
  const sort = searchParams.get("sort") ?? "name";

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

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <p className="font-semibold text-[#34332F]">
        Found {resultCount} {resultCount === 1 ? "brand" : "brands"}
      </p>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <form
          className="min-w-48 flex-1 sm:w-64"
          onSubmit={(event) => {
            event.preventDefault();
            window.clearTimeout(searchTimerRef.current);
            applySearch(searchValue);
          }}
        >
          <label className="sr-only" htmlFor="brand-search">
            Search brands
          </label>
          <input
            id="brand-search"
            name="searchTerm"
            type="search"
            value={searchValue}
            placeholder="Search brands"
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchValue(nextValue);
              window.clearTimeout(searchTimerRef.current);
              searchTimerRef.current = window.setTimeout(() => {
                applySearch(nextValue);
              }, searchDebounceMs);
            }}
            className="w-full rounded-md border border-[#E9E6DF] bg-gray-200 px-3 py-2 text-sm text-[#34332F] outline-none focus:border-secondary-color"
          />
        </form>
        <label className="flex items-center gap-2 text-sm text-[#77766F]">
          <span>Sort by</span>
          <select
            value={sorts.some((item) => item.value === sort) ? sort : "name"}
            onChange={(event) =>
              updateSearchParams({
                sort: event.target.value === "name" ? null : event.target.value,
                page: "1",
              })
            }
            className="cursor-pointer rounded-md border border-[#E9E6DF] bg-gray-200 px-2.5 py-2 text-sm font-medium text-[#34332F] outline-none focus:border-secondary-color"
          >
            {sorts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
