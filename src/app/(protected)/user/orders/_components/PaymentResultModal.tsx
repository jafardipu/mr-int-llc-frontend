"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PaymentResultModalProps = {
  open: boolean;
  variant: "success" | "failed";
  title: string;
  message: string;
  actionLabel?: string;
  onContinue: () => void;
};

function fireConfetti() {
  const defaults = {
    startVelocity: 28,
    spread: 360,
    ticks: 70,
    zIndex: 80,
  };

  confetti({
    ...defaults,
    particleCount: 70,
    origin: { x: 0.2, y: 0.35 },
  });
  confetti({
    ...defaults,
    particleCount: 70,
    origin: { x: 0.8, y: 0.35 },
  });
  confetti({
    ...defaults,
    particleCount: 90,
    origin: { x: 0.5, y: 0.25 },
  });
}

export default function PaymentResultModal({
  open,
  variant,
  title,
  message,
  actionLabel = "Continue",
  onContinue,
}: PaymentResultModalProps) {
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!open) return;

    let confettiTimer: number | undefined;
    if (variant === "success") {
      fireConfetti();
      confettiTimer = window.setTimeout(fireConfetti, 450);
    }

    const redirectTimer = window.setTimeout(() => {
      onContinueRef.current();
    }, 2800);

    return () => {
      if (confettiTimer) window.clearTimeout(confettiTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [open, variant]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onContinue();
      }}
    >
      <AlertDialogContent className="max-w-md text-center sm:text-center">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          {variant === "success" ? (
            <CheckCircle2
              aria-hidden="true"
              className="size-14 text-[#16a34a]"
              strokeWidth={1.5}
            />
          ) : (
            <XCircle
              aria-hidden="true"
              className="size-14 text-[#dc2626]"
              strokeWidth={1.5}
            />
          )}
          <AlertDialogTitle className="text-xl font-bold text-[#111827] sm:text-2xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-[#6B7280]">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex flex-col sm:justify-center">
          <AlertDialogAction
            onClick={onContinue}
            className={
              variant === "success"
                ? "bg-[#995618] text-white hover:bg-[#7a4513]"
                : "bg-[#374151] text-white hover:bg-[#1f2937]"
            }
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
