import Link from "next/link";
import { Star } from "lucide-react";
import { TProducts } from "@/types/products";
import FavoriteIcon from "@/components/utils/favorite-icon";
import { ProductPreviewImage } from "@/components/shared/product/ProductPreviewImage";

function formatPrice(value: number | string) {
  if (typeof value === "string") return value;

  return `$${value.toFixed(2)}`;
}

export default function ProductCard({
  id,
  image,
  imageAlt,
  category,
  title,
  price,
  originalPrice,
  rating = 0,
  href,
  badge,
  soldCount,
  stockCount,
  wishlistItemId,
}: TProducts & { wishlistItemId?: string }) {
  const safeRating = Math.min(5, Math.max(0, rating));

  const productImage = (
    <div className="relative aspect-[1.36/1] w-full">
      <ProductPreviewImage
        src={image}
        alt={imageAlt}
        fill
        sizes="(max-width: 639px) 45vw, 23vw"
        className="object-contain p-4 sm:p-5"
      />
    </div>
  );

  const productTitle = (
    <h2 className="line-clamp-2 min-h-7 text-base font-semibold leading-tight text-slate-800 md:text-lg ">
      {title}
    </h2>
  );

  return (
    <Link
      href={`/products/${id}`}
      className="flex h-full flex-col overflow-hidden rounded-md border border-[#E7EAEE] bg-[#F7F7F7] hover:border-primary-color hover:bg-[#e2e2e2]"
    >
      <div className="relative">
        {href ? (
          <Link href={href} aria-label={title}>
            {productImage}
          </Link>
        ) : (
          productImage
        )}

        {badge && (
          <span className="absolute left-3.5 top-3.5 rounded bg-[#267E0B] px-1.5 py-0.5 text-[11px] font-medium text-white">
            {badge}
          </span>
        )}

        <FavoriteIcon productId={id} wishlistItemId={wishlistItemId} />
      </div>

      <div className="flex flex-1 flex-col xl:p-6 lg:p-4 p-3  ">
        <p className="mb-1  leading-3 text-sm text-[#9CA3AF]">{category}</p>

        {href ? (
          <Link href={href} className="rounded-sm focus-visible:outline-2">
            {productTitle}
          </Link>
        ) : (
          productTitle
        )}

        <div
          role="img"
          className="mt-1.5 flex items-center gap-0.5 text-[#FBBF24] "
          aria-label={`${safeRating} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              aria-hidden="true"
              className="size-3.75"
              fill={index < Math.floor(safeRating) ? "currentColor" : "none"}
            />
          ))}
        </div>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="md:text-lg font-bold text-secondary-color">
            {formatPrice(price)}
          </span>
          {originalPrice !== undefined && (
            <span className="text-sm text-[#9CA3AF] line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {soldCount !== undefined && (
          <p className="mt-3  leading-3 text-[#9CA3AF]">
            Already sold:{" "}
            <span className="font-semibold text-[#4B5563]">
              {soldCount}
              {stockCount !== undefined && `/${stockCount}`}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
