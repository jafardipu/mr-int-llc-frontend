"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { validatePromoCodeAction } from "@/actions/checkout.actions";
import type { PromoValidation } from "@/actions/promo-codes.service";

interface CartSummaryProps {
  selectedItemCount: number;
  subtotal: number;
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function CartSummary({
  selectedItemCount,
  subtotal,
}: CartSummaryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const delivery = selectedItemCount > 0 ? 5 : 0;
  const taxes = selectedItemCount > 0 ? 5 : 0;
  const discount = promo?.discount ?? 0;
  const total = Math.max(subtotal + delivery + taxes - discount, 0);

  useEffect(() => {
    if (!promo) return;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await validatePromoCodeAction({
          code: promo.code,
          subtotal,
        });
        if (result.status === "error") {
          setPromo(null);
          toast.error(result.message);
          return;
        }
        setPromo(result.data);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [subtotal, promo?.code]);

  const applyPromo = () => {
    startTransition(async () => {
      const result = await validatePromoCodeAction({
        code: promoInput,
        subtotal,
      });
      if (result.status === "error") {
        setPromo(null);
        if (result.statusCode === 401) {
          toast.error("Sign in to apply a promo code.");
          router.push(
            `/login?callbackUrl=${encodeURIComponent("/cart")}`,
          );
          return;
        }
        toast.error(result.message);
        return;
      }
      setPromo(result.data);
      setPromoInput(result.data.code);
      toast.success(result.message);
    });
  };

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
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#737373]">Sub total</dt>
            <dd className="font-bold text-[#34332F]">
              {formatPrice(subtotal)}
            </dd>
          </div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <dt className="text-[#737373]">Est. Delivery</dt>
            <dd className="font-bold text-[#34332F]">
              {formatPrice(delivery)}
            </dd>
          </div>

          <div className="space-y-3 border-t border-[#E9E9E7] pt-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#737373]">Taxes</dt>
              <dd className="font-bold text-rose-500">+{formatPrice(taxes)}</dd>
            </div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <dt className="text-[#737373]">Discount</dt>
              <dd className="font-bold text-emerald-600">
                -{formatPrice(discount)}
              </dd>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#E9E9E7] pt-4">
            <dt className="text-xl font-medium text-[#55544F]">
              Final payment
            </dt>
            <dd className="text-base font-bold text-[#24231F]">
              {formatPrice(total)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-[#E8E7E3] bg-white p-1">
          <label className="sr-only" htmlFor="promo-code">
            Promo code
          </label>
          <input
            id="promo-code"
            value={promoInput}
            onChange={(event) => setPromoInput(event.target.value)}
            placeholder="Enter promo code"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-xs outline-none placeholder:text-[#AAA9A4]"
          />
          <button
            type="button"
            disabled={pending || !promoInput.trim() || selectedItemCount <= 0}
            onClick={applyPromo}
            className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {promo && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            {promo.code} applied (−{formatPrice(promo.discount)})
          </p>
        )}
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
