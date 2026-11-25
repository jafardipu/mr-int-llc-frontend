import "server-only";

import { ApiRequestError, apiGet } from "@/services/api-service";
import { isRecord, parseApiPage, type ApiPage } from "@/services/api-response";
import {
  isProduct,
  withBannerPricing,
  type Product,
} from "@/services/products.service";

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product | null;
}

export interface WishlistQuery {
  page?: number;
  limit?: number;
  sort?: "-createdAt" | "createdAt";
}

function readWishlistIdentity(value: unknown) {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.productId !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: typeof value.userId === "string" ? value.userId : "",
    productId: value.productId,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
  };
}

function isWishlistItem(value: unknown): value is WishlistItem {
  return readWishlistIdentity(value) !== null;
}

export function parseWishlistItem(value: unknown): WishlistItem {
  const identity = readWishlistIdentity(value);
  if (!identity || !isRecord(value)) {
    throw new ApiRequestError("The API returned an invalid wishlist item.", 500);
  }

  return {
    ...identity,
    product: isProduct(value.product) ? withBannerPricing(value.product) : null,
  };
}

export async function getMyWishlist(
  query: WishlistQuery = {},
): Promise<ApiPage<WishlistItem>> {
  const result = await apiGet<unknown>("wishlist", {
    searchParams: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sort: query.sort ?? "-createdAt",
    },
    auth: "required",
  });

  const page = parseApiPage(result, "wishlist", isWishlistItem);
  return {
    ...page,
    data: page.data.map((item) => parseWishlistItem(item)),
  };
}
