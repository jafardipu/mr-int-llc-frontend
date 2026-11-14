"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import BrandLogo from "@/app/(public)/shop-by-brand/_components/BrandLogo";

export type BrandCard = {
  id: string;
  name: string;
  image: string | null;
};

export default function BrandCarousel({ brands }: { brands: BrandCard[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const carousel = carouselRef.current;
      const firstCard = carousel?.firstElementChild;
      if (!carousel || !firstCard) return;

      const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 16;
      const step = firstCard.getBoundingClientRect().width + gap;
      const end = carousel.scrollWidth - carousel.clientWidth;
      const next = carousel.scrollLeft + step;

      carousel.scrollTo({
        left: next >= end - 1 ? 0 : next,
        behavior: "smooth",
      });
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const carousel = carouselRef.current;
    if (!carousel) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: carousel.scrollLeft,
    };
    draggedRef.current = false;
    carousel.setPointerCapture(event.pointerId);
    setIsPaused(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const carousel = carouselRef.current;
    if (!drag || !carousel || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) {
      draggedRef.current = true;
      carousel.scrollLeft = drag.scrollLeft - distance;
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (carousel?.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
    setIsPaused(false);
    if (draggedRef.current) {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    }
  };

  return (
    <div
      className="mt-7 lg:mt-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div
        ref={carouselRef}
        className="flex touch-pan-y snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none sm:gap-5 [&::-webkit-scrollbar]:hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={(event) => {
          if (draggedRef.current) {
            event.preventDefault();
            event.stopPropagation();
            draggedRef.current = false;
          }
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured brands"
        tabIndex={0}
      >
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/shop-by-brand/${brand.id}`}
            aria-label={`Shop ${brand.name} products`}
            className="flex h-18 w-42 shrink-0 snap-start items-center justify-center rounded-2xl border-2 border-[#e8e5e2] bg-white sm:h-22.5 sm:w-[calc((100%-40px)/3)] lg:w-[calc((100%-100px)/6)]"
            draggable={false}
          >
            <BrandLogo name={brand.name} image={brand.image} />
          </Link>
        ))}
      </div>
    </div>
  );
}
