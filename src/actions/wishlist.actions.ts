"use server";

import { AuthApiError } from "@/actions/auth-request";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist.service";
import { ApiRequestError } from "@/services/api-service";
import { collectPages } from "@/services/api-response";
import { getMyProfile } from "@/services/users.service";
import { getMyWishlist } from "@/services/wishlist.service";

export type WishlistActionResult = {
  status: "success" | "error";
  message: string;
  statusCode?: number;
  item?: { id: string; productId: string };
};

export type WishlistIndex = {
  isLoggedIn: boolean;
  canUse: boolean;
  items: Record<string, string>;
  message?: string;
};

function actionError(error: unknown, fallback: string): WishlistActionResult {
  if (error instanceof AuthApiError || error instanceof ApiRequestError) {
    return {
      status: "error",
      message: error.message,
      statusCode: error.status,
    };
  }

  return { status: "error", message: fallback };
}

export async function loadWishlistIndexAction(): Promise<WishlistIndex> {
  try {
    const profile = await getMyProfile();
    if (profile.role !== "retail" && profile.role !== "wholesale") {
      return { isLoggedIn: true, canUse: false, items: {} };
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return { isLoggedIn: false, canUse: true, items: {} };
    }
    if (error instanceof ApiRequestError && error.status === 403) {
      return {
        isLoggedIn: true,
        canUse: false,
        items: {},
        message: error.message,
      };
    }
  }

  try {
    const rows = await collectPages((page, limit) =>
      getMyWishlist({ page, limit, sort: "-createdAt" }),
    );
    const items: Record<string, string> = {};
    for (const row of rows) items[row.productId] = row.id;

    return { isLoggedIn: true, canUse: true, items };
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load your wishlist.";

    if (error instanceof ApiRequestError && error.status === 401) {
      return { isLoggedIn: false, canUse: true, items: {}, message };
    }
    if (error instanceof ApiRequestError && error.status === 403) {
      return { isLoggedIn: true, canUse: false, items: {}, message };
    }

    return { isLoggedIn: true, canUse: true, items: {}, message };
  }
}

export async function addToWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  try {
    const result = await addToWishlist(productId);
    return {
      status: "success",
      message: result.message,
      item: { id: result.item.id, productId: result.item.productId },
    };
  } catch (error) {
    return actionError(error, "Unable to add this product to your wishlist.");
  }
}

export async function removeFromWishlistAction(
  wishlistItemId: string,
): Promise<WishlistActionResult> {
  try {
    const result = await removeFromWishlist(wishlistItemId);
    return { status: "success", message: result.message };
  } catch (error) {
    return actionError(error, "Unable to remove this product from your wishlist.");
  }
}
