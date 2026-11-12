import "server-only";

import { apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiPage,
  type ApiPage,
  type ApiResponse,
} from "@/services/api-response";

const reviewsTag = "catalog-reviews";

export type Review = Record<string, unknown>;

export type ReviewsResponse = ApiResponse<ApiPage<Review>>;

export interface ReviewListQuery {
  page?: number;
  limit?: number;
  productId?: string;
}

function isReview(value: unknown): value is Review {
  return isRecord(value);
}

export async function getReviews(
  query: ReviewListQuery = {},
): Promise<ApiPage<Review>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const result: unknown = await apiGet("reviews", {
    searchParams: {
      page,
      limit,
      productId: query.productId,
    },
    tags: [reviewsTag],
  });

  return parseApiPage(result, "reviews", isReview);
}
