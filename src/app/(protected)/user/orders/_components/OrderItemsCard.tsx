import type { Order } from "@/services/orders.service";
import { orderItemCount } from "@/services/orders.service";
import OrderThumbnail from "./OrderThumbnail";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function OrderItemsCard({ order }: { order: Order }) {
  const count = orderItemCount(order);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#edf0f3] bg-white shadow-[0_1px_3px_rgba(27,39,58,0.05)]">
      <h2 className="border-b border-[#edf0f3] px-5 py-5 text-base font-semibold text-[#374151] sm:px-6">
        Order Items ({count})
      </h2>

      <div className="hidden grid-cols-[minmax(0,1fr)_90px_110px_110px] gap-3 border-b border-[#edf0f3] px-5 py-4 text-sm text-[#9ca3af] sm:grid sm:px-6">
        <span>Product</span>
        <span className="text-center">Quantity</span>
        <span className="text-right">Unit Price</span>
        <span className="text-right">Total</span>
      </div>

      <ul className="divide-y divide-[#f0f2f4]">
        {order.items.map((item) => {
          const image =
            item.product?.images.find((entry) => entry.isPrimary)?.url ??
            item.product?.images[0]?.url ??
            null;
          return (
            <li
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_90px_110px_110px] sm:gap-3 sm:px-5 sm:py-4 md:px-6"
            >
              <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                <OrderThumbnail image={image} alt={item.name} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#374151]">
                    {item.name}
                  </span>
                  {item.sku && (
                    <span className="mt-0.5 block text-xs text-[#9ca3af]">
                      SKU: {item.sku}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col sm:block sm:text-center">
                <span className="text-xs text-[#9ca3af] sm:hidden">Quantity</span>
                <span className="text-sm font-medium text-[#4b5563]">
                  {item.quantity}
                </span>
              </div>
              <div className="flex flex-col sm:block sm:text-right">
                <span className="text-xs text-[#9ca3af] sm:hidden">
                  Unit Price
                </span>
                <span className="text-sm text-[#64748b]">
                  {currency.format(item.unitPrice)}
                </span>
              </div>
              <div className="flex flex-col items-end sm:block sm:text-right">
                <span className="text-xs text-[#9ca3af] sm:hidden">Total</span>
                <span className="text-sm font-semibold text-[#374151]">
                  {currency.format(item.total)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-[#edf0f3] px-5 py-5 sm:ml-auto sm:max-w-[350px] sm:px-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-[#7b8493]">
            <dt>Subtotal</dt>
            <dd className="font-medium text-[#596273]">
              {currency.format(order.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-[#7b8493]">
            <dt>Shipping</dt>
            <dd className="font-medium text-[#596273]">
              {currency.format(order.shippingFee)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-[#7b8493]">
            <dt>Tax</dt>
            <dd className="font-medium text-[#596273]">
              {currency.format(order.tax)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-[#7b8493]">
            <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
            <dd className="font-medium text-[#ef4444]">
              -{currency.format(order.discount)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#e5e7eb] pt-3 text-base font-bold text-[#1f2937]">
            <dt>Total Amount</dt>
            <dd className="text-lg">{currency.format(order.total)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
