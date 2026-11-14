import { MessageSquareText, Star } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import type { ProductReview } from "@/services/products.service";

function formatReviewDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProductReviews({
  reviews,
  avgRating,
  totalReview,
}: {
  reviews: ProductReview[];
  avgRating: number;
  totalReview: number;
}) {
  return (
    <section aria-labelledby="product-reviews-heading" className="mt-10 border-t border-[#E9E6DF] pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="product-reviews-heading"
            className="text-lg font-semibold text-[#252A30]"
          >
            Customer reviews
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            {totalReview > 0
              ? `${avgRating.toFixed(1)} average from ${totalReview} ${totalReview === 1 ? "review" : "reviews"}`
              : "No reviews yet."}
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          message="No reviews for this product yet."
          className="min-h-40"
        />
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((item) => {
            const name = item.user?.name ?? "Customer";
            return (
              <li
                key={item.id}
                className="rounded-xl border border-[#E9E6DF] bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    name={name}
                    src={item.user?.profile}
                    className="size-10 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-[#252A30]">
                        {name}
                      </p>
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-[#995618]">
                        <Star
                          aria-hidden="true"
                          className="size-3.5 fill-current"
                        />
                        {item.rating.toFixed(1)}
                      </p>
                      {item.createdAt && (
                        <p className="text-xs text-[#9CA3AF]">
                          {formatReviewDate(item.createdAt)}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                      {item.review}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
