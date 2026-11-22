import type { CustomerDashboard } from "@/services/orders.service";

const count = new Intl.NumberFormat("en-US");

export default function DashboardStats({
  stats,
}: {
  stats: CustomerDashboard["stats"];
}) {
  const items = [
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Active Orders", value: stats.activeOrders },
  ];

  return (
    <section aria-label="Order summary" className="grid gap-4 sm:grid-cols-2">
      {items.map((stat) => (
        <article
          key={stat.label}
          className="rounded-xl border border-[#F3F4F6E5] bg-white px-7 py-7 shadow-[0_1.5px_3px_0_rgba(0,0,0,0.05)] sm:px-6"
        >
          <h2 className="text-base font-medium text-[#6B7280]">{stat.label}</h2>
          <p className="mt-1 text-3xl font-bold leading-none text-[#172033]">
            {count.format(stat.value)}
          </p>
        </article>
      ))}
    </section>
  );
}
