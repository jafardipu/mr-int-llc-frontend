"use server";

import { AuthApiError } from "@/actions/auth-request";
import { cancelOrder } from "@/actions/orders.service";

type ActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; statusCode?: number };

/** Customer cancels their own `pending` (unpaid) order. */
export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const result = await cancelOrder(orderId);
    return { status: "success", message: result.message };
  } catch (error) {
    console.error(
      "[orders/cancel] API error",
      error instanceof Error ? error.message : String(error),
      error instanceof AuthApiError ? (error.body ?? "") : "",
    );

    if (error instanceof AuthApiError) {
      return {
        status: "error",
        message: error.message,
        statusCode: error.status,
      };
    }
    return { status: "error", message: "Unable to cancel this order." };
  }
}
