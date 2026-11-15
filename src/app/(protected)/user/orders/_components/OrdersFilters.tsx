"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import type { OrderStatus } from "@/services/orders.service";

const searchDebounceMs = 400;

const statuses: Array<{ value: "" | OrderStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersFilters() {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const updateSearchParamsRef = useRef(updateSearchParams);
  const searchTimerRef = useRef<number | undefined>(undefined);
  const searchTerm = searchParams.get("searchTerm") ?? "";
  const status = (searchParams.get("status") ?? "") as "" | OrderStatus;
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

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="relative block w-full sm:max-w-134"
          onSubmit={(event) => {
            event.preventDefault();
            window.clearTimeout(searchTimerRef.current);
            applySearch(searchValue);
          }}
        >
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
          />
          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <input
            id="order-search"
            type="search"
            value={searchValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchValue(nextValue);
              window.clearTimeout(searchTimerRef.current);
              searchTimerRef.current = window.setTimeout(() => {
                applySearch(nextValue);
              }, searchDebounceMs);
            }}
            placeholder="Search by order number..."
            className="h-11 w-full rounded-xl border border-[#e1e5eb] bg-white pl-12 pr-4 text-sm text-[#374151] shadow-[0_1px_3px_rgba(27,39,58,0.08)] outline-none placeholder:text-[#9ca3af] focus:border-[#995618] focus:ring-2 focus:ring-[#995618]/15 sm:text-base"
          />
        </form>
      </div>

      <div
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 cursor-pointer"
        role="tablist"
        aria-label="Filter orders by status"
      >
        {statuses.map((item) => {
          const isActive = status === item.value;
          return (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() =>
                updateSearchParams({
                  status: item.value || null,
                  page: "1",
                })
              }
              className={`shrink-0 rounded-full border px-5 py-1.5 text-sm font-medium shadow-[0_1px_3px_rgba(27,39,58,0.08)] transition-colors sm:px-5.5 sm:text-base cursor-pointer ${
                isActive
                  ? "border-[#995618] bg-[#995618] text-white"
                  : "border-[#e1e5eb] bg-white text-[#4b5563] hover:border-[#c7cdd5]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
