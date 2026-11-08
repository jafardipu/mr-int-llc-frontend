import Container from "@/components/container/Container";
import AllProductsContent from "./_components/AllProductsContent";

export const metadata = {
  title: "All Products",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

type AllProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AllProductsPage({ searchParams }: AllProductsPageProps) {
  return (
    <Container className="page-padding">
      <AllProductsContent searchParams={searchParams} />
    </Container>
  );
}
