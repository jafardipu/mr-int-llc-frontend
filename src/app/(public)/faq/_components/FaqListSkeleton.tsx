import { Skeleton } from "@/components/ui/skeleton";

export default function FaqListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mt-10 grid grid-cols-1 items-start gap-4 sm:mt-12 md:grid-cols-2 md:gap-5"
    >
      <span className="sr-only">Loading FAQs…</span>
      {Array.from({ length: 2 }, (_, column) => (
        <div key={column} className="flex flex-col gap-4 md:gap-5">
          {Array.from({ length: 4 }, (_, row) => (
            <Skeleton key={row} className="h-16 rounded-2xl sm:h-18" />
          ))}
        </div>
      ))}
    </div>
  );
}
