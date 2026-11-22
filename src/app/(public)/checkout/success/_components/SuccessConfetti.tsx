"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

function fire() {
  const defaults = { startVelocity: 28, spread: 360, ticks: 70, zIndex: 80 };
  confetti({ ...defaults, particleCount: 70, origin: { x: 0.2, y: 0.35 } });
  confetti({ ...defaults, particleCount: 70, origin: { x: 0.8, y: 0.35 } });
  confetti({ ...defaults, particleCount: 90, origin: { x: 0.5, y: 0.25 } });
}

export default function SuccessConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fire();
    const timer = window.setTimeout(fire, 450);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
