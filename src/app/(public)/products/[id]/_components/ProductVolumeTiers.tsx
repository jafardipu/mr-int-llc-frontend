import type { ProductVolumeTier } from "@/services/products.service";

export default function ProductVolumeTiers({
  tiers,
}: {
  tiers: ProductVolumeTier[];
}) {
  if (tiers.length === 0) return null;

  return (
    <section aria-labelledby="volume-tiers-heading" className="mt-5">
      <h2
        id="volume-tiers-heading"
        className="text-sm font-semibold text-black/60"
      >
        Volume pricing
      </h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-[#E9E6DF]">
        <table className="min-w-full text-left text-sm text-[#4B5563]">
          <thead className="bg-[#F7F8FA] text-xs uppercase tracking-wide text-[#8A8D94]">
            <tr>
              <th className="px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">Discount</th>
              <th className="px-3 py-2 font-semibold">Unit price</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, index) => {
              const qtyLabel =
                typeof tier.maxQty === "number"
                  ? `${tier.minQty}–${tier.maxQty}`
                  : `${tier.minQty}+`;
              return (
                <tr key={`${tier.minQty}-${index}`} className="border-t border-[#E9E6DF]">
                  <td className="px-3 py-2">{qtyLabel}</td>
                  <td className="px-3 py-2">
                    {typeof tier.discountPercent === "number"
                      ? `${tier.discountPercent}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {typeof tier.unitPrice === "number"
                      ? `$${tier.unitPrice.toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
