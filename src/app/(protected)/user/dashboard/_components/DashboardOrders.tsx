import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api-service";
import { redirectIfWholesaleFeeRequired } from "@/services/wholesale-fee.service";
import {
  getMyDashboard,
  type CustomerDashboard,
} from "@/services/orders.service";
import SessionExpired from "../../_components/SessionExpired";
import DashboardStats from "./DashboardStats";
import RecentOrders from "./RecentOrders";

export function DashboardOrdersSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your orders" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-27 rounded-xl" />
        <Skeleton className="h-27 rounded-xl" />
      </div>
      <div className="space-y-3 rounded-2xl border border-[#edf0f3] bg-white p-5 sm:p-7">
        <Skeleton className="mb-4 h-7 w-44" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-26 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardOrders() {
  let dashboard: CustomerDashboard;
  try {
    dashboard = await getMyDashboard();
  } catch (error) {
    redirectIfWholesaleFeeRequired(error);
    const status = error instanceof ApiRequestError ? error.status : undefined;

    if (status === 401) {
      return (
        <SessionExpired
          callbackUrl="/user/dashboard"
          message={error instanceof Error ? error.message : undefined}
        />
      );
    }

    if (status === 403) {
      // Admin accounts can't use the customer endpoints, and this app has no
      // admin dashboard to send them to.
      return (
        <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          This dashboard is for customer accounts. Sign in with a retail or
          wholesale account to see orders here.
        </p>
      );
    }

    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error instanceof ApiRequestError
          ? error.message
          : "Unable to load your orders."}
      </p>
    );
  }

  return (
    <>
      <DashboardStats stats={dashboard.stats} />
      <RecentOrders orders={dashboard.recentOrders} />
    </>
  );
}
