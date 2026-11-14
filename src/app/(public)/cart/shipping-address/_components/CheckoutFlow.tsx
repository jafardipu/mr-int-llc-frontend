"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  createAddressAction,
  deleteAddressAction,
  loadCheckoutCartAction,
  loadMyAddressesAction,
  placeOrderAction,
  syncCheckoutCartAction,
  validatePromoCodeAction,
} from "@/actions/checkout.actions";
import type { PromoValidation } from "@/actions/promo-codes.service";
import type { Address } from "@/services/address.service";
import type { Cart } from "@/services/cart.service";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import CountryStateCitySelector, {
  type ShippingAddressFormValues,
} from "@/components/ui/country-state-city-selector";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearCart,
  selectSelectedItems,
} from "@/redux/features/cartSlice";

type CheckoutFlowProps = {
  shippingFee?: number;
  tax?: number;
};

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

export default function CheckoutFlow({
  shippingFee = 5,
  tax = 5,
}: CheckoutFlowProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const localSelected = useAppSelector(selectSelectedItems);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [error, setError] = useState("");

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

  const subtotal = cart?.subtotal ?? 0;
  const discount = promo?.discount ?? 0;
  const total = Math.max(subtotal + shippingFee + tax - discount, 0);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setLoading(true);
      setError("");

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
        if (synced.statusCode === 401) {
          setAuthRequired(true);
          setLoading(false);
          return;
        }
        setError(synced.message);
        setLoading(false);
        return;
      }

      setCart(synced.data);

      const addressResult = await loadMyAddressesAction();
      if (!active) return;

      if (addressResult.status === "error") {
        if (addressResult.statusCode === 401) {
          setAuthRequired(true);
          setLoading(false);
          return;
        }
        setError(addressResult.message);
        setLoading(false);
        return;
      }

      setAddresses(addressResult.data);
      const defaultAddress =
        addressResult.data.find((address) => address.isDefault) ??
        addressResult.data[0];
      setSelectedAddressId(defaultAddress?.id ?? "");
      setShowAddressForm(addressResult.data.length === 0);
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
    // Sync once on mount from the local selected cart snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!promo || !cart) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await validatePromoCodeAction({
          code: promo.code,
          subtotal: cart.subtotal,
        });
        if (result.status === "error") {
          setPromo(null);
          setError(result.message);
          return;
        }
        setPromo(result.data);
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cart?.subtotal, promo?.code]);

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
        isDefault: addresses.length === 0,
      });

      if (result.status === "error") {
        if (result.statusCode === 401) {
          router.push(
            `/login?callbackUrl=${encodeURIComponent("/cart/shipping-address")}`,
          );
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
        return [result.data, ...next];
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
      toast.success(result.message);
    });
  });

  const onApplyPromo = () => {
    startTransition(async () => {
      setError("");
      const result = await validatePromoCodeAction({
        code: promoInput,
        subtotal,
      });
      if (result.status === "error") {
        setPromo(null);
        setError(result.message);
        toast.error(result.message);
        return;
      }
      setPromo(result.data);
      setPromoInput(result.data.code);
      toast.success(result.message);
    });
  };

  const onPlaceOrder = () => {
    if (!selectedAddressId) {
      setError("Select a shipping address to continue.");
      return;
    }
    if (!cart || cart.itemCount <= 0) {
      setError("Cart is empty");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await placeOrderAction({
        addressId: selectedAddressId,
        notes: notes.trim() || undefined,
        shippingFee,
        tax,
        promoCode: promo?.code,
      });

      console.log(result);

      if (result.status === "error") {
        if (result.statusCode === 401) {
          router.push(
            `/login?callbackUrl=${encodeURIComponent("/cart/shipping-address")}`,
          );
          return;
        }
        setError(result.message);
        toast.error(result.message);
        return;
      }

      dispatch(clearCart());
      toast.success(result.message);
      router.push(`/user/orders/${result.data.id}`);
    });
  };

  if (authRequired) {
    return (
      <div className="rounded-2xl border border-[#E9E6DF] bg-white p-8 text-center">
        <p className="text-sm text-[#4B5563]">
          Sign in with a retail or wholesale account to checkout.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent("/cart/shipping-address")}`}
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

  if (!cart || cart.itemCount <= 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        message="Your cart is empty. Add products before checkout."
        className="min-h-[40vh]"
      />
    );
  }

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
                      disabled={pending}
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
              <button
                type="submit"
                disabled={pending}
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
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 text-[#4B5563]">
                <span className="block truncate font-medium text-[#24231F]">
                  {item.product?.name ?? "Product"}
                </span>
                <span className="text-xs">Qty {item.quantity}</span>
              </span>
              <span className="font-semibold text-[#24231F]">
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Sub total</dt>
            <dd className="font-bold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Est. Delivery</dt>
            <dd className="font-bold">{formatPrice(shippingFee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Taxes</dt>
            <dd className="font-bold text-rose-500">+{formatPrice(tax)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#737373]">Discount</dt>
            <dd className="font-bold text-emerald-600">
              -{formatPrice(discount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[#E9E9E7] pt-3">
            <dt className="text-base font-medium text-[#55544F]">Total</dt>
            <dd className="text-base font-bold">{formatPrice(total)}</dd>
          </div>
        </dl>

        {selectedAddress && (
          <p className="mt-4 text-xs text-[#6B7280]">
            Ship to: {formatAddress(selectedAddress)}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-full border border-[#E8E7E3] bg-white p-1">
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
            type="button"
            disabled={pending || !promoInput.trim()}
            onClick={onApplyPromo}
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

        <button
          type="button"
          disabled={pending || !selectedAddressId}
          onClick={onPlaceOrder}
          className="mt-4 w-full rounded-full bg-secondary-color px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#5a3614] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Placing order..." : "Place Order"}
        </button>
      </aside>
    </div>
  );
}
