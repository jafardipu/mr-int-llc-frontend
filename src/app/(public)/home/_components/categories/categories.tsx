import { LayoutGrid } from "lucide-react";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import SectionTitle from "@/components/shared/section/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { getCategories } from "@/services/categories.service";
import CategoryCarousel from "./CategoryCarousel";

export function CategoriesSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading categories" className="py-5 sm:py-8">
      <Container>
        <Skeleton className="h-8 w-56" />
        <div className="mt-7 flex gap-3 lg:mt-10">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-[0.57/1] w-37 shrink-0 sm:w-[calc((100%-36px)/4)] lg:w-[calc((100%-72px)/7)]"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default async function Categories() {
  try {
    const result = await getCategories({ limit: 20, sort: "name" });
    const categories = result.data.filter(
      (category) => category.status === "active",
    );

    return (
      <section aria-label="Shop by category" className="py-5 sm:py-8">
        <Container>
          <SectionTitle title="Shop by category" btnHref="/categories" />
          {categories.length === 0 ? (
            <EmptyState icon={LayoutGrid} message="No categories yet." />
          ) : (
            <CategoryCarousel
              categories={categories.map(({ id, name, image }) => ({
                id,
                name,
                image,
              }))}
            />
          )}
        </Container>
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load categories.";

    return (
      <section className="py-5 sm:py-8">
        <Container>
          <SectionTitle title="Shop by category" btn={false} />
          <p role="alert" className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        </Container>
      </section>
    );
  }
}
