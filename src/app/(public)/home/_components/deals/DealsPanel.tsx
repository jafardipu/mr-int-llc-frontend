"use client";

import { useMemo, useState } from "react";
import { Package, Star } from "lucide-react";
import Link from "next/link";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import ProductCard from "@/components/shared/cards/product/ProductCard";
import ProductImagesCarousel from "@/app/(public)/products/[id]/_components/carousel/ProductImagesCarousel";
import SectionTitle from "@/components/shared/section/SectionTitle";
import type { TProducts } from "@/types/products";

type DealTab = "weekly" | "clearance";

export type DealCard = TProducts & {
  galleryImages: string[];
};

function formatPrice(value: number | string) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : value;
}

export default function DealsPanel({
  weekly,
  clearance,
}: {
  weekly: DealCard[];
  clearance: DealCard[];
}) {
  const [activeTab, setActiveTab] = useState<DealTab>(
    weekly.length > 0 || clearance.length === 0 ? "weekly" : "clearance",
  );

  const products = useMemo(() => {
    const source = activeTab === "weekly" ? weekly : clearance;
    const seen = new Set<string>();
    return source.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [activeTab, weekly, clearance]);

  const featuredProduct = products[0] ?? null;
  const remaining = products.slice(1);
  const leftProducts = remaining.filter((_, index) => index % 2 === 0);
  const rightProducts = remaining.filter((_, index) => index % 2 === 1);

  const rating = Math.min(5, Math.max(0, featuredProduct?.rating ?? 0));

  return (
    <div id="deal">
      <Container className="space-y-4">
        <SectionTitle title="Deals" btnHref="/products?deal=true" />
        <div className="flex gap-2" role="tablist" aria-label="Product deals">
          {(
            [
              ["weekly", "Weekly Deals"],
              ["clearance", "Clearance Deals"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              id={`deals-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="deals-panel"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f] ${
                activeTab === tab
                  ? "bg-[#f4e4cc] text-[#8b4b1f] shadow-sm"
                  : "text-[#8b4b1f] hover:bg-[#f8f2e9]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            message={
              activeTab === "weekly"
                ? "No weekly deals right now."
                : "No clearance deals right now."
            }
            className="min-h-64 rounded-2xl border border-[#e3e7ec] bg-white"
          />
        ) : (
          <div
            id="deals-panel"
            role="tabpanel"
            aria-labelledby={`deals-tab-${activeTab}`}
            className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.72fr)_minmax(0,1fr)] lg:gap-6"
          >
            <div className="order-2 grid grid-cols-2 items-stretch gap-2 sm:gap-3 lg:order-1">
              {leftProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            <div className="order-3 grid grid-cols-2 items-stretch gap-2 sm:gap-3">
              {rightProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {featuredProduct && (
              <article className="order-1 min-w-0 lg:order-2">
                <ProductImagesCarousel
                  productHref={`/products/${featuredProduct.id}`}
                  slides={(featuredProduct.galleryImages.length
                    ? featuredProduct.galleryImages
                    : [String(featuredProduct.image)]
                  ).map((url) => ({
                    url,
                    alt: featuredProduct.imageAlt,
                  }))}
                />

                <div className="mt-3">
                  <p className="text-xs text-[#9CA3AF]">
                    {featuredProduct.category}
                  </p>
                  <h2 className="mt-0.5 line-clamp-2 text-base font-semibold leading-tight text-slate-800">
                    <Link
                      href={`/products/${featuredProduct.id}`}
                      className="hover:text-secondary-color focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color"
                    >
                      {featuredProduct.title}
                    </Link>
                  </h2>
                  <div
                    role="img"
                    aria-label={`${rating} out of 5 stars`}
                    className="mt-1.5 flex items-center gap-0.5 text-amber-400"
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        aria-hidden="true"
                        className="size-3.5"
                        fill={
                          index < Math.floor(rating) ? "currentColor" : "none"
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-bold text-secondary-color">
                      {formatPrice(featuredProduct.price)}
                    </span>
                    {featuredProduct.originalPrice !== undefined && (
                      <span className="text-sm text-[#9CA3AF] line-through">
                        {formatPrice(featuredProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                  {featuredProduct.stockCount !== undefined && (
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                      In stock:{" "}
                      <span className="font-semibold text-[#4B5563]">
                        {featuredProduct.stockCount}
                      </span>
                    </p>
                  )}
                </div>
              </article>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
