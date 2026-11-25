// Shared by server and client code; keep this module free of React imports.

/** The payment page. Stripe returns to `/success` and `/cancel` under it. */
export const wholesaleFeePath = "/wholesale-fee";

/** HTTP status the API uses while a wholesale account fee is unpaid. */
export const wholesaleFeeRequiredStatus = 402;

/** "$20" for whole dollars, "$20.50" otherwise. */
export function formatFeeAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Client-side 402 handling for action results and API errors. A 402 is not
 * an auth failure: don't sign out, don't clear tokens, don't show an error
 * toast. Just send the customer to the payment page. Returns true when it did,
 * so the caller can stop.
 */
export function goToWholesaleFeeIfRequired(statusCode: number | undefined) {
  if (statusCode !== wholesaleFeeRequiredStatus) return false;
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith(wholesaleFeePath)
  ) {
    // Called from plain code too (the axios interceptor), where there is no
    // router. A full load is fine here: the payment page renders on the server.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(wholesaleFeePath);
  }
  return true;
}
