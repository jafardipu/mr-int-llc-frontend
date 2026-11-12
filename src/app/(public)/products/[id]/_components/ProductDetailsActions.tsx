"use client";

import { Heart, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/actions/wishlist.actions";
import { runFavoriteAction } from "@/components/wishlist/favorite-toast";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

type ProductFavoriteButtonProps = {
  productId: string;
  productTitle: string;
};

export function ProductFavoriteButton({
  productId,
  productTitle,
}: ProductFavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const wishlist = useWishlist();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const wishlistItemId = wishlist.items[productId];
  const isFavorite = Boolean(wishlistItemId);

  if (wishlist.ready && !wishlist.canUse) return null;

  const toggle = async () => {
    if (!wishlist.isLoggedIn && wishlist.ready) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || `/products/${productId}`)}`);
      return;
    }
    if (!wishlist.ready || pending) return;

    setPending(true);
    setError("");

    if (wishlistItemId) {
      const result = await runFavoriteAction("Removing from favorites...", () =>
        removeFromWishlistAction(wishlistItemId),
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
    <div className="shrink-0">
      <button
        aria-label={
          isFavorite
            ? `Remove ${productTitle} from favorites`
            : `Add ${productTitle} to favorites`
        }
        aria-pressed={isFavorite}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-[#DC1638] transition hover:bg-[#fbf6f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color group disabled:cursor-wait"
        onClick={() => void toggle()}
        type="button"
      >
        <Heart
          aria-hidden="true"
          className="size-4 group-hover:fill-[#DC1638] group-hover:stroke-[#DC1638]"
          fill={isFavorite ? "currentColor" : "none"}
        />
        <span className="hidden sm:inline">
          {pending
            ? "Saving..."
            : isFavorite
              ? "Added to favorites"
              : "Add to favorite"}
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-1 max-w-48 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type ProductPurchaseControlsProps = {
  stockCount?: number;
};

export function ProductPurchaseControls({
  stockCount,
}: ProductPurchaseControlsProps) {
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState("White");
  const [showCartNotice, setShowCartNotice] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex  w-full gap-3 sm:flex-row justify-center sm:justify-start sm:items-center">
        <label
          className="flex min-h-12 min-w-0    items-center justify-between gap-3 rounded-lg border border-[#E9E6DF] bg-[#F7F8FA] px-3 py-2"
          htmlFor="product-finish"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8A8D94]">
            Color
          </span>
          <select
            className="max-w-[65%] cursor-pointer bg-transparent text-sm font-medium text-[#34332F] outline-none"
            id="product-finish"
            onChange={(event) => setFinish(event.target.value)}
            value={finish}
          >
            <option>White</option>
            <option>Black</option>
            <option>Silver</option>
          </select>
        </label>

        <div
          aria-label="Quantity"
          className="flex h-12 items-center justify-between rounded-lg border border-[#D8DDE5] bg-white sm:w-40"
        >
          <button
            aria-label="Decrease quantity"
            className="grid h-full w-11 place-items-center text-[#475569] transition hover:text-secondary-color disabled:cursor-not-allowed disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            type="button"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <span
            aria-live="polite"
            className="min-w-6 text-center font-semibold"
          >
            {quantity}
          </span>
          <button
            aria-label="Increase quantity"
            className="grid h-full w-11 place-items-center text-[#475569] transition hover:text-secondary-color disabled:cursor-not-allowed disabled:opacity-40"
            disabled={stockCount !== undefined && quantity >= stockCount}
            onClick={() =>
              setQuantity((current) =>
                stockCount === undefined
                  ? current + 1
                  : Math.min(stockCount, current + 1),
              )
            }
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:w-[80%]">
        <button
          aria-live="polite"
          aria-label={`Add ${quantity} ${finish} item${quantity === 1 ? "" : "s"} to cart`}
          className="min-h-12 w-full rounded-full bg-secondary-color px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color sm:w-auto sm:min-w-48 cursor-pointer"
          disabled={stockCount === 0}
          onClick={() => setShowCartNotice(true)}
          type="button"
        >
          Add to Cart
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4E7EC] px-4 text-center text-sm font-medium text-[#5D6470] transition hover:border-secondary-color hover:text-secondary-color"
          href="/sign-up"
        >
          Sign in for Wholesale Access
        </Link>

        <button
          aria-live="polite"
          aria-label={`Add ${quantity} ${finish} item${quantity === 1 ? "" : "s"} to cart`}
          className="min-h-12 w-full rounded-full bg-[#000000] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#240d03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color sm:w-auto sm:min-w-48 cursor-pointer"
          disabled={stockCount === 0}
          onClick={() => setShowCartNotice(true)}
          type="button"
        >
          Amazon Product Link
        </button>

        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4E7EC] px-4 text-center text-sm font-medium text-[#5D6470] transition hover:border-secondary-color hover:text-secondary-color"
          href="/contact-us"
        >
          Walmart Product Link
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2"></div>
    </div>
  );
}
