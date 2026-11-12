import { Skeleton } from "@/components/ui/skeleton";

export default function AccountSidebarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading account">
      <div className="hidden rounded-xl border border-[#ECEEF0] bg-white p-5 xl:block xl:w-64">
        <div className="mb-5 flex items-center gap-3 border-b border-[#ECEEF0] pb-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="mb-2 flex gap-2 overflow-hidden border-b-2 border-[#ECEEF0] bg-white py-3 xl:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}
