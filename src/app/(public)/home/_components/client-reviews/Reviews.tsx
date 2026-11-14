"use client";

import Container from "@/components/container/Container";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import { animate, motion, useMotionValue } from "motion/react";
import {  Star } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { QuoteIcon } from "@/icons";

const reviews = [
  {
    name: "Wade Warren",
    role: "Legacy Integration Producer",
    initials: "WW",
    avatarColor: "bg-[#d8b7a0]",
    review:
      "If you want real marketing that works and effective implementation - mobile app's got you covered.",
  },
  {
    name: "Darlene Robertson",
    role: "Legacy Integration Producer",
    initials: "DR",
    avatarColor: "bg-[#d4c5b0]",
    review:
      "A fantastic shopping experience with excellent products and reliable delivery every time.",
  },
  {
    name: "Stephen Brekke",
    role: "Legacy Integration Producer",
    initials: "SB",
    avatarColor: "bg-[#b6c2a1]",
    review:
      "If you want real marketing that works and effective implementation - mobile app's got you covered.",
  },
  {
    name: "Esther Howard",
    role: "Business Owner",
    initials: "EH",
    avatarColor: "bg-[#c6a8a0]",
    review:
      "The wholesale selection and support team have made it easy to grow our business.",
  },
  {
    name: "Robert Fox",
    role: "Verified Customer",
    initials: "RF",
    avatarColor: "bg-[#a9bac0]",
    review:
      "Great value, quality products, and a smooth ordering process from start to finish.",
  },
];

const transition = {
  type: "spring" as const,
  stiffness: 240,
  damping: 30,
  mass: 0.9,
};

export default function Reviews() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: number;
  } | null>(null);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const getSlideOffset = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const slide = track?.children.item(index) as HTMLElement | null;

    if (!viewport || !slide) return 0;

    return slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2;
  }, []);

  const snapToReview = useCallback(
    (index: number, immediate = false) => {
      const boundedIndex = Math.max(0, Math.min(reviews.length - 1, index));
      const targetOffset = getSlideOffset(boundedIndex);
      animationRef.current?.stop();

      if (immediate) {
        x.set(-targetOffset);
      } else {
        animationRef.current = animate(x, -targetOffset, transition);
      }

      setActiveIndex(boundedIndex);
    },
    [getSlideOffset, x],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    snapToReview(activeIndex, true);
    const resizeObserver = new ResizeObserver(() => {
      snapToReview(activeIndex, true);
    });
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    return () => {
      resizeObserver.disconnect();
      animationRef.current?.stop();
    };
  }, [activeIndex, snapToReview]);

  useEffect(() => {
    if (isDragging || isHovered || hasFocus) return;

    const intervalId = window.setInterval(() => {
      snapToReview((activeIndex + 1) % reviews.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, hasFocus, isDragging, isHovered, snapToReview]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    animationRef.current?.stop();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: x.get(),
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) < 5 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    setIsDragging(true);
    x.set(drag.startOffset + deltaX);
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const deltaX = event.clientX - drag.startX;
    const swipeThreshold = Math.max(36, event.currentTarget.clientWidth * 0.08);
    if (Math.abs(deltaX) >= swipeThreshold) {
      snapToReview(activeIndex + (deltaX < 0 ? 1 : -1));
      return;
    }

    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const nearestIndex = Array.from(track.children).reduce(
      (closestIndex, child, index) => {
        const slide = child as HTMLElement;
        const center =
          slide.offsetLeft +
          slide.offsetWidth / 2 +
          x.get() -
          viewport.clientWidth / 2;
        const closestSlide = track.children.item(closestIndex) as HTMLElement;
        const closestCenter =
          closestSlide.offsetLeft +
          closestSlide.offsetWidth / 2 +
          x.get() -
          viewport.clientWidth / 2;

        return Math.abs(center) < Math.abs(closestCenter)
          ? index
          : closestIndex;
      },
      0,
    );

    snapToReview(nearestIndex);
  };

  return (
    <section aria-label="Customer reviews">
      <Container>
        <PageSectionTitle
          title="Hear From Our Users"
          subTitle="Real stories from customers who shop with us."
        />

          <div
            className="mt-8 sm:mt-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocusCapture={() => setHasFocus(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setHasFocus(false);
              }
            }}
          >
          <div
            ref={viewportRef}
            className={`touch-pan-y overflow-hidden ${
              isDragging ? "cursor-grabbing select-none" : "cursor-grab"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            role="region"
            aria-label="Customer review carousel"
            aria-roledescription="carousel"
          >
            <motion.div
              ref={trackRef}
              className="flex w-full items-center"
              style={{ x }}
            >
              {reviews.map((review, index) => {
                const isActive = index === activeIndex;

                return (
                  <article
                    key={review.name}
                    className={`flex h-62.5 w-full shrink-0 items-center justify-center py-4 transition-[transform,opacity] duration-300 sm:h-57.5 md:w-1/3 ${
                      isActive
                        ? "z-10 scale-100 opacity-100"
                        : "scale-[0.82] opacity-55"
                    }`}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${reviews.length}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <div
                      className={`relative flex w-full flex-col justify-between rounded-2xl border border-[#f0e8df] bg-white px-5 pb-5 pt-8 shadow-[0_18px_50px_rgba(126,73,35,0.12)] transition-[height,box-shadow] duration-300 sm:px-6 ${
                        isActive
                          ? "h-51 sm:h-47.5 sm:shadow-[0_24px_60px_rgba(126,73,35,0.18)]"
                          : "h-43.5 sm:h-37.5"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-5 left-5 flex size-10 items-center justify-center rounded-full bg-[#f4e7d4] text-3xl font-bold leading-none text-[#984a17]"
                        >
                          <QuoteIcon  />
                        </span>
                      )}

                      <p
                        className={`line-clamp-3 lg:text-base leading-[1.4] text-black text-sm ${
                          isActive ? "" : "text-slate-500"
                        }`}
                      >
                        {review.review}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${review.avatarColor}`}
                          >
                            {review.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#222] sm:text-sm">
                              {review.name}
                            </p>
                            <p className="truncate text-[10px] leading-tight text-[#505050] sm:text-[10px]">
                              {review.role}
                            </p>
                          </div>
                        </div>
                        <div
                          role="img"
                          aria-label="5 out of 5 stars"
                          className="flex shrink-0 gap-0.5 text-amber-400"
                        >
                          {Array.from({ length: 5 }, (_, starIndex) => (
                            <Star
                              key={starIndex}
                              aria-hidden="true"
                              className="size-3.5 sm:size-4"
                              fill="currentColor"
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          </div>

          <div className="mt-3 flex justify-center gap-1.5" aria-label="Choose a review">
            {reviews.map((review, index) => (
              <button
                key={review.name}
                type="button"
                onClick={() => snapToReview(index)}
                aria-label={`Show review ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`size-2.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#984a17] ${
                  activeIndex === index ? "bg-[#984a17]" : "bg-[#e5e2df]"
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
