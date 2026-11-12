"use client";

import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  brandOptions,
  categoryOptions,
  filterOptions,
  type CatalogFilter,
} from "@/data/all-products";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import FilterOptionGroup from "./FilterOptionGroup";
import { FilterIcon } from "@/icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductFilterSidebarProps {
  page?: string;
  brands?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  showCatalogTags?: boolean;
  mobileSheet?: boolean;
}

export default function ProductFilterSidebar({
  page,
  brands,
  categories,
  showCatalogTags = true,
  mobileSheet = false,
}: ProductFilterSidebarProps) {
  const searchParams = useSearchParams();
  const activeFilterCount = [
    searchParams.get("deal") === "true",
    Boolean(searchParams.get("minPrice")),
    Boolean(searchParams.get("maxPrice")),
    ...(searchParams.get("brandId")?.split(",").filter(Boolean) ?? []),
    ...(searchParams.get("categoryId")?.split(",").filter(Boolean) ?? []),
    ...(searchParams.get("filter")?.split(",").filter(Boolean) ?? []),
  ].filter(Boolean).length;

  return (
    <>
      {mobileSheet && (
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-md border border-[#E9E6DF] bg-white px-3 text-sm font-semibold text-[#24231F]">
              <FilterIcon className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary-color px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </SheetTrigger>
            <SheetContent side="left" aria-labelledby="product-filter-title">
              <div className="flex shrink-0 items-center justify-between border-b border-[#E9E6DF] pb-4">
                <SheetTitle
                  id="product-filter-title"
                  className="text-lg font-semibold"
                >
                  Filters
                </SheetTitle>
                <SheetClose
                  aria-label="Close filters"
                  className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-[#f4eddf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
                >
                  <X aria-hidden="true" className="size-5" />
                </SheetClose>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-5">
                <ProductFilterFields
                  idPrefix="sheet"
                  page={page}
                  brands={brands}
                  categories={categories}
                  showCatalogTags={showCatalogTags}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <aside
        aria-label="Product filters"
        className={`h-fit rounded-xl bg-white p-4 sm:p-5 lg:sticky lg:top-6 ${
          mobileSheet ? "hidden lg:block" : ""
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#24231F]">Filters</h2>
          <FilterIcon className="h-5 w-5" />
        </div>
        <ProductFilterFields
          idPrefix="sidebar"
          page={page}
          brands={brands}
          categories={categories}
          showCatalogTags={showCatalogTags}
        />
      </aside>
    </>
  );
}

function ProductFilterFields({
  idPrefix,
  page,
  brands,
  categories,
  showCatalogTags,
}: ProductFilterSidebarProps & { idPrefix: string }) {
  const searchParams = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const selectedBrands = searchParams.get("brandId")?.split(",").filter(Boolean) ?? [];
  const selectedCategories =
    searchParams.get("categoryId")?.split(",").filter(Boolean) ?? [];
  const selectedFilters =
    searchParams
      .get("filter")
      ?.split(",")
      .filter((value): value is CatalogFilter =>
        filterOptions.some((option) => option.value === value),
      ) ?? [];

  const toggleSearchParamValue = (key: string, value: string) => {
    updateSearchParams({
      [key]: searchParams.get(key) === value ? null : value,
      page: "1",
    });
  };

  return (
    <>
      {page !== "brand" && (
        <section className="pb-5">
          <label className="flex items-center gap-2 text-sm font-medium text-[#24231F]">
            <input
              type="checkbox"
              checked={searchParams.get("deal") === "true"}
              onChange={(event) =>
                updateSearchParams({
                  deal: event.target.checked ? "true" : null,
                  page: "1",
                })
              }
              className="size-4 accent-secondary-color"
            />
            Deals only
          </label>
        </section>
      )}

      <section className="pb-5">
        <h3 className="mb-3 text-sm font-semibold text-[#24231F]">Price, $</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-minimum-price`}>
            Minimum price
          </label>
          <input
            id={`${idPrefix}-minimum-price`}
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Min"
            value={searchParams.get("minPrice") ?? ""}
            onChange={(event) =>
              updateSearchParams({
                minPrice: event.target.value || null,
                page: "1",
              })
            }
            className="min-w-0 rounded-md border border-[#E2DFD9] px-3 py-2 text-sm outline-none transition focus:border-secondary-color focus:ring-2 focus:ring-secondary-color/15"
          />
          <label className="sr-only" htmlFor={`${idPrefix}-maximum-price`}>
            Maximum price
          </label>
          <input
            id={`${idPrefix}-maximum-price`}
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="Max"
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(event) =>
              updateSearchParams({
                maxPrice: event.target.value || null,
                page: "1",
              })
            }
            className="min-w-0 rounded-md border border-[#E2DFD9] px-3 py-2 text-sm outline-none transition focus:border-secondary-color focus:ring-2 focus:ring-secondary-color/15"
          />
        </div>
      </section>

      <div className="space-y-5">
        {page !== "brand" && (
          <FilterOptionGroup
            title="Brand"
            options={
              brands?.map(({ id, name }) => ({ label: name, value: id })) ??
              brandOptions.map((brand) => ({ label: brand, value: brand }))
            }
            selectedValues={selectedBrands}
            onChange={(brand) => toggleSearchParamValue("brandId", brand)}
          />
        )}
        <FilterOptionGroup
          title="Category"
          options={
            categories?.map(({ id, name }) => ({ label: name, value: id })) ??
            categoryOptions.map((category) => ({
              label: category,
              value: category,
            }))
          }
          selectedValues={selectedCategories}
          onChange={(category) =>
            toggleSearchParamValue("categoryId", category)
          }
        />
        {showCatalogTags && (
          <FilterOptionGroup
            title="Filters"
            options={filterOptions}
            selectedValues={selectedFilters}
            onChange={(filter) => {
              const values =
                searchParams.get("filter")?.split(",").filter(Boolean) ?? [];
              const nextValues = values.includes(filter)
                ? values.filter((item) => item !== filter)
                : [...values, filter];

              updateSearchParams({
                filter: nextValues.length ? nextValues.join(",") : null,
                page: "1",
              });
            }}
          />
        )}
      </div>
    </>
  );
}
