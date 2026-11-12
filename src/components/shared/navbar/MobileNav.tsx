"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import { navLinks } from "./NavLinks";

export default function MobileNav({
  user,
}: {
  user?: { name: string; profile: string | null } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-md text-[#24231f] transition-colors hover:bg-[#f4eddf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent aria-labelledby="mobile-navigation-title">
        <div className="flex items-center justify-between border-b border-[#e9e6df] pb-4">
          <SheetTitle id="mobile-navigation-title" className="text-lg font-semibold">
            Menu
          </SheetTitle>
          <SheetClose
            aria-label="Close navigation menu"
            className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-[#f4eddf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>

        <nav aria-label="Mobile navigation" className="flex flex-col py-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`border-b border-[#f1efeb] px-2 py-3.5 text-base font-medium transition-colors hover:text-[#99512f] ${
                  isActive ? "text-[#99512f]" : "text-[#24231f]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t border-[#e9e6df] pt-5">
          <p className="text-sm font-semibold text-[#F43F5E]">Amazing Deals</p>
          {user ? (
            <Link
              href="/user/profile"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center gap-3 rounded-md bg-primary-color px-4 font-medium text-secondary-color transition-colors hover:brightness-95"
            >
              <UserAvatar name={user.name} src={user.profile} className="size-8 text-xs" />
              My profile
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center rounded-md bg-primary-color px-4 font-medium text-secondary-color transition-colors hover:brightness-95"
            >
              Log In
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}