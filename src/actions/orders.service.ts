import "server-only";

import { AuthApiError, authRequest } from "@/actions/auth-request";
import { readOrder, type Order } from "@/services/orders.service";

/**
 * Prices are calculated on the server; any price fields sent here would be
 * ignored, so only the address, notes and an applied promo code are sent.
 */
export type PlaceOrderInput = {
  addressId: string;
  notes?: string;
  promoCode?: string;
};

export type PlacedOrder = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "status"
  | "subtotal"
  | "shippingFee"
  | "tax"
  | "discount"
  | "total"
  | "promoCode"
>;

export async function placeOrder(input: PlaceOrderInput) {
  const addressId = input.addressId.trim();
  if (!addressId) throw new AuthApiError("Address is required", 400);

  const body: Record<string, string> = { addressId };
  if (input.notes?.trim()) body.notes = input.notes.trim();
  if (input.promoCode?.trim()) body.promoCode = input.promoCode.trim();

  const result = await authRequest<unknown>(
    "/orders/checkout",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { auth: "required" },
  );

  const order = readOrder(result.data);
  if (!order) {
    throw new AuthApiError("Order response was invalid.", 500, result.data);
  }

  return {
    message: result.message || "Order placed successfully",
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      promoCode: order.promoCode,
    } satisfies PlacedOrder,
  };
}

/** Cancels a `pending` (unpaid) order. Paid orders return 400. */
export async function cancelOrder(orderId: string) {
  const id = orderId.trim();
  if (!id) throw new AuthApiError("Order is required", 400);

  const result = await authRequest<unknown>(
    `/orders/${encodeURIComponent(id)}/cancel`,
    { method: "PATCH" },
    { auth: "required" },
  );

  return {
    message: result.message || "Order cancelled",
    order: readOrder(result.data),
  };
}
