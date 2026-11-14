import "server-only";

import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord, parseApiItem } from "@/services/api-response";
import { ApiRequestError, apiGet } from "@/services/api-service";
import { isProduct, type Product } from "@/services/products.service";

const cartTag = "customer-cart";

export interface CartLineItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: Product | null;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartLineItem[];
  subtotal: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

function readCartItem(value: unknown): CartLineItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.productId !== "string" ||
    typeof value.quantity !== "number"
  ) {
    return null;
  }

  const product = value.product && isProduct(value.product) ? value.product : null;
  const unitPrice =
    typeof value.unitPrice === "number"
      ? value.unitPrice
      : product?.displayPrice ?? product?.retailPrice ?? 0;

  return {
    id: value.id,
    cartId: typeof value.cartId === "string" ? value.cartId : "",
    productId: value.productId,
    quantity: value.quantity,
    unitPrice,
    lineTotal:
      typeof value.lineTotal === "number"
        ? value.lineTotal
        : unitPrice * value.quantity,
    product,
  };
}

export function readCart(value: unknown): Cart | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const line = readCartItem(item);
        return line ? [line] : [];
      })
    : [];

  return {
    id: value.id,
    userId: typeof value.userId === "string" ? value.userId : "",
    items,
    subtotal:
      typeof value.subtotal === "number"
        ? value.subtotal
        : items.reduce((sum, item) => sum + item.lineTotal, 0),
    itemCount:
      typeof value.itemCount === "number"
        ? value.itemCount
        : items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

async function authHeaders() {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) {
    throw new ApiRequestError("Please sign in again.", 401);
  }
  return {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store" as const,
  };
}

export async function getMyCart(): Promise<Cart> {
  const result: unknown = await apiGet("cart", {
    tags: [cartTag],
    ...(await authHeaders()),
  });
  const cart = readCart(parseApiItem(result, "cart", isRecord));
  if (!cart) {
    throw new ApiRequestError("Unable to load cart.", 500);
  }
  return cart;
}
