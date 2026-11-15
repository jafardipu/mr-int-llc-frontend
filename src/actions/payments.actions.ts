"use server";

import { AuthApiError } from "@/actions/auth-request";
import {
  confirmPayment,
  createPayment,
  type CreatePaymentInput,
  type CreatePaymentResult,
} from "@/actions/payments.service";

type ActionResult<T> =
  | { status: "success"; message: string; data: T }
  | { status: "error"; message: string; statusCode?: number };

function fail(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof AuthApiError) {
    return {
      status: "error",
      message: error.message,
      statusCode: error.status,
    };
  }
  return { status: "error", message: fallback };
}

export async function createPaymentAction(
  input: CreatePaymentInput,
): Promise<ActionResult<CreatePaymentResult>> {
  try {
    const result = await createPayment(input);
    return {
      status: "success",
      message: result.message,
      data: {
        payment: result.payment,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    };
  } catch (error) {
    return fail(error, "Unable to start payment. Please try again.");
  }
}

export async function confirmPaymentAction(
  paymentIntentId: string,
): Promise<ActionResult<unknown>> {
  try {
    const result = await confirmPayment(paymentIntentId);
    return {
      status: "success",
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    return fail(error, "Unable to confirm payment. Please try again.");
  }
}
