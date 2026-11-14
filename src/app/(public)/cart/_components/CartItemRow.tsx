import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/data/cart.data";

interface CartItemRowProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, change: number) => void;
  onItemChange: (item: CartItem) => void;
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
  onItemChange,
}: CartItemRowProps) {
  const productHref = item.productId ? `/products/${item.productId}` : null;
  const isMaxQuantity =
    item.stockCount !== undefined && item.quantity >= item.stockCount;

  return (
    <article className="grid grid-cols-[24px_72px_minmax(0,1fr)] items-center gap-3 border-b border-[#EEEDE9] py-4 sm:grid-cols-[24px_80px_minmax(0,1fr)_112px] sm:gap-4 sm:py-5">
      <button
        type="button"
        onClick={() => onItemChange({ ...item, selected: !item.selected })}
        aria-label={`${item.selected ? "Deselect" : "Select"} ${item.title}`}
        aria-pressed={item.selected}
        className={`flex size-4.5 cursor-pointer items-center justify-center rounded-full border ${
          item.selected
            ? "border-secondary-color bg-secondary-color text-white"
            : "border-[#D9D9D5] bg-white"
        }`}
      >
        {item.selected && <Check aria-hidden="true" className="size-3" />}
      </button>

      <div className="relative flex size-18 items-center justify-center rounded-md bg-[#F7F7F7] sm:size-20">
        {productHref ? (
          <Link
            href={productHref}
            className="relative block size-full cursor-pointer"
          >
            <Image
              src={item.image}
              alt={item.imageAlt || item.title}
              fill
              sizes="80px"
              className="object-contain p-2.5 transition hover:scale-105"
            />
          </Link>
        ) : (
          <Image
            src={item.image}
            alt={item.imageAlt || item.title}
            fill
            sizes="80px"
            className="object-contain p-2.5"
          />
        )}
      </div>

      <div className="min-w-0 self-center">
        {productHref ? (
          <Link
            href={productHref}
            className="hover:text-secondary-color transition-colors"
          >
            <h2 className="truncate text-sm font-semibold text-[#24231F] sm:text-base">
              {item.title}
            </h2>
          </Link>
        ) : (
          <h2 className="truncate text-sm font-semibold text-[#24231F] sm:text-base">
            {item.title}
          </h2>
        )}
        <p className="mt-1 text-xs text-[#A3A3A3] sm:text-sm">
          <span className="text-[#A3A3A3]">Color: </span>
          <span className="text-[#404040] font-medium">{item?.variant}</span>
        </p>
      </div>

      <div className="col-start-2 col-end-4 flex items-center justify-end gap-3 sm:col-start-4 sm:col-end-5 sm:flex-col sm:items-end sm:gap-2">
        <span className="text-lg font-bold text-[#171717]">
          {formatPrice(item.price * item.quantity)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.title}`}
            className="inline-flex cursor-pointer text-[#D4D4D4] transition-colors hover:text-rose-600"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
          <div
            aria-label={`Quantity ${item.quantity}`}
            className="flex items-center rounded-full bg-[#F5F5F5] text-sm text-[#262626]"
          >
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, -1)}
              disabled={item.quantity <= 1}
              aria-label={`Decrease ${item.title} quantity`}
              className="flex size-7 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="size-3" />
            </button>
            <span className="min-w-5 text-center font-semibold">
              {String(item.quantity).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.id, 1)}
              disabled={isMaxQuantity}
              aria-label={`Increase ${item.title} quantity`}
              className="flex size-7 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
