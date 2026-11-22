import { Suspense } from "react";
import DashboardOrders, {
  DashboardOrdersSkeleton,
} from "./_components/DashboardOrders";
import DashboardWelcome, {
  DashboardWelcomeSkeleton,
} from "./_components/DashboardWelcome";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardWelcomeSkeleton />}>
        <DashboardWelcome />
      </Suspense>
      <Suspense fallback={<DashboardOrdersSkeleton />}>
        <DashboardOrders />
      </Suspense>
    </div>
  );
}
