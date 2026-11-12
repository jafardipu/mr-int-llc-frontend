import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/container/Container";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import BrandDirectory, {
  BrandDirectorySkeleton,
} from "./_components/BrandDirectory";

export const metadata: Metadata = {
  title: "Shop by Brand",
  description:
    "Explore brands at MR International and shop the products they carry.",
};

type ShopByBrandPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function ShopByBrandPage({ searchParams }: ShopByBrandPageProps) {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full">
        <PageSectionTitle
          title="Shop by Brand"
          subTitle="We work with trusted global brands to bring you the best products."
        />
        <Suspense fallback={<BrandDirectorySkeleton />}>
          <BrandDirectory searchParams={searchParams} />
        </Suspense>
      </main>
    </Container>
  );
}
