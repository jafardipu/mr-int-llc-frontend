import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord } from "@/services/api-response";
import type { PaymentStatus } from "@/services/orders.service";

export type CreatePaymentInput = {
  orderId: string;
  paymentMethod?: "card";
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
};

export type CreatePaymentResult = {
  payment: PaymentRecord;
  clientSecret: string;
  paymentIntentId: string;
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

export async function createPayment(input: CreatePaymentInput) {
  const orderId = input.orderId.trim();
  if (!orderId) throw new AuthApiError("Order is required", 400);

  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) throw new AuthApiError("Please sign in again.", 401);

  const result = await authRequest<unknown>("/payments/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      paymentMethod: input.paymentMethod ?? "card",
    }),
  });

  if (!isRecord(result.data)) {
    throw new AuthApiError("Payment response was invalid.", 500);
  }

  const payment = readPayment(result.data.payment);
  const clientSecret =
    typeof result.data.clientSecret === "string"
      ? result.data.clientSecret
      : "";
  const paymentIntentId =
    typeof result.data.paymentIntentId === "string"
      ? result.data.paymentIntentId
      : "";

  if (!payment || !clientSecret || !paymentIntentId) {
    throw new AuthApiError("Payment response was invalid.", 500);
  }

  return {
    message: result.message || "Payment intent created successfully",
    payment,
    clientSecret,
    paymentIntentId,
  } satisfies CreatePaymentResult & { message: string };
}

export async function confirmPayment(paymentIntentId: string) {
  const intentId = paymentIntentId.trim();
  if (!intentId) {
    throw new AuthApiError("Payment intent id is required", 400);
  }

  const token = (await cookies()).get(accessTokenCookie)?.value;
  const result = await authRequest<unknown>(
    `/payments/confirm-payment?paymentIntentId=${encodeURIComponent(intentId)}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  return {
    message: result.message || "Payment confirmed successfully",
    data: result.data,
  };
}
