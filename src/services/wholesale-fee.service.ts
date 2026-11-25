import "server-only";

import { redirect } from "next/navigation";
import { AuthApiError } from "@/actions/auth-request";
import { wholesaleFeePath } from "@/lib/wholesale-fee";
import { isRecord } from "@/services/api-response";
import { ApiRequestError, apiGet } from "@/services/api-service";

/** The fee object the API returns from login, verify-otp and /wholesale-fee/*. */
export interface WholesaleFee {
  /** True when the customer must pay before using the store. */
  required: boolean;
  /** null for accounts that never owed a fee. */
  status: "pending" | "paid" | null;
  /** USD, as the admin set it. Always show this; never send it back. */
  amount: number;
  currency: string;
  paidAt: string | null;
}

export interface WholesaleFeeInfo {
  enabled: boolean;
  amount: number;
  currency: string;
}

export function readWholesaleFee(value: unknown): WholesaleFee | null {
  if (
    !isRecord(value) ||
    typeof value.required !== "boolean" ||
    typeof value.amount !== "number" ||
    !Number.isFinite(value.amount)
  ) {
    return null;
  }

  return {
    required: value.required,
    status:
      value.status === "pending" || value.status === "paid"
        ? value.status
        : null,
    amount: value.amount,
    currency: typeof value.currency === "string" ? value.currency : "usd",
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
  };
}

/** True for the 402 the API returns while a wholesale account fee is unpaid. */
export function isWholesaleFeeRequiredError(error: unknown) {
  return (
    (error instanceof ApiRequestError || error instanceof AuthApiError) &&
    error.status === 402
  );
}

/**
 * For Server Components: call at the top of a `catch`. A 402 means the
 * account still owes its wholesale fee, so go to the payment page rather than
 * showing an error. The customer stays signed in.
 */
export function redirectIfWholesaleFeeRequired(error: unknown) {
  if (isWholesaleFeeRequiredError(error)) redirect(wholesaleFeePath);
}

function readData(result: unknown, resource: string) {
  if (!isRecord(result) || result.success !== true) {
    throw new ApiRequestError(`API returned an invalid response: /${resource}`, 500);
  }
  return {
    data: result.data,
    message: typeof result.message === "string" ? result.message : "",
  };
}

/** Public: whether new wholesale accounts pay a fee, and how much. */
export async function getWholesaleFeeInfo(): Promise<WholesaleFeeInfo> {
  const resource = "wholesale-fee/info";
  const { data } = readData(
    await apiGet(resource, { revalidate: 60, tags: ["store-prices"] }),
    resource,
  );

  if (
    !isRecord(data) ||
    typeof data.enabled !== "boolean" ||
    typeof data.amount !== "number" ||
    !Number.isFinite(data.amount)
  ) {
    throw new ApiRequestError(`API returned an invalid response: /${resource}`, 500);
  }

  return {
    enabled: data.enabled,
    amount: data.amount,
    currency: typeof data.currency === "string" ? data.currency : "usd",
  };
}

/** The signed-in wholesale account's fee. */
export async function getMyWholesaleFee(): Promise<WholesaleFee> {
  const resource = "wholesale-fee/me";
  const { data } = readData(await apiGet(resource, { auth: "required" }), resource);
  const fee = readWholesaleFee(data);
  if (!fee) {
    throw new ApiRequestError(`API returned an invalid response: /${resource}`, 500);
  }
  return fee;
}

/** Checks the Stripe session Stripe sent the customer back with. */
export async function confirmWholesaleFee(
  sessionId: string,
): Promise<{ fee: WholesaleFee; message: string }> {
  const resource = "wholesale-fee/confirm";
  const { data, message } = readData(
    await apiGet(resource, {
      auth: "required",
      searchParams: { session_id: sessionId },
    }),
    resource,
  );
  const fee = readWholesaleFee(data);
  if (!fee) {
    throw new ApiRequestError(`API returned an invalid response: /${resource}`, 500);
  }
  return { fee, message };
}
