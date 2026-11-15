"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/authSlice";

const buttonClassName =
  "mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#F4E7D1] px-7 text-xs font-medium text-[#4A3928] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70";

type WholesaleBannerCtaButtonProps = {
  mode: "products" | "sign-up" | "logout-then-sign-up";
  label?: string;
};

export default function WholesaleBannerCtaButton({
  mode,
  label = "Explore Wholesale",
}: WholesaleBannerCtaButtonProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pending, setPending] = useState(false);

  if (mode === "products") {
    return (
      <Link href="/products" className={buttonClassName}>
        {label}
      </Link>
    );
  }

  if (mode === "sign-up") {
    return (
      <Link href="/sign-up" className={buttonClassName}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClassName}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          await logoutAction();
          dispatch(logout());
          router.push("/sign-up");
          router.refresh();
        } catch {
          router.push("/sign-up");
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}
