import type { OrderAddress } from "@/services/orders.service";

export default function ShippingAddressCard({
  address,
}: {
  address: OrderAddress | null;
}) {
  return (
    <section className="rounded-2xl border border-[#edf0f3] bg-white p-5 shadow-[0_1px_3px_rgba(27,39,58,0.05)] sm:p-6">
      <h2 className="text-base font-semibold text-[#374151]">
        Shipping Address
      </h2>
      {address ? (
        <address className="mt-4 space-y-1.5 text-sm not-italic leading-5 text-[#737b89]">
          {address.addressLine1 && (
            <p className="font-semibold text-[#374151]">{address.addressLine1}</p>
          )}
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {[address.city, address.state, address.postalCode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {address.country && <p>{address.country}</p>}
        </address>
      ) : (
        <p className="mt-4 text-sm text-[#9ca3af]">No shipping address on this order.</p>
      )}
    </section>
  );
}
