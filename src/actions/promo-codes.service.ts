import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord } from "@/services/api-response";

export interface PromoValidation {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discount: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  expiresAt: string | null;
}

function readPromo(value: unknown): PromoValidation | null {
  if (
    !isRecord(value) ||
    typeof value.code !== "string" ||
    typeof value.discount !== "number"
  ) {
    return null;
  }

  return {
    code: value.code,
    discountType: value.discountType === "fixed" ? "fixed" : "percentage",
    discountValue:
      typeof value.discountValue === "number" ? value.discountValue : 0,
    discount: value.discount,
    minOrderAmount:
      typeof value.minOrderAmount === "number" ? value.minOrderAmount : 0,
    maxDiscount:
      typeof value.maxDiscount === "number"
        ? value.maxDiscount
        : value.maxDiscount === null
          ? null
          : null,
    expiresAt: typeof value.expiresAt === "string" ? value.expiresAt : null,
  };
}

export async function validatePromoCode(input: {
  code: string;
  subtotal?: number;
}) {
  const code = input.code.trim();
  if (!code) throw new AuthApiError("Promo code is required", 400);

  const token = (await cookies()).get(accessTokenCookie)?.value;
  const result = await authRequest<unknown>("/promo-codes/validate", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      ...(typeof input.subtotal === "number" ? { subtotal: input.subtotal } : {}),
    }),
  });

  const promo = readPromo(result.data);
  if (!promo) {
    throw new AuthApiError("Promo code response was invalid.", 500);
  }

  return {
    message: result.message || "Promo code is valid",
    promo,
  };
}
