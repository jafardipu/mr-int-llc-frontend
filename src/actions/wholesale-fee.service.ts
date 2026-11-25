import "server-only";

import { AuthApiError, authRequest } from "@/actions/auth-request";

export interface WholesaleFeeCheckout {
  checkoutUrl: string;
  sessionId: string;
  amount: number;
  currency: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Starts a Stripe Checkout session for the one-time fee. No body: the
 * backend decides the amount. Only call this from a user action.
 */
export async function createWholesaleFeeCheckout(): Promise<WholesaleFeeCheckout> {
  const result = await authRequest<unknown>(
    "/wholesale-fee/checkout",
    { method: "POST" },
    { auth: "required" },
  );
  const data = result.data;

  if (
    !isRecord(data) ||
    typeof data.checkoutUrl !== "string" ||
    !/^https:\/\//.test(data.checkoutUrl)
  ) {
    throw new AuthApiError("The payment page could not be opened.", 502);
  }

  return {
    checkoutUrl: data.checkoutUrl,
    sessionId: typeof data.sessionId === "string" ? data.sessionId : "",
    amount: typeof data.amount === "number" ? data.amount : 0,
    currency: typeof data.currency === "string" ? data.currency : "usd",
  };
}
