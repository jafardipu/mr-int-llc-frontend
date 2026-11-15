import { Suspense } from "react";
import SectionTitle from "@/components/shared/section/SectionTitle";
import OrdersList, { OrdersListSkeleton } from "./_components/OrdersList";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-8">
      <SectionTitle
        title="My Orders"
        subTitle="View and track your orders."
        btn={false}
        className="lg:space-y-1.5 space-y-1"
        subTitleClass="text-[#6B7280] max-w-80"
      />
      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
