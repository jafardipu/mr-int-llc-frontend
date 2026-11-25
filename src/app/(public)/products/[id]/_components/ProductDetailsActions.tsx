"use client";

import {
  Heart,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  Check as CheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useWholesaleFeeState } from "@/components/wholesale-fee/wholesale-fee-store";
import { wholesaleFeePath } from "@/lib/wholesale-fee";
import { usePathname, useRouter } from "next/navigation";
import {
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/actions/wishlist.actions";
import { runFavoriteAction } from "@/components/wishlist/favorite-toast";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addToCart, selectCartItems } from "@/redux/features/cartSlice";
import type { ProductVolumeTier } from "@/services/products.service";
import { toast } from "sonner";
import WholesaleVolumeTiers, {
  buildWholesaleTiers,
  findActiveTier,
  formatMoney,
} from "./WholesaleVolumeTiers";

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
      wishlist.openLoginModal(pathname || `/products/${productId}`);
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

export type ProductPurchaseControlsProduct = {
  id: string;
  title: string;
  price: number;
  image: string;
  imageAlt: string;
  stockCount?: number;
  displayMinQty?: number;
  amazonUrl?: string | null;
  walmartUrl?: string | null;
  isWholesale?: boolean;
  /** Bulk pricing; only applied for wholesale customers. */
  volumeTiers?: ProductVolumeTier[] | null;
};

type ProductPurchaseControlsProps = {
  stockCount?: number;
  product?: ProductPurchaseControlsProduct;
};

