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

export interface ProductVolumeTier {
  minQty: number;
  maxQty?: number | null;
  discountPercent?: number | null;
  unitPrice?: number | null;
}

export interface ProductReviewUser {
  id: string;
  name: string;
  profile: string | null;
}

export interface ProductReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
  user: ProductReviewUser | null;
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
  volumeTiers: ProductVolumeTier[] | null;
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
  reviews: ProductReview[];
  displayPrice: number;
  displayMinQty: number;
  isWholesale: boolean;
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
    typeof value.id === "string" &&
    typeof value.productId === "string" &&
    typeof value.url === "string" &&
    typeof value.isPrimary === "boolean"
  );
}

function readVolumeTier(value: unknown): ProductVolumeTier[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;

  const tiers = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.minQty !== "number") return [];
    return [
      {
        minQty: item.minQty,
        maxQty:
          typeof item.maxQty === "number"
            ? item.maxQty
            : item.maxQty === null
              ? null
              : undefined,
        discountPercent:
          typeof item.discountPercent === "number"
            ? item.discountPercent
            : item.discountPercent === null
              ? null
              : undefined,
        unitPrice:
          typeof item.unitPrice === "number"
            ? item.unitPrice
            : item.unitPrice === null
              ? null
              : undefined,
      },
    ];
  });

  return tiers;
}

function readReview(value: unknown): ProductReview | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.userId !== "string" ||
    typeof value.productId !== "string" ||
    typeof value.rating !== "number" ||
    typeof value.review !== "string"
  ) {
    return null;
  }

  const user =
    isRecord(value.user) &&
    typeof value.user.id === "string" &&
    typeof value.user.name === "string"
      ? {
          id: value.user.id,
          name: value.user.name,
          profile:
            typeof value.user.profile === "string" && value.user.profile.trim()
              ? value.user.profile
              : null,
        }
      : null;

  return {
    id: value.id,
    userId: value.userId,
    productId: value.productId,
    rating: value.rating,
    review: value.review,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    user,
  };
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

function readProductDetail(value: unknown): ProductDetail | null {
  if (!isProduct(value) || value.isDeleted) return null;

  const displayPrice =
    typeof value.displayPrice === "number"
      ? value.displayPrice
      : value.isDeal && value.dealPrice !== null
        ? value.dealPrice
        : value.retailPrice;
  const displayMinQty =
    typeof value.displayMinQty === "number" && value.displayMinQty > 0
      ? value.displayMinQty
      : 1;
  const isWholesale = value.isWholesale === true;
  const rawReviews = (value as Product & Record<string, unknown>).reviews;
  const reviews = Array.isArray(rawReviews)
    ? rawReviews.flatMap((item: unknown) => {
        const review = readReview(item);
        return review ? [review] : [];
      })
    : [];

  return {
    ...value,
    volumeTiers: readVolumeTier(value.volumeTiers),
    reviews,
    displayPrice,
    displayMinQty,
    isWholesale,
  };
}

async function authRequest() {
  const accessToken = (await cookies()).get(accessTokenCookie)?.value;

  return {
    ...(accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {}),
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

    return readProductDetail(parseApiItem(result, resource, isRecord));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
