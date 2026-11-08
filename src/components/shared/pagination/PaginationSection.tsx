"use client";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { cn } from "@/lib/utils";
import { Pagination } from "react-pagination-bar";

const PaginationSection = ({ className,
  total,
  current,
  pageSize
}: {
  className?: string,
  total: number;
  current: number;
  pageSize?: number
}) => {
  const updateParams = useUpdateSearchParams();
  return (
    <div className={cn("mt-10 text-end", className)}>
      <Pagination
        currentPage={current}
        itemsPerPage={pageSize || 9}
        onPageChange={(pageNumber) => updateParams({ page: pageNumber.toString() })}
        totalItems={total}
        pageNeighbours={1}
      />
    </div>
  );
};

export default PaginationSection;