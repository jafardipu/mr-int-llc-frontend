import "server-only";

import { AuthApiError, authRequest } from "@/actions/auth-request";
import { isRecord, parseApiItem } from "@/services/api-response";
import { getMyCart, readCart, type Cart } from "@/services/cart.service";

function parseCart(result: { data: unknown }, resource: string): Cart {
  const cart = readCart(parseApiItem(result, resource, isRecord));
  if (!cart) throw new AuthApiError("Unable to load cart.", 500);
  return cart;
}

function isDuplicateError(error: unknown) {
  return (
    error instanceof AuthApiError &&
    error.status === 400 &&
    /duplicate/i.test(error.message)
  );
}

export async function addToCart(productId: string, quantity = 1) {
  const result = await authRequest<unknown>(
    "/cart",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    },
    { auth: "required" },
  );

  return {
    message: result.message || "Added to cart successfully",
    cart: parseCart(result, "cart"),
  };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const result = await authRequest<unknown>(
    `/cart/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
    { auth: "required" },
  );

  return {
    message: result.message || "Cart updated successfully",
    cart: parseCart(result, "cart"),
  };
}

export async function removeCartItem(itemId: string) {
  const result = await authRequest<unknown>(
    `/cart/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
    { auth: "required" },
  );

  return {
    message: result.message || "Removed from cart successfully",
    cart: parseCart(result, "cart"),
  };
}

async function setCartItemQuantity(
  productId: string,
  quantity: number,
  cart: Cart,
) {
  const existing = cart.items.find((line) => line.productId === productId);
  if (existing) {
    if (existing.quantity === quantity) return cart;
    return (await updateCartItem(existing.id, quantity)).cart;
  }

  try {
    const added = await addToCart(productId, quantity);
    const line = added.cart.items.find((item) => item.productId === productId);
    if (line && line.quantity !== quantity) {
      return (await updateCartItem(line.id, quantity)).cart;
    }
    return added.cart;
  } catch (error) {
    if (!isDuplicateError(error)) throw error;

    const latest = await getMyCart();
    const line = latest.items.find((item) => item.productId === productId);
    if (!line) throw error;
    if (line.quantity === quantity) return latest;
    return (await updateCartItem(line.id, quantity)).cart;
  }
}

let syncInFlight: Promise<{ cart: Cart }> | null = null;
let syncInFlightKey = "";

export async function syncCartItems(
  items: Array<{ productId: string; quantity: number }>,
) {
  const desiredEntries = [
    ...new Map(
      items
        .filter((item) => item.productId)
        .map((item) => [
          item.productId,
          Math.max(1, Math.floor(item.quantity || 1)),
        ]),
    ).entries(),
  ].sort(([a], [b]) => a.localeCompare(b));
  const key = JSON.stringify(desiredEntries);

  if (syncInFlight && syncInFlightKey === key) {
    return syncInFlight;
  }

  syncInFlightKey = key;
  syncInFlight = (async () => {
    let cart = await getMyCart();
    const desired = new Map(desiredEntries);

    for (const line of [...cart.items]) {
      if (!desired.has(line.productId)) {
        cart = (await removeCartItem(line.id)).cart;
      }
    }

    for (const [productId, quantity] of desired) {
      cart = await getMyCart();
      cart = await setCartItemQuantity(productId, quantity, cart);
    }

    return { cart: await getMyCart() };
  })().finally(() => {
    if (syncInFlightKey === key) {
      syncInFlight = null;
      syncInFlightKey = "";
    }
  });

  return syncInFlight;
}
