"use client";

import { useState } from "react";
import { productImageFallback } from "@/lib/product-image";

export default function OrderThumbnail({
  image,
  alt,
}: {
  image: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !image || failed ? productImageFallback : image;

  return (
    <span className="relative inline-flex size-11 shrink-0 overflow-hidden rounded-lg bg-[#f5f6f7]">
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="size-full object-contain p-1"
      />
    </span>
  );
}
