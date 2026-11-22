"use client";

import { useState } from "react";
import { cn } from "cn";
import { productImageFallback } from "@/lib/product-image";

export default function OrderThumbnail({
  image,
  alt,
  className,
}: {
  image: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !image || failed ? productImageFallback : image;

  return (
    <span
      className={cn(
        "relative inline-flex size-11 shrink-0 overflow-hidden rounded-lg bg-[#f5f6f7]",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="size-full object-contain p-1"
      />
    </span>
  );
}
