"use server";

import { AuthApiError } from "@/actions/auth-request";
import {
  createPayment,
  type CreatePaymentResult,
} from "@/actions/payments.service";

type ActionResult<T> =
  | { status: "success"; message: string; data: T }
  | {
      status: "error";
      message: string;
      statusCode?: number;
      // Raw API error body; only sent to the browser outside production.
      details?: unknown;
    };

const exposeDetails = process.env.NODE_ENV !== "production";

function fail(error: unknown, fallback: string): ActionResult<never> {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof AuthApiError ? error.status : undefined;
  const details = error instanceof AuthApiError ? error.body : undefined;

  console.error(
    `[payment api error] status=${status ?? "n/a"} message=${message}`,
    details ?? "",
  );

  if (error instanceof AuthApiError) {
    return {
      status: "error",
      message: error.message,
      statusCode: error.status,
      ...(exposeDetails ? { details } : {}),
    };
  }
  return {
    status: "error",
    message: fallback,
    ...(exposeDetails ? { details: message } : {}),
  };
}

/**
 * Starts (or resumes) Stripe Checkout for an order. The caller must send the
 * browser to `checkoutUrl` with a full page navigation.
 */
export async function createPaymentAction(
  orderId: string,
): Promise<ActionResult<CreatePaymentResult>> {
  try {
    const result = await createPayment(orderId);
    return {
      status: "success",
      message: result.message,
      data: {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
        payment: result.payment,
      },
    };
  } catch (error) {
    return fail(error, "Unable to start payment. Please try again.");
  }
}
