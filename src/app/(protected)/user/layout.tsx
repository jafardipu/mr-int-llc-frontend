import { Suspense } from "react";
import Container from "@/components/container/Container";
import { getMyProfile } from "@/services/users.service";
import AccountSidebarSkeleton from "./_components/AccountSidebarSkeleton";
import DashboardSidebar from "./_components/DashboardSidebar";

async function AccountSidebar() {
  let profile: Awaited<ReturnType<typeof getMyProfile>> | null = null;
  try {
    profile = await getMyProfile();
  } catch {
    profile = null;
  }

  return (
    <DashboardSidebar
      name={profile?.name ?? "Account"}
      role={profile?.role}
      profileUrl={profile?.profile ?? null}
    />
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-primary-white py-10">
      <Container className="items-start gap-x-8 xl:flex ">
        <div className="xl:w-76">
          <h4 className="mb-5 text-xl font-bold text-[#111827] lg:text-2xl">
            My Account
          </h4>
          <Suspense fallback={<AccountSidebarSkeleton />}>
            <AccountSidebar />
          </Suspense>
        </div>
        <div className="grow">{children}</div>
      </Container>
    </div>
  );
}
