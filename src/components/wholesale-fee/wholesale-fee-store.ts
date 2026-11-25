// Client-only store for the signed-in customer's wholesale fee state. Import
// it from Client Components only.
//
// The server is the source of truth: the Navbar reads `/users/my-profile` on
// every render and writes the result here through `WholesaleFeeStateSync`, and
// the fee pages write what `/wholesale-fee/*` returned. Client components such
// as "Add to cart" read it to swap in the "Pay wholesale fee" button.
import { useSyncExternalStore } from "react";

export type WholesaleFeeState = {
  required: boolean;
  /** USD, as the API reported it; null when unknown. */
  amount: number | null;
};

const notRequired: WholesaleFeeState = { required: false, amount: null };

let state = notRequired;
const listeners = new Set<() => void>();

export function setWholesaleFeeState(next: WholesaleFeeState) {
  const value = next.required ? next : notRequired;
  if (value.required === state.required && value.amount === state.amount) {
    return;
  }
  state = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Retail, existing wholesale and signed-out visitors always get `required: false`. */
export function useWholesaleFeeState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => notRequired,
  );
}
