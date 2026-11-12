import type { ImageProps } from "next/image";

export const productImageFallback = "/image/product/headphones.jpg";

const rasterExtension = /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i;

export function isUnoptimizedProductImage(src: ImageProps["src"]) {
  return typeof src === "string" && !rasterExtension.test(src);
}
