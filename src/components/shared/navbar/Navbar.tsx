import { Suspense } from "react";
import { cookies } from "next/headers";
import Container from "@/components/container/Container";
import logo from "@/assets/logo.png";
import Image from "next/image";
import NavLinks from "./NavLinks";
import Link from "next/link";
import CartIcon from "./CartIcon";
import MobileNav from "./MobileNav";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { ApiRequestError } from "@/services/api-service";
import { getMyProfile } from "@/services/users.service";
import { Skeleton } from "@/components/ui/skeleton";

async function currentUser() {
  const accessToken = (await cookies()).get(accessTokenCookie)?.value;
  if (!accessToken) return null;

  try {
    const profile = await getMyProfile();
    return { name: profile.name, profile: profile.profile };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null;
    return { name: "Account", profile: null };
  }
}

function LoginLink() {
  return (
    <Link
      className="cursor-pointer rounded-full bg-primary-color px-5 py-1.5 text-secondary-color transition-all duration-300 hover:font-medium"
      href="/login"
    >
      Log In
    </Link>
  );
}

function ProfileLink({
  user,
  className,
}: {
  user: { name: string; profile: string | null };
  className: string;
}) {
  return (
    <Link
      href="/user/profile"
      aria-label={`${user.name} profile`}
      className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
    >
      <UserAvatar name={user.name} src={user.profile} className={className} />
    </Link>
  );
}

async function DesktopAccount() {
  const user = await currentUser();
  return user ? (
    <ProfileLink user={user} className="size-10 text-sm" />
  ) : (
    <LoginLink />
  );
}

async function MobileAccount() {
  const user = await currentUser();
  return (
    <>
      {user && <ProfileLink user={user} className="size-10 text-xs" />}
      <MobileNav user={user} />
    </>
  );
}

export default function Navbar() {
  return (
    <div className="border-b-[1.5px] border-[#F3F4F6] py-2.5 xl:py-4.5">
      <Container className="flex w-full max-w-[1766px] items-center justify-between gap-3 sm:gap-5">
        <div className="flex min-w-0 items-center gap-3 xl:gap-5 2xl:gap-8">
          <Link href="/">
            <Image
              src={logo}
              alt="MR International"
              width={100}
              height={100}
              className="h-14 w-12 object-contain sm:h-16 sm:w-14 xl:h-20 xl:w-36"
            />
          </Link>
          <Suspense fallback={<nav aria-hidden="true" className="hidden xl:flex" />}>
            <NavLinks />
          </Suspense>
        </div>
        <div className="hidden shrink-0 items-center gap-4 xl:flex">
          <Link href="/home#deal">
            <h6 className="cursor-pointer text-lg font-semibold text-[#F43F5E] transition-all duration-300 hover:scale-95">
              Amazing Deals
            </h6>
          </Link>
          <Suspense
            fallback={
              <Skeleton
                aria-label="Loading account"
                className="size-10 rounded-full"
              />
            }
          >
            <DesktopAccount />
          </Suspense>
          <CartIcon />
        </div>
        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <CartIcon compact />
          <Suspense
            fallback={
              <>
                <Skeleton
                  aria-label="Loading account"
                  className="size-10 rounded-full"
                />
                <MobileNav />
              </>
            }
          >
            <MobileAccount />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
