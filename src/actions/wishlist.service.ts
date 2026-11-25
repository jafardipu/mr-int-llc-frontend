import "server-only";

import { authRequest } from "@/actions/auth-request";
import { parseWishlistItem } from "@/services/wishlist.service";

export async function addToWishlist(productId: string) {
  const result = await authRequest<unknown>(
    "/wishlist",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    },
    { auth: "required" },
  );

  return {
    message: result.message || "Added to wishlist successfully",
    item: parseWishlistItem(result.data),
  };
}

export async function removeFromWishlist(wishlistItemId: string) {
  const result = await authRequest<unknown>(
    `/wishlist/${encodeURIComponent(wishlistItemId)}`,
    { method: "DELETE" },
    { auth: "required" },
  );

  return {
    message: result.message || "Removed from wishlist successfully",
  };
}
