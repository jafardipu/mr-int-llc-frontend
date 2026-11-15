import { Tag } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import Container from "@/components/container/Container";
import SectionTitle from "@/components/shared/section/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { mapCatalogProduct } from "@/lib/catalog-api";
import { ApiRequestError } from "@/services/api-service";
import { getDealSections, type Deal } from "@/services/deals.service";
import DealsPanel, { type DealCard } from "./DealsPanel";

function toDealCard(deal: Deal): DealCard {
  const mapped = mapCatalogProduct({
    ...deal.product,
    displayPrice:
      deal.product.displayPrice ?? deal.dealPrice ?? deal.product.retailPrice,
    isDeal: true,
    dealPrice: deal.product.dealPrice ?? deal.dealPrice,
  });

  return {
    ...mapped,
    price: mapped.price,
    href: `/products/${deal.product.id}`,
    badge: mapped.badge ?? "On Sale",
  };
}

export function DealsSkeleton() {
  return (
    <div id="deal" aria-busy="true" aria-label="Loading deals">
      <Container className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </Container>
    </div>
  );
}

function uniqueByProductId(deals: Deal[]): DealCard[] {
  const seen = new Set<string>();
  const cards: DealCard[] = [];

  for (const deal of deals) {
    const productId = deal.product.id;
    if (seen.has(productId)) continue;
    seen.add(productId);
    cards.push(toDealCard(deal));
  }

  return cards;
}

export default async function Deals() {
  try {
    const sections = await getDealSections(8);
    const weekly = uniqueByProductId(sections.weekly.data);
    const clearance = uniqueByProductId(sections.clearance.data);

    return <DealsPanel weekly={weekly} clearance={clearance} />;
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load deals.";

    return (
      <div id="deal">
        <Container className="space-y-4">
          <SectionTitle title="Deals" btnHref="/products?deal=true" />
          <EmptyState
            icon={Tag}
            message={message}
            className="min-h-64 rounded-2xl border border-[#e3e7ec] bg-white"
          />
        </Container>
      </div>
    );
  }
}
