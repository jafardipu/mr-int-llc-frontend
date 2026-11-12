import "server-only";

import { apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiItem,
  parseApiPage,
  type ApiPage,
  type ApiResponse,
} from "@/services/api-response";
import { isProduct, type Product } from "@/services/products.service";

const dealsTag = "catalog-deals";

export interface Deal {
  id: string;
  title: string;
  description: string;
  image: string | null;
  productId: string;
  dealPrice: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export type DealsResponse = ApiResponse<ApiPage<Deal>>;
export type DealResponse = ApiResponse<Deal>;

export interface DealListQuery {
  page?: number;
  limit?: number;
}

function isDeal(value: unknown): value is Deal {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.image === "string" || value.image === null) &&
    typeof value.productId === "string" &&
    typeof value.dealPrice === "number" &&
    (typeof value.startDate === "string" || value.startDate === null) &&
    (typeof value.endDate === "string" || value.endDate === null) &&
    typeof value.isActive === "boolean" &&
    typeof value.isDeleted === "boolean" &&
    isProduct(value.product)
  );
}

export async function getDeals(
  query: DealListQuery = {},
): Promise<ApiPage<Deal>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const result: unknown = await apiGet("deals", {
    searchParams: { page, limit },
    tags: [dealsTag],
  });

  return parseApiPage(result, "deals", isDeal);
}

export async function getDealById(id: string): Promise<Deal> {
  const resource = `deals/${encodeURIComponent(id)}`;
  const result: unknown = await apiGet(resource, {
    tags: [dealsTag],
  });

  return parseApiItem(result, resource, isDeal);
}
