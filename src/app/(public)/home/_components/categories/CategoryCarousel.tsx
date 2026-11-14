"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

export type CategoryCard = {
  id: string;
  name: string;
  image: string | null;
};

function CategoryCover({ image }: { image: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return <div className="h-full w-full bg-slate-300" aria-hidden="true" />;
  }

  return (
    <img
      src={image}
      alt=""
      onError={() => setFailed(true)}
      className="pointer-events-none h-full w-full object-cover transition-transform duration-500 hover:scale-105"
      draggable={false}
    />
  );
}

export default function CategoryCarousel({
  categories,
}: {
  categories: CategoryCard[];
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const updateScrollControls = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    setCanScrollBackward(carousel.scrollLeft > 1);
    setCanScrollForward(
      carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1,
    );
  };

  const scrollByCards = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const firstCard = carousel.firstElementChild;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? 160;
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 12;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    carousel.scrollBy({
      left: direction * (cardWidth + gap) * 2,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  };

  useEffect(() => {
    updateScrollControls();
  }, [categories]);

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

      const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 12;
      const step = firstCard.getBoundingClientRect().width + gap;
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      const nextPosition = carousel.scrollLeft + step;

      carousel.scrollTo({
        left: nextPosition >= maxScrollLeft - 1 ? 0 : nextPosition,
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

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) {
      draggedRef.current = true;
      carousel.scrollLeft = drag.scrollLeft - delta;
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (carousel?.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
    updateScrollControls();
    setIsPaused(false);
    if (draggedRef.current) {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    }
  };

  return (
      <div
        className="group relative mt-7 lg:mt-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
      >
        <button
          type="button"
          aria-label="Scroll to previous categories"
          disabled={!canScrollBackward}
          onClick={() => scrollByCards(-1)}
          className="absolute -left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>

        <div
          ref={carouselRef}
          className="flex touch-pan-y snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
          onScroll={updateScrollControls}
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
          aria-label="Product categories"
          tabIndex={0}
        >
          {categories.map((category) => (
            <Link
              aria-label={`Explore ${category.name} products`}
              className="relative aspect-[0.57/1] w-37 shrink-0 snap-start overflow-hidden bg-slate-200 sm:w-[calc((100%-36px)/4)] lg:w-[calc((100%-72px)/7)]"
              href={`/categories/${category.id}`}
              key={category.id}
              draggable={false}
            >
              <CategoryCover image={category.image} />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
              />
              <span className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-1 text-white">
                <span className="truncate text-sm font-semibold sm:text-base">
                  {category.name}
                </span>
                <span className="text-[9px] text-white/75 sm:text-xs">
                  Explore Products
                </span>
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll to next categories"
          disabled={!canScrollForward}
          onClick={() => scrollByCards(1)}
          className="absolute -right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-800 shadow-md transition-opacity disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
  );
}
