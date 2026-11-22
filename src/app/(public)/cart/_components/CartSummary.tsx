import Link from "next/link";

interface CartSummaryProps {
  selectedItemCount: number;
  subtotal: number;
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

/**
 * Pre-checkout estimate from the local cart. Shipping, tax, promo codes and
 * the final total are priced by the server on the checkout page.
 */
export default function CartSummary({
  selectedItemCount,
  subtotal,
}: CartSummaryProps) {
  return (
    <aside aria-labelledby="cart-summary-title" className="h-fit">
      <h2
        id="cart-summary-title"
        className="mb-4 text-2xl font-extrabold uppercase tracking-wide text-[#24231F]"
      >
        Summary
      </h2>

      <div className="rounded-2xl bg-[#F7F8F9] p-5 sm:p-6">
        <dl className="space-y-4 text-sm sm:text-base">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#737373]">Total items</dt>
            <dd className="font-bold text-[#34332F]">
              {String(selectedItemCount).padStart(2, "0")}{" "}
              {selectedItemCount === 1 ? "Item" : "Items"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[#E9E9E7] pt-4">
            <dt className="text-xl font-medium text-[#55544F]">Sub total</dt>
            <dd className="text-base font-bold text-[#24231F]">
              {formatPrice(subtotal)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-[#737373]">
          Shipping, tax and promo codes are calculated at checkout.
        </p>
      </div>

      {selectedItemCount > 0 ? (
        <Link
          href="/cart/shipping-address"
          className="mt-4 block w-full rounded-full bg-secondary-color px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-white duration-300 hover:bg-[#5a3614]"
        >
          Checkout
        </Link>
      ) : (
        <button
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-full bg-secondary-color/50 px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-white"
        >
          Checkout
        </button>
      )}
    </aside>
  );
}
