"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/shared/cards/product/ProductCard";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { removeFromWishlistAction } from "@/actions/wishlist.actions";
import type { TProducts } from "@/types/products";
import FavoritesEmpty from "./FavoritesEmpty";

export type FavoriteCard = {
  wishlistItemId: string;
  product: TProducts;
};

export default function FavoritesList({ items }: { items: FavoriteCard[] }) {
  const router = useRouter();
  const wishlist = useWishlist();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const visibleItems = items.filter(
    (item) => !removedIds.includes(item.wishlistItemId),
  );

  const remove = async (wishlistItemId: string, productId: string) => {
    setPendingId(wishlistItemId);
    setError("");
    const result = await removeFromWishlistAction(wishlistItemId);
    setPendingId("");

    if (result.status === "error") {
      setError(result.message);
      if (result.statusCode === 404) {
        wishlist.forget(productId);
        setRemovedIds((current) => [...current, wishlistItemId]);
      }
      return;
    }

    wishlist.forget(productId);
    setRemovedIds((current) => [...current, wishlistItemId]);
    router.refresh();
  };

  if (visibleItems.length === 0) {
    return <FavoritesEmpty />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item) => (
          <div key={item.wishlistItemId} className="flex h-full flex-col gap-2">
            <ProductCard
              {...item.product}
              wishlistItemId={item.wishlistItemId}
            />
            <button
              type="button"
              disabled={pendingId === item.wishlistItemId}
              onClick={() => void remove(item.wishlistItemId, item.product.id)}
              className="rounded-full border border-[#E4E7EC] px-3 py-2 text-sm font-medium text-[#5D6470] transition hover:border-[#DC1638] hover:text-[#DC1638] disabled:cursor-wait disabled:opacity-60"
            >
              {pendingId === item.wishlistItemId ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
