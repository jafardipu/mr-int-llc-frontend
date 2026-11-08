import Container from "@/components/container/Container";
import ProductCatalogSkeleton from "./_components/ProductCatalogSkeleton";

export default function Loading() {
  return (
    <Container className="page-padding">
      <ProductCatalogSkeleton />
    </Container>
  );
}
