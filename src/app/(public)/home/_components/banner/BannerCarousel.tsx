"use client";

import Container from "@/components/container/Container";
import Image from "next/image";
import Link from "next/link";
import { animate, motion, useMotionValue } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { bannerHref, bannerLinkLabel } from "@/lib/banner-links";
import type { Banner } from "@/services/banners.service";

const springTransition = {
  type: "spring" as const,
  stiffness: 220,
  damping: 30,
  mass: 0.9,
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const isSingle = banners.length === 1;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: number;
    startIndex: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [maxDrag, setMaxDrag] = useState(0);

  const snapToBanner = useCallback(
    (index: number, immediate = false) => {
      const track = trackRef.current;
      const firstSlide = track?.children.item(0) as HTMLElement | null;
      const slide = track?.children.item(index) as HTMLElement | null;

      if (!track || !firstSlide || !slide) return;

      const requestedOffset = slide.offsetLeft - firstSlide.offsetLeft;
      const targetOffset = Math.min(maxDrag, Math.max(0, requestedOffset));
      if (immediate) {
        animationRef.current?.stop();
        x.set(-targetOffset);
      } else {
        animationRef.current?.stop();
        animationRef.current = animate(x, -targetOffset, springTransition);
      }
      setActiveIndex(index);
    },
    [maxDrag, x],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const updateConstraints = () => {
      setMaxDrag(Math.max(0, track.scrollWidth - track.clientWidth));
    };

    updateConstraints();
    const resizeObserver = new ResizeObserver(updateConstraints);
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [banners.length]);

  useEffect(() => {
    if (
      banners.length <= 1 ||
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      snapToBanner((activeIndex + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, banners.length, isPaused, snapToBanner]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSingle) return;
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) return;

    suppressClickRef.current = false;
    animationRef.current?.stop();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: x.get(),
      startIndex: activeIndex,
    };
    // Don't capture the pointer here: a captured pointer retargets the
    // following click to the viewport, so a plain click never reaches the link.
    setIsPaused(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) < 5 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    const viewport = viewportRef.current;
    if (viewport && !viewport.hasPointerCapture(event.pointerId)) {
      viewport.setPointerCapture(event.pointerId);
    }
    suppressClickRef.current = true;
    setIsDragging(true);
    x.set(Math.min(0, Math.max(-maxDrag, drag.startOffset + deltaX)));
  };

  const finishPointerDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const drag = dragRef.current;
    const viewport = viewportRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (cancelled) {
      snapToBanner(drag.startIndex);
      setIsPaused(false);
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const slide = trackRef.current?.children.item(drag.startIndex) as
      | HTMLElement
      | null;
    const swipeThreshold = Math.max(32, (slide?.clientWidth ?? 0) * 0.06);

    let targetIndex = drag.startIndex;
    if (Math.abs(deltaX) >= swipeThreshold) {
      targetIndex += deltaX < 0 ? 1 : -1;
      suppressClickRef.current = true;
    }

    targetIndex = Math.min(banners.length - 1, Math.max(0, targetIndex));
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    snapToBanner(targetIndex, reducedMotion);
    setIsPaused(false);
  };

  return (
    <section
      aria-label="Featured banners"
      className="overflow-hidden pt-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <Container className="px-0!">
        <div
          ref={viewportRef}
          className={`touch-pan-y overflow-hidden px-4 md:px-8 xl:px-12 2xl:px-16 ${
            isSingle
              ? ""
              : isDragging
                ? "cursor-grabbing select-none"
                : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => finishPointerDrag(event)}
          onPointerCancel={(event) => finishPointerDrag(event, true)}
          role="region"
          aria-roledescription="carousel"
        >
          <motion.div
            ref={trackRef}
            className={`flex w-full ${isSingle ? "" : "gap-3 sm:gap-4"}`}
            style={{ x }}
          >
            {banners.map((banner, index) => {
              const href = bannerHref(banner);

              return (
                <article
                  key={banner.id}
                  className={`relative shrink-0 overflow-hidden rounded-md ${
                    isSingle
                      ? "h-56 w-full sm:h-80 lg:h-[26rem] xl:h-[30rem]"
                      : "aspect-[2.05/1] w-[88%] sm:w-[76%] lg:w-[72%]"
                  }`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${banners.length}`}
                >
                  <Image
                    src={banner.image}
                    alt={`Promotional banner ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes={
                      isSingle
                        ? "100vw"
                        : "(max-width: 640px) 88vw, (max-width: 1024px) 76vw, 72vw"
                    }
                    className="pointer-events-none object-cover"
                    draggable={false}
                  />
                  <Link
                    href={href}
                    className="absolute inset-0 z-10"
                    aria-label={bannerLinkLabel(banner, index)}
                    onClick={(event) => {
                      if (suppressClickRef.current) {
                        event.preventDefault();
                      }
                    }}
                    draggable={false}
                  />
                </article>
              );
            })}
          </motion.div>
        </div>

        {banners.length > 1 && (
          <div
            className="mt-3 flex justify-center gap-1.5"
            aria-label="Choose a banner"
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => snapToBanner(index)}
                aria-label={`Show banner ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`size-3 rounded-full transition-colors ${
                  activeIndex === index ? "bg-[#d7b98a]" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
