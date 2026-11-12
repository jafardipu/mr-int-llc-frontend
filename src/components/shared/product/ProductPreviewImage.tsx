"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState, type Ref } from "react";
import {
  isUnoptimizedProductImage,
  productImageFallback,
} from "@/lib/product-image";

type ProductPreviewImageProps = ImageProps & {
  ref?: Ref<HTMLImageElement>;
};

export function ProductPreviewImage({
  src,
  alt,
  onError,
  ref,
  ...props
}: ProductPreviewImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || productImageFallback);

  useEffect(() => {
    setCurrentSrc(src || productImageFallback);
  }, [src]);

  return (
    <Image
      {...props}
      alt={alt}
      ref={ref}
      src={currentSrc || productImageFallback}
      unoptimized={isUnoptimizedProductImage(currentSrc)}
      onError={(event) => {
        onError?.(event);
        setCurrentSrc((current) =>
          current === productImageFallback ? current : productImageFallback,
        );
      }}
    />
  );
}
