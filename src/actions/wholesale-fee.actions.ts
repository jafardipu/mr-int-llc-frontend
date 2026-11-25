"use server";

import { revalidatePath } from "next/cache";
import { AuthApiError } from "@/actions/auth-request";
import {
  createWholesaleFeeCheckout,
  type WholesaleFeeCheckout,
} from "@/actions/wholesale-fee.service";
import { ApiRequestError } from "@/services/api-service";
import {
  confirmWholesaleFee,
  getMyWholesaleFee,
  getWholesaleFeeInfo,
  type WholesaleFee,
  type WholesaleFeeInfo,
} from "@/services/wholesale-fee.service";

type ActionResult<T> =
  | { status: "success"; message: string; data: T }
  | { status: "error"; message: string; statusCode?: number };

function fail(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof AuthApiError || error instanceof ApiRequestError) {
    return {
      status: "error",
      message: error.message || fallback,
      statusCode: error.status,
    };
  }
  return { status: "error", message: fallback };
}

/** Public. Used by the sign-up form to describe the fee. */
export async function loadWholesaleFeeInfoAction(): Promise<
  ActionResult<WholesaleFeeInfo>
> {
  try {
    const info = await getWholesaleFeeInfo();
    return { status: "success", message: "", data: info };
  } catch (error) {
    return fail(error, "Unable to load the wholesale account fee.");
  }
}

export async function loadMyWholesaleFeeAction(): Promise<
  ActionResult<WholesaleFee>
> {
  try {
    const fee = await getMyWholesaleFee();
    return { status: "success", message: "", data: fee };
  } catch (error) {
    return fail(error, "Unable to load your wholesale account fee.");
  }
}

/** Only call from a click: each call creates a Stripe Checkout session. */
export async function startWholesaleFeeCheckoutAction(): Promise<
  ActionResult<WholesaleFeeCheckout>
> {
  try {
    const checkout = await createWholesaleFeeCheckout();
    return { status: "success", message: "", data: checkout };
  } catch (error) {
    return fail(error, "Unable to start the payment. Please try again.");
  }
}

export async function confirmWholesaleFeeAction(
  sessionId: string,
): Promise<ActionResult<WholesaleFee>> {
  if (!sessionId.trim()) {
    return {
      status: "error",
      message: "A valid session_id is required",
      statusCode: 400,
    };
  }

  try {
    const { fee, message } = await confirmWholesaleFee(sessionId);
    if (fee.status === "paid") {
      // Prices switch from retail to wholesale now. Drop every cached page
      // so nothing still shows retail prices or the "pay the fee" state.
      revalidatePath("/", "layout");
    }
    return { status: "success", message, data: fee };
  } catch (error) {
    return fail(error, "Unable to confirm the payment.");
  }
}
