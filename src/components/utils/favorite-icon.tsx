"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "cn";
import {
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/actions/wishlist.actions";
import { runFavoriteAction } from "@/components/wishlist/favorite-toast";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export default function FavoriteIcon({
  productId,
  wishlistItemId,
}: {
  productId: string;
  wishlistItemId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const wishlist = useWishlist();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const activeId = wishlistItemId || wishlist.items[productId];
  const filled = Boolean(activeId);
  const isCatalogProduct = /^[a-f0-9]{24}$/i.test(productId);

  if (!isCatalogProduct || (wishlist.ready && !wishlist.canUse)) return null;

  const toggle = async () => {
    if (!wishlist.isLoggedIn && wishlist.ready) {
      wishlist.openLoginModal(pathname || "/products");
      return;
    }
    if (!wishlist.ready) return;

    setPending(true);
    setError("");

    if (activeId) {
      const result = await runFavoriteAction("Removing from favorites...", () =>
        removeFromWishlistAction(activeId),
      );
      setPending(false);
      if (result.status === "error") {
        setError(result.message);
        if (result.statusCode === 404) wishlist.forget(productId);
        return;
      }
      wishlist.forget(productId);
      router.refresh();
      return;
    }

    const result = await runFavoriteAction("Adding to favorites...", () =>
      addToWishlistAction(productId),
    );
    setPending(false);
    if (result.status === "error" || !result.item) {
      setError(result.message);
      return;
    }
    wishlist.remember(result.item.productId, result.item.id);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
      disabled={pending}
      aria-label={filled ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={filled}
      title={error || undefined}
      className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full bg-slate-900 text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 group cursor-pointer disabled:cursor-wait"
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "size-4 group-hover:fill-red-500 group-hover:text-red-500 duration-300 transition-all",
          filled && "fill-red-500 text-red-500",
        )}
        fill={filled ? "red" : "none"}
      />
    </button>
  );
}
