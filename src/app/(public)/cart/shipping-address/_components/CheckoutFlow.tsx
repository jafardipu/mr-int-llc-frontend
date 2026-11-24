"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Lock, MapPin, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import {
  createAddressAction,
  deleteAddressAction,
  loadCheckoutCartAction,
  loadCheckoutSummaryAction,
  loadMyAddressesAction,
  placeOrderAction,
  syncCheckoutCartAction,
} from "@/actions/checkout.actions";
import { createPaymentAction } from "@/actions/payments.actions";
import type { Address } from "@/services/address.service";
import type { CheckoutSummary } from "@/services/orders.service";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import CountryStateCitySelector, {
  type ShippingAddressFormValues,
} from "@/components/ui/country-state-city-selector";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  removeFromCart,
  selectSelectedItems,
} from "@/redux/features/cartSlice";

const loginUrl = `/login?callbackUrl=${encodeURIComponent("/cart/shipping-address")}`;

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatAddress(address: Address) {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function CheckoutFlow() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const localSelected = useAppSelector(selectSelectedItems);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [cartEmpty, setCartEmpty] = useState(false);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [error, setError] = useState("");
  // Stays true from "Place order" until the browser leaves for Stripe, so the
  // button can't create a second order.
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShippingAddressFormValues>({
    mode: "onBlur",
    defaultValues: {
      country: "United States",
      state: "",
      city: "",
      streetAddress: "",
      zipCode: "",
    },
  });
  const [addressLine2, setAddressLine2] = useState("");
  // Unchecked keeps the current default. A user's first address is always
  // the default, so the checkbox is forced on when they have none.
  const [makeDefault, setMakeDefault] = useState(false);
  const isFirstAddress = addresses.length === 0;

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setLoading(true);
      setError("");

      // The server cart is what gets priced and checked out, so push the
      // locally selected lines to it first.
      const syncItems = localSelected.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const synced =
        syncItems.length > 0
          ? await syncCheckoutCartAction(syncItems)
          : await loadCheckoutCartAction();

      if (!active) return;

      if (synced.status === "error") {
        if (synced.statusCode === 401) setAuthRequired(true);
        else setSummaryError(synced.message);
        setLoading(false);
        return;
      }

      if (synced.data.itemCount <= 0) {
        setCartEmpty(true);
        setLoading(false);
        return;
      }

      const [summaryResult, addressResult] = await Promise.all([
        loadCheckoutSummaryAction(),
        loadMyAddressesAction(),
      ]);
      if (!active) return;

      if (
        (summaryResult.status === "error" && summaryResult.statusCode === 401) ||
        (addressResult.status === "error" && addressResult.statusCode === 401)
      ) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      if (summaryResult.status === "error") {
        setSummaryError(summaryResult.message);
      } else {
        setSummary(summaryResult.data);
      }

      if (addressResult.status === "error") {
        setError(addressResult.message);
      } else {
        setAddresses(addressResult.data);
        const defaultAddress =
          addressResult.data.find((address) => address.isDefault) ??
          addressResult.data[0];
        setSelectedAddressId(defaultAddress?.id ?? "");
        setShowAddressForm(addressResult.data.length === 0);
      }

      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
    // Sync once on mount from the local selected cart snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateAddress = handleSubmit((values) => {
    startTransition(async () => {
      setError("");
      const result = await createAddressAction({
        addressLine1: values.streetAddress,
        addressLine2: addressLine2.trim() || undefined,
        city: values.city,
        state: values.state,
        postalCode: values.zipCode,
        country: values.country,
        // The backend clears the previous default when this is true.
        isDefault: isFirstAddress || makeDefault,
      });

      if (result.status === "error") {
        if (result.statusCode === 401) {
          router.push(loginUrl);
          return;
        }
        setError(result.message);
        toast.error(result.message);
        return;
      }

      setAddresses((current) => {
        const next = result.data.isDefault
          ? current.map((address) => ({ ...address, isDefault: false }))
          : current;
        // Match the API order: default first, then newest (sort is stable).
        return [result.data, ...next].sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault),
        );
      });
      setSelectedAddressId(result.data.id);
      setShowAddressForm(false);
      reset({
        country: "United States",
        state: "",
        city: "",
        streetAddress: "",
        zipCode: "",
      });
      setAddressLine2("");
      setMakeDefault(false);
      toast.success(result.message);
    });
  });

  const onApplyPromo = () => {
    const code = promoInput.trim();
    if (!code) return;

    startTransition(async () => {
      setError("");
      const result = await loadCheckoutSummaryAction(code);
      if (result.status === "error") {
        if (result.statusCode === 401) {
          router.push(loginUrl);
          return;
        }
        // Keep the previous summary; just explain why the code didn't apply.
        setError(result.message);
        toast.error(result.message);
        return;
      }
      setSummary(result.data);
      setPromoInput(result.data.promoCode ?? "");
      toast.success(result.message);
    });
  };

  const onRemovePromo = () => {
    startTransition(async () => {
      setError("");
      const result = await loadCheckoutSummaryAction();
      if (result.status === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      setSummary(result.data);
      setPromoInput("");
    });
  };

  const onPlaceOrder = async () => {
    if (placingRef.current) return;
    if (!selectedAddressId) {
      setError("Select a shipping address to continue.");
      return;
    }
    if (!summary) return;

    placingRef.current = true;
    setPlacing(true);
    setError("");

    const result = await placeOrderAction({
      addressId: selectedAddressId,
      notes: notes.trim() || undefined,
      promoCode: summary.promoCode ?? undefined,
    });

    if (result.status === "error") {
      console.error("[checkout] place order failed", result);
      placingRef.current = false;
      setPlacing(false);
      if (result.statusCode === 401) {
        router.push(loginUrl);
        return;
      }
      setError(result.message);
      toast.error(result.message);
      return;
    }

    // Checkout emptied the server cart; drop the checked-out lines locally so
    // the cart badge matches. Unselected lines stay in the local cart.
    for (const item of localSelected) {
      dispatch(removeFromCart(item.id));
    }

    const orderUrl = `/user/orders/${encodeURIComponent(result.data.id)}`;
    const payment = await createPaymentAction(result.data.id);

    if (payment.status === "error") {
      // The order exists and can be paid later from its page ("Pay now").
      console.error("[checkout] start payment failed", payment);
      toast.error(
        `Order ${result.data.orderNumber} was placed, but payment could not be started: ${payment.message}`,
      );
      router.push(orderUrl);
      return;
    }

    toast.success("Order placed. Redirecting to secure payment…");
    // External Stripe-hosted page: full navigation, not the Next.js router.
    window.location.assign(payment.data.checkoutUrl);
  };

  if (authRequired) {
    return (
      <div className="rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center">
        <p className="text-sm text-[#4B5563]">
          Sign in with a verified retail or wholesale account to checkout.
        </p>
        <Link
          href={loginUrl}
          className="mt-4 inline-flex rounded-full bg-secondary-color px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading checkout" className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (cartEmpty) {
    return (
      <EmptyState
        icon={ShoppingBag}
        message="Your cart is empty. Add products before checkout."
        className="min-h-[40vh]"
      />
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center">
        <p role="alert" className="text-sm text-red-700">
          {summaryError || "Unable to load the checkout summary."}
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-flex rounded-full bg-secondary-color px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  const busy = pending || placing;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
      <div className="space-y-8">
        <header>
          <h1 className="text-xl font-bold text-[#132c45] sm:text-2xl">
            Shipping & Checkout
          </h1>
          <p className="mt-1 text-sm text-[#7b8493]">
            Choose a delivery address, apply a promo code, then place your order.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section aria-labelledby="shipping-address-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="shipping-address-heading"
              className="text-sm font-bold text-[#202a39]"
            >
              Shipping address
            </h2>
            <button
              type="button"
              onClick={() => setShowAddressForm((value) => !value)}
              className="text-xs font-semibold uppercase tracking-wide text-secondary-color"
            >
              {showAddressForm ? "Hide form" : "Add new address"}
            </button>
          </div>

          {addresses.length === 0 && !showAddressForm ? (
            <EmptyState
              icon={MapPin}
              message="No saved addresses yet."
              className="min-h-40"
            />
          ) : (
            <ul className="space-y-3">
              {addresses.map((address) => (
                <li key={address.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E1E5EA] bg-white p-4 transition hover:border-[#D4CEC8]">
                    <input
                      type="radio"
                      name="shipping-address"
                      className="mt-1"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#202a39]">
                          {address.addressLine1 || "Address"}
                        </span>
                        {address.isDefault && (
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-[#6B7280]">
                        {formatAddress(address)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600"
                      disabled={busy}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await deleteAddressAction(address.id);
                          if (result.status === "error") {
                            setError(result.message);
                            return;
                          }
                          setAddresses((current) =>
                            current.filter((item) => item.id !== address.id),
                          );
                          if (selectedAddressId === address.id) {
                            setSelectedAddressId("");
                          }
                        });
                      }}
                    >
                      Delete
                    </button>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {showAddressForm && (
            <form onSubmit={onCreateAddress} className="space-y-4 rounded-xl border border-[#E1E5EA] p-4">
              <CountryStateCitySelector
                control={control}
                register={register}
                setValue={setValue}
                errors={errors}
              />
              <div className="space-y-2">
                <label
                  htmlFor="addressLine2"
                  className="block text-xs font-medium text-[#273449]"
                >
                  Address line 2
                </label>
                <input
                  id="addressLine2"
                  value={addressLine2}
                  onChange={(event) => setAddressLine2(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#E1E5EA] bg-white px-4 text-sm outline-none focus:border-[#a45a1a]"
                />
              </div>
              <div>
                <label className="flex cursor-pointer items-start gap-3 has-disabled:cursor-default">
                  <input
                    type="checkbox"
                    checked={isFirstAddress || makeDefault}
                    disabled={isFirstAddress}
                    onChange={(event) => setMakeDefault(event.target.checked)}
                    aria-describedby="make-default-hint"
                    className="mt-0.5 size-4 accent-[#a45a1a]"
                  />
                  <span className="text-sm font-medium text-[#273449]">
                    Make this my default address
                  </span>
                </label>
                <p id="make-default-hint" className="mt-1 pl-7 text-xs text-[#6B7280]">
                  {isFirstAddress
                    ? "Your first address is saved as your default."
                    : "Leave unchecked to keep your current default address."}
                </p>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex h-11 w-full items-center justify-center rounded-full bg-[#a45a1a] px-5 text-xs font-bold uppercase text-white transition-colors hover:bg-[#8e4c15] disabled:opacity-60"
              >
                {pending ? "Saving..." : "Save address"}
              </button>
            </form>
          )}
        </section>

        <section aria-labelledby="order-notes-heading" className="space-y-2">
          <h2 id="order-notes-heading" className="text-sm font-bold text-[#202a39]">
            Order notes
          </h2>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional delivery notes"
            className="w-full rounded-xl border border-[#E1E5EA] bg-white px-4 py-3 text-sm outline-none focus:border-[#a45a1a]"
          />
        </section>
      </div>

      <aside className="h-fit rounded-2xl bg-[#F7F8F9] p-5 sm:p-6">
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#24231F]">
          Order summary
        </h2>

        <ul className="mt-4 space-y-3 border-b border-[#E9E9E7] pb-4">
          {summary.items.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 text-[#4B5563]">
                <span className="block truncate font-medium text-[#24231F]">
                  {item.name}
                </span>
                <span className="text-xs">
                  Qty {item.quantity} × {formatPrice(item.unitPrice)}
                </span>
              </span>
              <span className="font-semibold text-[#24231F]">
                {formatPrice(item.total)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Sub total</dt>
            <dd className="font-bold">{formatPrice(summary.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Shipping</dt>
            <dd className="font-bold">{formatPrice(summary.shippingFee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Tax</dt>
            <dd className="font-bold">{formatPrice(summary.tax)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">
              Discount{summary.promoCode ? ` (${summary.promoCode})` : ""}
            </dt>
            <dd className="font-bold text-emerald-600">
              -{formatPrice(summary.discount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[#E9E9E7] pt-3">
            <dt className="text-base font-medium text-[#55544F]">Total</dt>
            <dd className="text-base font-bold">{formatPrice(summary.total)}</dd>
          </div>
        </dl>

        {selectedAddress && (
          <p className="mt-4 text-xs text-[#6B7280]">
            Ship to: {formatAddress(selectedAddress)}
          </p>
        )}

        {summary.promoCode ? (
          <div className="mt-5 flex items-center justify-between gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-4 pr-1">
            <span className="text-xs font-semibold text-emerald-700">
              {summary.promoCode} applied
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={onRemovePromo}
              aria-label={`Remove promo code ${summary.promoCode}`}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[10px] font-bold uppercase text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              <X size={12} aria-hidden="true" />
              Remove
            </button>
          </div>
        ) : (
          <form
            className="mt-5 flex items-center gap-2 rounded-full border border-[#E8E7E3] bg-white p-1"
            onSubmit={(event) => {
              event.preventDefault();
              onApplyPromo();
            }}
          >
            <label className="sr-only" htmlFor="checkout-promo-code">
              Promo code
            </label>
            <input
              id="checkout-promo-code"
              value={promoInput}
              onChange={(event) => setPromoInput(event.target.value)}
              placeholder="Enter promo code"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-xs outline-none placeholder:text-[#AAA9A4]"
            />
            <button
              type="submit"
              disabled={busy || !promoInput.trim()}
              className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50"
            >
              Apply
            </button>
          </form>
        )}

        <button
          type="button"
          disabled={busy || !selectedAddressId}
          onClick={() => void onPlaceOrder()}
          className="mt-4 w-full rounded-full bg-secondary-color px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#5a3614] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {placing ? "Placing order..." : "Place order & pay"}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[#6B7280]">
          <Lock size={12} aria-hidden="true" />
          You&apos;ll pay securely on Stripe&apos;s checkout page.
        </p>
      </aside>
    </div>
  );
}
