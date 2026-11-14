import { PackageSearch } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import ProductCard from "@/components/shared/cards/product/ProductCard";
import type { TProducts } from "@/types/products";

export default function ProductGrid({
  products,
}: {
  products: TProducts[];
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        message="No products match these filters."
      />
    );
  }

  return (
    <div
      className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product) => (
        <div key={product.id}>
          <ProductCard {...product} />
        </div>
      ))}
    </div>
  );
}
