import Container from "@/components/container/Container";
import ProductCard from "@/components/shared/cards/product/ProductCard";
import SectionTitle from "@/components/shared/section/SectionTitle";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  return (
    <Container>
      <SectionTitle title="Featured Products" btnHref="/products" />
      <section aria-label="Featured products" className="lg:mt-10 mt-7">
        <div className="grid w-full grid-cols-2 md:gap-5 gap-3 lg:grid-cols-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </Container>
  );
}