export function ProductPurchaseControls({
  stockCount,
  product,
}: ProductPurchaseControlsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const wholesaleFee = useWholesaleFeeState();
  const minQty = Math.max(1, product?.displayMinQty ?? 1);
  // The page keys this component by product id, so quantity starts at the
  // product's minimum whenever the product changes.
  const [quantity, setQuantity] = useState(minQty);

  const effectiveStock = product?.stockCount ?? stockCount;
  const cartItemId = product?.id ?? "";
  const existingCartItem = cartItems.find((item) => item.id === cartItemId);
  const isInCart = Boolean(existingCartItem);
  const outOfStock = effectiveStock !== undefined && effectiveStock <= 0;

  // Wholesale bulk pricing: the active tier follows the quantity, and its unit
  // price is what goes into the cart. Retail customers keep the plain price.
  const isWholesale = product?.isWholesale === true;
  const basePrice = product?.price ?? 0;
  const tiers = useMemo(
    () =>
      isWholesale
        ? buildWholesaleTiers(product?.volumeTiers, basePrice, minQty)
        : [],
    [isWholesale, product?.volumeTiers, basePrice, minQty],
  );
  const activeTier = tiers.length > 0 ? findActiveTier(tiers, quantity) : null;
  const unitPrice = activeTier?.unitPrice ?? basePrice;

  const handleAddToCart = () => {
    if (!product) {
      toast.error("Product information not available");
      return;
    }

    if (isInCart) {
      toast.info(`"${product.title}" is already in your cart.`, {
        action: {
          label: "View Cart",
          onClick: () => router.push("/cart"),
        },
      });
      return;
    }

    dispatch(
      addToCart({
        id: cartItemId,
        productId: product.id,
        title: product.title,
        price: unitPrice,
        image: product.image,
        imageAlt: product.imageAlt,
        quantity,
        selected: true,
        stockCount: effectiveStock,
      }),
    );

    const message = activeTier
      ? `Added ${quantity} × ${product.title} to cart at ${formatMoney(unitPrice)} each!`
      : `Added ${quantity} × ${product.title} to cart!`;
    toast.success(message, {
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
  };

  return (
    <div className="mt-6 space-y-4">
      {tiers.length > 0 && (
        <WholesaleVolumeTiers
          tiers={tiers}
          activeKey={activeTier?.key ?? null}
          stockCount={effectiveStock}
          onSelect={(tier) => setQuantity(Math.max(minQty, tier.minQty))}
        />
      )}

      {isInCart && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckIcon aria-hidden="true" className="size-4" />
          Already in your cart
          {existingCartItem && (
            <span className="text-emerald-500">
              — Qty: {existingCartItem.quantity}
            </span>
          )}
        </div>
      )}

      <div className="flex w-full gap-3 sm:flex-row sm:items-center sm:justify-start">
        <div
          aria-label="Quantity"
          className="flex h-12 items-center justify-between rounded-lg border border-[#D8DDE5] bg-white sm:w-40"
        >
          <button
            aria-label="Decrease quantity"
            className="grid h-full w-11 place-items-center text-[#475569] transition hover:text-secondary-color disabled:cursor-not-allowed disabled:opacity-40"
            disabled={quantity <= minQty}
            onClick={() =>
              setQuantity((current) => Math.max(minQty, current - 1))
            }
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
            disabled={
              effectiveStock !== undefined && quantity >= effectiveStock
            }
            onClick={() =>
              setQuantity((current) =>
                effectiveStock === undefined
                  ? current + 1
                  : Math.min(effectiveStock, current + 1),
              )
            }
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
        {minQty > 1 && (
          <p className="text-xs text-[#6B7280]">
            Minimum order quantity: {minQty}
            {product?.isWholesale ? " (wholesale)" : ""}
          </p>
        )}
      </div>

      {activeTier && (
        <p
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#4B5563]"
        >
          <span>
            <span className="font-semibold text-[#1F2937]">
              {formatMoney(unitPrice)}
            </span>{" "}
            / unit
          </span>
          {activeTier.savePercent > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-[#16A34A]">
              Save {Number(activeTier.savePercent.toFixed(1))}% (
              {formatMoney((basePrice - unitPrice) * quantity)} off)
            </span>
          )}
          <span aria-hidden="true" className="text-[#D1D5DB]">
            |
          </span>
          <span>
            Total{" "}
            <span className="font-semibold text-[#1F2937]">
              {formatMoney(unitPrice * quantity)}
            </span>
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 xl:w-[80%]">
        {wholesaleFee.required ? (
          <Link
            href={wholesaleFeePath}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary-color px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#7d391b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color sm:w-auto sm:min-w-48"
          >
            <Lock aria-hidden="true" className="size-4" />
            Pay wholesale fee to continue
          </Link>
        ) : (
          <button
            aria-live="polite"
            aria-label={
              isInCart
                ? `${product?.title} is already in your cart`
                : `Add ${quantity} item${quantity === 1 ? "" : "s"} to cart`
            }
            className={`min-h-12 w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color sm:w-auto sm:min-w-48 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              isInCart
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-secondary-color hover:bg-[#7d391b]"
            }`}
            disabled={outOfStock}
            onClick={handleAddToCart}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isInCart ? (
                <>
                  <CheckIcon aria-hidden="true" className="size-4" />
                  Already in Cart
                </>
              ) : (
                <>
                  <ShoppingCart aria-hidden="true" className="size-4" />
                  Add to Cart
                </>
              )}
            </span>
          </button>
        )}

        {product?.isWholesale ? (
          <p className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-center text-sm font-medium text-emerald-700">
            Wholesale pricing applied
          </p>
        ) : (
         
          ""
        )}

        {/* Marketplace links are only for wholesale customers. */}
        {product?.isWholesale && product.amazonUrl && (
          <a
            aria-label="Amazon Product"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#000000] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#240d03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color sm:w-auto sm:min-w-48"
            href={product.amazonUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Amazon Product
          </a>
        )}

        {product?.isWholesale && product.walmartUrl && (
          <a
            aria-label="Walmart Product"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4E7EC] px-4 text-center text-sm font-medium text-[#5D6470] transition hover:border-secondary-color hover:text-secondary-color"
            href={product.walmartUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Walmart Product
          </a>
        )}
      </div>
    </div>
  );
}
