export type PendingPaymentSession = {
  orderId: string;
  orderNumber: string;
  amount: number;
  clientSecret: string;
  paymentIntentId: string;
};

const key = "mri-pending-payment";

export function savePendingPayment(session: PendingPaymentSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(session));
}

export function readPendingPayment(orderId: string): PendingPaymentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPaymentSession;
    if (parsed.orderId !== orderId) return null;
    if (!parsed.clientSecret || !parsed.paymentIntentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}
