import ProductCard from "@/components/shared/cards/product/ProductCard";
import type { TProducts } from "@/types/products";

export default function ProductGrid({
  products,
}: {
  products: TProducts[];
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#D6D3CD] px-5 py-12 text-center text-sm text-[#77766F]">
        No products match these filters. Try changing your selections.
      </p>
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
