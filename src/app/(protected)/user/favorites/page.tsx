import { Suspense } from "react";
import SectionTitle from "@/components/shared/section/SectionTitle";
import FavoritesContainer, {
  FavoritesSkeleton,
} from "./_components/FavoritesContainer";

type FavoritesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function FavoritePage({ searchParams }: FavoritesPageProps) {
  return (
    <div className="space-y-6 lg:space-y-7">
      <SectionTitle
        title="Favorites"
        subTitle="Manage all Favorites"
        btn={false}
        className="lg:space-y-1.5 space-y-1"
        subTitleClass="text-[#6B7280]"
      />
      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoritesContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
