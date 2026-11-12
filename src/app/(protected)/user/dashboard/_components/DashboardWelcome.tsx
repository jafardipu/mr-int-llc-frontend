import Link from "next/link";
import { Pencil } from "lucide-react";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { profileRoleLabel } from "@/lib/profile";
import { ApiRequestError } from "@/services/api-service";
import { getMyProfile } from "@/services/users.service";

const cardClassName =
  "flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-7 sm:py-7";

const cardStyle = {
  borderRadius: "24px",
  border: "1.5px solid rgba(238, 222, 200, 0.60)",
  background: "linear-gradient(90deg, #FBF8F2 0%, #F7F3EA 50%, #F4EEE1 100%)",
  boxShadow: "0 1.5px 3px 0 rgba(0, 0, 0, 0.05)",
};

export function DashboardWelcomeSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading profile"
      className={cardClassName}
      style={cardStyle}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Skeleton className="size-14 rounded-full bg-[#e9dcc6]" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </section>
  );
}

export default async function DashboardWelcome() {
  try {
    const profile = await getMyProfile();

    return (
      <section className={cardClassName} style={cardStyle}>
        <div className="flex min-w-0 items-start gap-4">
          <UserAvatar
            name={profile.name}
            src={profile.profile}
            className="size-14 border-2 border-white bg-[#e9dcc6] text-sm text-[#86501d] shadow-sm"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#172033] sm:text-2xl">
              Welcome back, {profile.name}!
            </h1>
            <p className="mt-1 truncate text-xs text-[#74839b] sm:text-sm">
              {profile.email}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-[#cce8dc] bg-[#eaf5ef] px-3 py-1 text-[11px] font-medium text-[#388165]">
              {profileRoleLabel(profile.role)}
            </span>
          </div>
        </div>

        <Link
          href="/user/profile"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a45a1a] px-5 text-xs font-medium text-white transition-colors hover:bg-[#874710] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45a1a]"
        >
          <Pencil size={14} aria-hidden="true" />
          Edit Profile
        </Link>
      </section>
    );
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load your profile.";

    return (
      <section className={cardClassName} style={cardStyle}>
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      </section>
    );
  }
}
