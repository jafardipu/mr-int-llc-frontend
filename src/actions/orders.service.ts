import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { readOrder, type Order } from "@/services/orders.service";

export type PlaceOrderInput = {
  addressId: string;
  notes?: string;
  shippingFee?: number;
  tax?: number;
  promoCode?: string;
  discount?: number;
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

  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) throw new AuthApiError("Please sign in again.", 401);

  const body: Record<string, string | number> = { addressId };
  if (input.notes?.trim()) body.notes = input.notes.trim();
  if (typeof input.shippingFee === "number") body.shippingFee = input.shippingFee;
  if (typeof input.tax === "number") body.tax = input.tax;
  if (input.promoCode?.trim()) {
    body.promoCode = input.promoCode.trim();
  } else if (typeof input.discount === "number") {
    body.discount = input.discount;
  }

  const result = await authRequest<unknown>("/orders/checkout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const order = readOrder(result.data);
  if (!order) {
    throw new AuthApiError("Order response was invalid.", 500);
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
