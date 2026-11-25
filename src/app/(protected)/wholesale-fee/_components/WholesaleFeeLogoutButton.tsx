"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/client-session";
import { logout } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";

/** Same sign-out as the account sidebar. */
export default function WholesaleFeeLogoutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          dispatch(logout());
          router.push("/login");
          router.refresh();
        })
      }
      className="cursor-pointer text-sm font-medium text-[#6B7280] underline underline-offset-2 hover:text-[#24231F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-color disabled:cursor-wait"
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
