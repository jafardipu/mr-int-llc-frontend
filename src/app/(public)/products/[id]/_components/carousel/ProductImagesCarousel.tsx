"use client";

import type { ImageProps } from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductPreviewImage } from "@/components/shared/product/ProductPreviewImage";
import { CarouselThumbs } from "./CarouselThumbs";
import "./carousel.css";

type ProductImage = {
  url: ImageProps["src"];
  alt: string;
};

type ProductImagesCarouselProps = {
  slides: ProductImage[];
  productHref?: string;
};

export default function ProductImagesCarousel({
  slides,
  productHref,
}: ProductImagesCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const zoomImageRef = useRef<HTMLImageElement | null>(null);
  const hasMultipleSlides = slides.length > 1;
  const selectedSlide = slides[selectedIndex];

  if (!selectedSlide) return null;

  const selectSlide = (index: number) => {
    setIsZoomed(false);
    setSelectedIndex((index + slides.length) % slides.length);
  };

  return (
    <section
      aria-label="Product images"
      aria-roledescription="carousel"
      className="embla min-w-0"
    >
      <div
        className={`embla__viewport${isZoomed ? " is-zoomed" : ""}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setIsZoomed(true);
        }}
        onPointerLeave={() => setIsZoomed(false)}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = Math.min(
            100,
            Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)
          );
          const y = Math.min(
            100,
            Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)
          );
          zoomImageRef.current?.style.setProperty("--zoom-x", `${x}%`);
          zoomImageRef.current?.style.setProperty("--zoom-y", `${y}%`);
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const movement = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(movement) > 40) {
            selectSlide(selectedIndex + (movement < 0 ? 1 : -1));
          }
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
      >
        <div className="embla__container">
          <div
            aria-label={`${selectedIndex + 1} of ${slides.length}`}
            className="embla__slide"
            role="group"
          >
            {productHref ? (
              <Link
                href={productHref}
                aria-label={`View ${selectedSlide.alt} product details`}
                className="absolute inset-0"
              >
                <ProductPreviewImage
                  alt={selectedSlide.alt}
                  className="embla__image h-full w-full object-contain p-5 sm:p-8"
                  fill
                  loading="eager"
                  ref={zoomImageRef}
                  sizes="(max-width: 1023px) 100vw, 48vw"
                  src={selectedSlide.url}
                />
              </Link>
            ) : (
              <ProductPreviewImage
                alt={selectedSlide.alt}
                className="embla__image h-full w-full object-contain p-5 sm:p-8"
                fill
                loading="eager"
                ref={zoomImageRef}
                sizes="(max-width: 1023px) 100vw, 48vw"
                src={selectedSlide.url}
              />
            )}
          </div>
        </div>
      </div>

      {hasMultipleSlides && (
        <>
          <button
            aria-label="Previous image"
            className="embla__arrow embla__arrow--previous"
            onClick={() => selectSlide(selectedIndex - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            aria-label="Next image"
            className="embla__arrow embla__arrow--next"
            onClick={() => selectSlide(selectedIndex + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>

          <div
            aria-label="Choose a product image"
            className="embla-thumbs"
            role="group"
          >
            {slides.map((slide, index) => (
              <CarouselThumbs
                alt={slide.alt}
                key={`thumbnail-${index}`}
                onClick={() => selectSlide(index)}
                selected={index === selectedIndex}
                src={slide.url}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
