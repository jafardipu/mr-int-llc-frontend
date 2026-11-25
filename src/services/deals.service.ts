import "server-only";

import { apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiItem,
  parseApiPage,
  type ApiPage,
  type ApiResponse,
} from "@/services/api-response";
import {
  isProduct,
  withBannerPricing,
  type Product,
} from "@/services/products.service";

const dealsTag = "catalog-deals";

export type DealType = "weekly" | "clearance";

export interface Deal {
  id: string;
  productId: string;
  dealPrice: number;
  type: DealType;
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

export interface DealSections {
  weekly: ApiPage<Deal>;
  clearance: ApiPage<Deal>;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readDeal(value: unknown): Deal | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  if (value.isDeleted === true || value.isActive === false) return null;
  if (!isProduct(value.product) || value.product.isDeleted) return null;

  const type = value.type === "clearance" ? "clearance" : "weekly";
  const productId =
    typeof value.productId === "string" ? value.productId : value.product.id;
  const dealPrice = readNumber(value.dealPrice, NaN);
  if (!Number.isFinite(dealPrice)) return null;

  const product: Product = withBannerPricing({
    ...value.product,
    displayPrice:
      typeof value.product.displayPrice === "number"
        ? value.product.displayPrice
        : dealPrice,
    isDeal: true,
    dealPrice:
      typeof value.product.dealPrice === "number"
        ? value.product.dealPrice
        : dealPrice,
  });

  return {
    id: value.id,
    productId,
    dealPrice,
    type,
    startDate: typeof value.startDate === "string" ? value.startDate : null,
    endDate: typeof value.endDate === "string" ? value.endDate : null,
    isActive: true,
    isDeleted: false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    product,
  };
}

function isDeal(value: unknown): value is Deal {
  return readDeal(value) !== null;
}

function readDealPage(result: unknown, resource: string): ApiPage<Deal> {
  const page = parseApiPage(result, resource, isDeal);
  return {
    ...page,
    data: page.data.flatMap((item) => {
      const deal = readDeal(item);
      return deal ? [deal] : [];
    }),
  };
}

export async function getDealSections(limit = 8): Promise<DealSections> {
  const result: unknown = await apiGet("deals/sections", {
    searchParams: { limit },
    tags: [dealsTag],
    revalidate: 300,
  });

  if (!isRecord(result) || result.success !== true || !isRecord(result.data)) {
    throw new Error("API returned an invalid response: /deals/sections");
  }

  const weeklyRaw = {
    success: true,
    message: "",
    data: result.data.weekly,
  };
  const clearanceRaw = {
    success: true,
    message: "",
    data: result.data.clearance,
  };

  return {
    weekly: readDealPage(weeklyRaw, "deals/sections/weekly"),
    clearance: readDealPage(clearanceRaw, "deals/sections/clearance"),
  };
}

export async function getWeeklyDeals(
  query: DealListQuery = {},
): Promise<ApiPage<Deal>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 8;
  const result: unknown = await apiGet("deals/weekly", {
    searchParams: { page, limit },
    tags: [dealsTag],
    revalidate: 300,
  });
  return readDealPage(result, "deals/weekly");
}

export async function getClearanceDeals(
  query: DealListQuery = {},
): Promise<ApiPage<Deal>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 8;
  const result: unknown = await apiGet("deals/clearance", {
    searchParams: { page, limit },
    tags: [dealsTag],
    revalidate: 300,
  });
  return readDealPage(result, "deals/clearance");
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

  return readDealPage(result, "deals");
}

export async function getDealById(id: string): Promise<Deal | null> {
  const resource = `deals/${encodeURIComponent(id)}`;
  try {
    const result: unknown = await apiGet(resource, {
      tags: [dealsTag],
    });
    return readDeal(parseApiItem(result, resource, isRecord));
  } catch {
    return null;
  }
}
