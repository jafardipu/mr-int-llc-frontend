"use client";

import { cn } from "cn";
import type { ProductVolumeTier } from "@/services/products.service";

export type WholesaleTier = {
  key: string;
  minQty: number;
  /** Last quantity in this tier, or null for the open-ended top tier. */
  maxQty: number | null;
  unitPrice: number;
  /** 0 means the standard (undiscounted) wholesale price. */
  savePercent: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number) {
  return `${Number(value.toFixed(1))}%`;
}

export function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

/**
 * Normalises the API volume tiers into contiguous, sorted ranges starting at
 * the wholesale minimum order quantity. If the first tier starts above that
 * minimum, a "Standard" tier at the base wholesale price fills the gap.
 */
export function buildWholesaleTiers(
  raw: ProductVolumeTier[] | null | undefined,
  basePrice: number,
  minOrderQty: number,
): WholesaleTier[] {
  const seen = new Set<number>();
  const tiers = (raw ?? [])
    .filter(
      (tier) =>
        Number.isFinite(tier.minQty) &&
        tier.minQty >= 1 &&
        (typeof tier.maxQty !== "number" || tier.maxQty >= minOrderQty),
    )
    .map((tier) => {
      // A volume tier can't cost more than the base price; if the stored
      // unitPrice does, trust discountPercent instead.
      const unitPrice =
        typeof tier.unitPrice === "number" &&
        tier.unitPrice > 0 &&
        tier.unitPrice <= basePrice
          ? tier.unitPrice
          : typeof tier.discountPercent === "number"
            ? roundMoney(basePrice * (1 - tier.discountPercent / 100))
            : basePrice;
      const savePercent =
        typeof tier.discountPercent === "number"
          ? tier.discountPercent
          : basePrice > 0 && unitPrice < basePrice
            ? Math.round((1 - unitPrice / basePrice) * 100)
            : 0;

      return {
        minQty: Math.max(tier.minQty, minOrderQty),
        unitPrice,
        savePercent: Math.max(0, savePercent),
      };
    })
    .sort((a, b) => a.minQty - b.minQty)
    .filter((tier) => {
      if (seen.has(tier.minQty)) return false;
      seen.add(tier.minQty);
      return true;
    });

  if (tiers.length === 0) return [];

  if (tiers[0].minQty > minOrderQty) {
    tiers.unshift({
      minQty: minOrderQty,
      unitPrice: basePrice,
      savePercent: 0,
    });
  }

  // Ranges run up to the next tier; the top tier is open-ended because any
  // larger quantity is priced at it.
  return tiers.map((tier, index) => {
    const next = tiers[index + 1];
    return {
      key: `tier-${tier.minQty}`,
      minQty: tier.minQty,
      maxQty: next ? next.minQty - 1 : null,
      unitPrice: tier.unitPrice,
      savePercent: tier.savePercent,
    };
  });
}

/** The tier that prices `quantity`: the highest tier whose minimum it meets. */
export function findActiveTier(tiers: WholesaleTier[], quantity: number) {
  let active = tiers[0] ?? null;
  for (const tier of tiers) {
    if (quantity >= tier.minQty) active = tier;
  }
  return active;
}

function rangeLabel(tier: WholesaleTier) {
  if (tier.maxQty === null) return `${tier.minQty}+ units`;
  if (tier.maxQty === tier.minQty) {
    return `${tier.minQty} ${tier.minQty === 1 ? "unit" : "units"}`;
  }
  return `${tier.minQty}–${tier.maxQty} units`;
}

export default function WholesaleVolumeTiers({
  tiers,
  activeKey,
  stockCount,
  onSelect,
}: {
  tiers: WholesaleTier[];
  activeKey: string | null;
  stockCount?: number;
  onSelect: (tier: WholesaleTier) => void;
}) {
  return (
    <section aria-labelledby="bulk-pricing-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="bulk-pricing-heading"
          className="text-lg font-semibold text-[#111827]"
        >
          Bulk Pricing
        </h2>
        <span className="text-sm font-medium text-[#995618]">Volume Tiers</span>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3 pt-2 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        {tiers.map((tier) => {
          const active = tier.key === activeKey;
          const outOfReach =
            stockCount !== undefined && tier.minQty > stockCount;

          return (
            <li key={tier.key} className="flex">
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${rangeLabel(tier)} at ${formatMoney(tier.unitPrice)} each${
                  tier.savePercent > 0 ? `, save ${formatPercent(tier.savePercent)}` : ""
                }`}
                disabled={outOfReach}
                title={outOfReach ? "Not enough stock for this tier" : undefined}
                onClick={() => onSelect(tier)}
                className={cn(
                  "relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-2 border-[#995618] bg-[#F5EBDF]"
                    : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#D6C3AE]",
                )}
              >
                {active && (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-[#995618] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Active Tier
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm",
                    active ? "font-medium text-[#995618]" : "text-[#6B7280]",
                  )}
                >
                  {rangeLabel(tier)}
                </span>
                <span className="mt-1 text-lg font-bold text-[#1F2937]">
                  {formatMoney(tier.unitPrice)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-xs",
                    tier.savePercent > 0
                      ? "font-medium text-[#16A34A]"
                      : "text-[#9CA3AF]",
                  )}
                >
                  {tier.savePercent > 0
                    ? `Save ${formatPercent(tier.savePercent)}`
                    : "Standard"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
