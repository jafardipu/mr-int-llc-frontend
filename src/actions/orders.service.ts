import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord } from "@/services/api-response";

export type PlaceOrderInput = {
  addressId: string;
  notes?: string;
  shippingFee?: number;
  tax?: number;
  promoCode?: string;
  discount?: number;
};

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  promoCode: string | null;
}

function readOrder(value: unknown): PlacedOrder | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    orderNumber:
      typeof value.orderNumber === "string" ? value.orderNumber : value.id,
    status: typeof value.status === "string" ? value.status : "pending",
    subtotal: typeof value.subtotal === "number" ? value.subtotal : 0,
    shippingFee: typeof value.shippingFee === "number" ? value.shippingFee : 0,
    tax: typeof value.tax === "number" ? value.tax : 0,
    discount: typeof value.discount === "number" ? value.discount : 0,
    total: typeof value.total === "number" ? value.total : 0,
    promoCode: typeof value.promoCode === "string" ? value.promoCode : null,
  };
}

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
    order,
  };
}
