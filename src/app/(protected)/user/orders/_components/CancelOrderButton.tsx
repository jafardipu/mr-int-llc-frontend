"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { cancelOrderAction } from "@/actions/orders.actions";
import { endClientSession } from "@/lib/client-session";
import { goToWholesaleFeeIfRequired } from "@/lib/wholesale-fee";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CancelOrderButton({
  orderId,
  orderNumber,
  className,
}: {
  orderId: string;
  orderNumber: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (result.status === "error") {
        if (goToWholesaleFeeIfRequired(result.statusCode)) return;
        if (result.statusCode === 401) {
          await endClientSession({
            message: result.message,
            callbackUrl: `/user/orders/${orderId}`,
          });
          return;
        }
        toast.error(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <AlertDialogTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-xl border border-[#fecaca] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626]",
          className,
        )}
      >
        Cancel Order
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel order {orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This order hasn&apos;t been paid yet. Cancelling it releases the
            reserved items and any promo code you used. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep order</AlertDialogCancel>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#dc2626] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? "Cancelling…" : "Cancel order"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
