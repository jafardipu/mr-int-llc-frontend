import PaginationSection from "@/components/shared/pagination/PaginationSection";
import { Skeleton } from "@/components/ui/skeleton";
import { mapCatalogProduct } from "@/lib/catalog-api";
import { ApiRequestError } from "@/services/api-service";
import { getMyWishlist } from "@/services/wishlist.service";
import FavoritesEmpty from "./FavoritesEmpty";
import FavoritesList from "./FavoritesList";

const pageSize = 8;

type SearchParams = Record<string, string | string[] | undefined>;

function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function FavoritesSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading favorites"
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="aspect-[0.8/1] rounded-md" />
      ))}
    </div>
  );
}

export default async function FavoritesContainer({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const page = pageNumber(params.page);

  try {
    const result = await getMyWishlist({
      page,
      limit: pageSize,
      sort: "-createdAt",
    });
    const items = result.data.flatMap((item) =>
      item.product
        ? [{ wishlistItemId: item.id, product: mapCatalogProduct(item.product) }]
        : [],
    );

    return (
      <div className="space-y-6">
        {items.length === 0 ? (
          result.data.length === 0 ? (
            <FavoritesEmpty />
          ) : (
            <FavoritesEmpty message="The wishlist response did not include displayable products." />
          )
        ) : (
          <FavoritesList items={items} />
        )}
        {result.meta.total > result.meta.limit && (
          <PaginationSection
            total={result.meta.total}
            current={result.meta.page}
            pageSize={result.meta.limit}
          />
        )}
      </div>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load your wishlist.";

    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {message}
      </p>
    );
  }
}
