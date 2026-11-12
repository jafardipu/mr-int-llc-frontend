"use client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Heart,
  BookAudio,
  BanknoteArrowUp,
  Settings,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import { profileRoleLabel } from "@/lib/profile";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/authSlice";
import { logoutAction } from "@/actions/auth.actions";

export default function DashboardSidebar({
  name,
  role,
  profileUrl,
}: {
  name: string;
  role?: string;
  profileUrl: string | null;
}) {
  const pathname = usePathname();
  const path = pathname?.split("/")[2] ?? "";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await logoutAction();
    dispatch(logout());
    router.push("/login");
    router.refresh();
  };

  const SIDEBAR_LINKS = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={22} />,
      href: "/user/dashboard",
    },
    {
      key: "favorites",
      label: "Favorites",
      icon: <Heart size={22} />,
      href: "/user/favorites",
    },
    {
      key: "orders",
      label: "My Orders",
      icon: <BookAudio size={22} />,
      href: "/user/orders",
    },
    {
      key: "3pl-services",
      label: "3PL Services",
      icon: <BanknoteArrowUp size={22} />,
      href: "/user/pl-services",
    },
   
    {
      key: "change-password",
      label: "Change Password",
      icon: <Settings size={22} />,
      href: "/user/change-password",
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (path && href.includes(path));

  return (
    <>
      {/* ---------- Large devices: fixed vertical sidebar ---------- */}
      <div className="hidden xl:block sticky top-0 self-start max-h-screen overflow-y-auto border border-[#ECEEF0] pr-4 h-full rounded-xl">
        <div className="dashboard-card bg-white p-5 w-64">
          <div className="mb-5 border-b border-[#ECEEF0] pb-4">
            <Link
              href="/user/profile"
              className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
            >
              <UserAvatar
                name={name}
                src={profileUrl}
                className="size-12 text-sm"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#172033]">
                  {name}
                </span>
                {role && (
                  <span className="mt-1 inline-flex rounded-full border border-[#cce8dc] bg-[#eaf5ef] px-2.5 py-1 text-[11px] font-medium text-[#388165]">
                    {profileRoleLabel(role)}
                  </span>
                )}
              </span>
            </Link>
            <Link
              href="/user/profile"
              className="mt-1 inline-flex items-center gap-2 px-2 text-sm font-semibold text-[#a45a1a] hover:text-[#81430f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#99512f]"
            >
              {/* <Pencil aria-hidden="true" size={14} /> */}
              Edit Profile
            </Link>
          </div>
          <div className="space-y-2">
            {SIDEBAR_LINKS.map((link) => (
              <Link
                href={link.href}
                key={link.key}
                className={cn(
                  "flex items-center gap-x-3 px-5 py-3 text-gray-scale-600 transition-all duration-300 ease-in-out text-base text-[#475569]",
                  isActive(link.href) &&
                    "border-l-4 border-l-[#F8F4ED] bg-[#F8F4ED] rounded-xl text-base  text-[#995618]",
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              type="button"
              className="flex items-center gap-x-3 px-5 py-4 text-base text-[#475569]"
            >
              <LogOut size={20} color="#BA1A1A" />
              <span>Logout</span>
            </button>
           
          </div>
        </div>
      </div>

      {/* ---------- Medium/small devices: horizontal carousel nav ---------- */}
      <div className="xl:hidden sticky top-0 z-10 border-b-2 border-[#ECEEF0] bg-white py-3 mb-2">
        <Carousel
          opts={{
            loop: false,
            align: "start",
            dragFree: true,
          }}
          className="relative px-10"
        >
          <CarouselContent className="-ml-2">
            <CarouselItem className="basis-auto pl-2">
              <Link
                href="/user/profile"
                aria-current={pathname === "/user/profile" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-x-2 whitespace-nowrap rounded-full border border-[#ECEEF0] px-4 py-2 text-sm text-gray-scale-600 transition-all duration-300 ease-in-out",
                  pathname === "/user/profile" &&
                    "border-secondary-color bg-secondary-color text-white",
                )}
              >
                <UserRound size={22} />
                <span>Profile</span>
              </Link>
            </CarouselItem>
            {SIDEBAR_LINKS.map((link) => (
              <CarouselItem key={link.key} className="basis-auto pl-2">
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-x-2 whitespace-nowrap rounded-full border border-[#ECEEF0] px-4 py-2 text-sm text-gray-scale-600 transition-all duration-300 ease-in-out",
                    isActive(link.href) &&
                      "bg-secondary-color border-secondary-color text-white",
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </CarouselItem>
            ))}

            <CarouselItem className="basis-auto pl-2">
              <button
                onClick={() => handleLogout()}
                type="button"
                className="flex items-center gap-x-2 whitespace-nowrap rounded-full border border-[#BA1A1A]/30 px-4 py-2 text-sm text-[#BA1A1A]"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </CarouselItem>
          </CarouselContent>

          <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 size-8 border-none bg-secondary-color hover:bg-secondary-color/80 text-white shadow-md hover:text-white disabled:opacity-0 disabled:pointer-events-none cursor-pointer" />
          <CarouselNext className="right-0 top-1/2 -translate-y-1/2 size-8 border-none bg-secondary-color hover:bg-secondary-color/80 text-white shadow-md hover:text-white disabled:opacity-0 disabled:pointer-events-none cursor-pointer" />
        </Carousel>
      </div>
    </>
  );
}