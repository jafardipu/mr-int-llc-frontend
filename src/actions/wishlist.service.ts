import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { parseWishlistItem } from "@/services/wishlist.service";

async function accessToken() {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) {
    throw new AuthApiError("Please sign in again.", 401);
  }
  return token;
}

export async function addToWishlist(productId: string) {
  const token = await accessToken();
  const result = await authRequest<unknown>("/wishlist", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });

  return {
    message: result.message || "Added to wishlist successfully",
    item: parseWishlistItem(result.data),
  };
}

export async function removeFromWishlist(wishlistItemId: string) {
  const token = await accessToken();
  const result = await authRequest<unknown>(
    `/wishlist/${encodeURIComponent(wishlistItemId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return {
    message: result.message || "Removed from wishlist successfully",
  };
}
