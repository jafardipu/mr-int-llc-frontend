import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/container/Container";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import CategoryDirectory, {
  CategoryDirectorySkeleton,
} from "./_components/CategoryDirectory";

export const metadata: Metadata = {
  title: "Shop by Category",
  description: "Browse product categories at MR International.",
};

type CategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function CategoriesPage({ searchParams }: CategoriesPageProps) {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full">
        <PageSectionTitle
          title="Shop by Category"
          subTitle="Find products by the category that fits what you need."
        />
        <Suspense fallback={<CategoryDirectorySkeleton />}>
          <CategoryDirectory searchParams={searchParams} />
        </Suspense>
      </main>
    </Container>
  );
}
