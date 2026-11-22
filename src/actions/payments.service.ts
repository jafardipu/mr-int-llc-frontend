import "server-only";

import { cookies } from "next/headers";
import {
  AuthApiError,
  authRequest,
  type ApiEnvelope,
} from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord } from "@/services/api-response";
import type { PaymentStatus } from "@/services/orders.service";

export type PaymentRecord = {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
};

/** Stripe Checkout Session for an order (Stripe-hosted payment page). */
export type CreatePaymentResult = {
  checkoutUrl: string;
  sessionId: string;
  payment: PaymentRecord | null;
};

function readPayment(value: unknown): PaymentRecord | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    orderId: typeof value.orderId === "string" ? value.orderId : "",
    amount: typeof value.amount === "number" ? value.amount : 0,
    status: typeof value.status === "string" ? value.status : "pending",
    transactionId:
      typeof value.transactionId === "string" ? value.transactionId : null,
    paymentMethod:
      typeof value.paymentMethod === "string" ? value.paymentMethod : null,
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
  };
}

function logApiError(endpoint: string, error: unknown) {
  console.error(`[${endpoint}] API error`, {
    status: error instanceof AuthApiError ? error.status : undefined,
    message: error instanceof Error ? error.message : String(error),
    body: error instanceof AuthApiError ? error.body : undefined,
  });
}

/**
 * Creates (or reuses) the order's Stripe Checkout Session. Fails for
 * cancelled or already paid orders, and with 409 while a payment is still
 * processing. Only call this from a user action, never from an effect.
 */
export async function createPayment(orderId: string) {
  const id = orderId.trim();
  if (!id) throw new AuthApiError("Order is required", 400);

  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) throw new AuthApiError("Please sign in again.", 401);

  let result: ApiEnvelope<unknown>;
  try {
    result = await authRequest<unknown>("/payments/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: id }),
    });
  } catch (error) {
    logApiError("payments/create", error);
    throw error;
  }

  const data = isRecord(result.data) ? result.data : null;
  const checkoutUrl =
    typeof data?.checkoutUrl === "string" && /^https?:\/\//.test(data.checkoutUrl)
      ? data.checkoutUrl
      : "";
  const sessionId = typeof data?.sessionId === "string" ? data.sessionId : "";

  if (!checkoutUrl) {
    console.error("[payments/create] response has no checkoutUrl", result.data);
    throw new AuthApiError("Payment response was invalid.", 500, result.data);
  }

  return {
    message: result.message || "Checkout session created",
    checkoutUrl,
    sessionId,
    payment: readPayment(data?.payment),
  } satisfies CreatePaymentResult & { message: string };
}

/**
 * Called by the /checkout/success page with Stripe's `session_id`. Public
 * endpoint (no token) and safe to call more than once. When the session is
 * paid the backend marks the payment `paid` and the order `processing`;
 * otherwise it returns the payment with its current status.
 */
export async function confirmPayment(sessionId: string) {
  const id = sessionId.trim();
  if (!id) throw new AuthApiError("Payment session id is required", 400);

  let result: ApiEnvelope<unknown>;
  try {
    result = await authRequest<unknown>(
      `/payments/confirm-payment?sessionId=${encodeURIComponent(id)}`,
      { method: "GET" },
    );
  } catch (error) {
    logApiError("payments/confirm-payment", error);
    throw error;
  }

  const payment = readPayment(result.data);
  const status =
    isRecord(result.data) && typeof result.data.status === "string"
      ? result.data.status
      : (payment?.status ?? "pending");

  return {
    message: result.message || "",
    status,
    payment,
  };
}
