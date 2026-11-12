import { Suspense } from "react";
import DashboardStats from "./_components/DashboardStats";
import DashboardWelcome, {
  DashboardWelcomeSkeleton,
} from "./_components/DashboardWelcome";
import RecentOrders from "./_components/RecentOrders";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardWelcomeSkeleton />}>
        <DashboardWelcome />
      </Suspense>
      <DashboardStats />
      <RecentOrders />
    </div>
  );
}
