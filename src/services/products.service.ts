import "server-only";

import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { ApiRequestError, apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiItem,
  parseApiPage,
  type ApiPage,
  type ApiResponse,
} from "@/services/api-response";

const productsTag = "catalog-products";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
}

export interface ProductBrand {
  id: string;
  name: string;
  image?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  image?: string | null;
  status?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  stock: number;
  brandId: string;
  categoryId: string;
  isDeal: boolean;
  dealPrice: number | null;
  asin: string | null;
  subcategory: string | null;
  amazonUrl: string | null;
  walmartUrl: string | null;
  volumeTiers: unknown[] | null;
  status: string;
  avgRating: number;
  totalReview: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  brand: ProductBrand | null;
  category: ProductCategory | null;
  images: ProductImage[] | null;
  displayPrice?: number;
  displayMinQty?: number;
  isWholesale?: boolean;
}

export interface ProductDetail extends Product {
  reviews: unknown[];
}

export type ProductsResponse = ApiResponse<ApiPage<Product>>;
export type ProductResponse = ApiResponse<ProductDetail>;

export interface ProductListQuery {
  page: number;
  limit: number;
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  searchTerm?: string;
  deal?: boolean;
}

function isProductImage(value: unknown): value is ProductImage {
  return (
    isRecord(value) &&
    typeof value.url === "string" &&
    typeof value.isPrimary === "boolean"
  );
}

export function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.sku === "string" &&
    typeof value.retailPrice === "number" &&
    (typeof value.dealPrice === "number" || value.dealPrice === null) &&
    typeof value.stock === "number" &&
    typeof value.brandId === "string" &&
    typeof value.categoryId === "string" &&
    typeof value.isDeal === "boolean" &&
    typeof value.avgRating === "number" &&
    (value.brand === undefined ||
      value.brand === null ||
      (isRecord(value.brand) &&
        typeof value.brand.id === "string" &&
        typeof value.brand.name === "string")) &&
    (value.category === undefined ||
      value.category === null ||
      (isRecord(value.category) && typeof value.category.name === "string")) &&
    (value.images === undefined ||
      value.images === null ||
      (Array.isArray(value.images) && value.images.every(isProductImage)))
  );
}

function isProductDetail(value: unknown): value is ProductDetail {
  return isProduct(value);
}

async function authRequest() {
  const accessToken = (await cookies()).get(accessTokenCookie)?.value;
  if (!accessToken) return {};

  return {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store" as const,
  };
}

export async function getProducts(
  query: ProductListQuery,
): Promise<ApiPage<Product>> {
  const result: unknown = await apiGet("products", {
    searchParams: {
      page: query.page,
      limit: query.limit,
      brandId: query.brandId,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      searchTerm: query.searchTerm,
      deal: query.deal ? "true" : undefined,
    },
    tags: [productsTag],
    ...(await authRequest()),
  });

  return parseApiPage(result, "products", isProduct);
}

export async function getProductById(
  id: string,
): Promise<ProductDetail | null> {
  const resource = `products/${encodeURIComponent(id)}`;

  try {
    const result: unknown = await apiGet(resource, {
      tags: [productsTag],
      ...(await authRequest()),
    });

    return parseApiItem(result, resource, isProductDetail);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
