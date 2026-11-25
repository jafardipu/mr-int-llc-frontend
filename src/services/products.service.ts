import "server-only";

import { apiGet, isMissingResourceError } from "@/services/api-service";
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

/** A homepage banner offer that is currently lowering this product's price. */
export interface ProductBannerDiscount {
  percent: number;
  endsAt: string;
  bannerId: string;
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
  /** What the customer pays, already including any banner discount. */
  displayPrice?: number;
  displayMinQty?: number;
  isWholesale?: boolean;
  /** Price before the banner discount; null when no banner discount applies. */
  originalPrice?: number | null;
  bannerDiscount?: ProductBannerDiscount | null;
}

export interface ProductDetail extends Product {
  reviews: ProductReview[];
  displayPrice: number;
  displayMinQty: number;
  isWholesale: boolean;
  originalPrice: number | null;
  bannerDiscount: ProductBannerDiscount | null;
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

function readBannerDiscount(value: unknown): ProductBannerDiscount | null {
  if (
    !isRecord(value) ||
    typeof value.percent !== "number" ||
    !Number.isFinite(value.percent) ||
    value.percent <= 0 ||
    typeof value.endsAt !== "string" ||
    Number.isNaN(Date.parse(value.endsAt)) ||
    typeof value.bannerId !== "string"
  ) {
    return null;
  }

  return {
    percent: value.percent,
    endsAt: value.endsAt,
    bannerId: value.bannerId,
  };
}

/**
 * Replaces the raw `originalPrice` / `bannerDiscount` fields with validated
 * values. They come as a pair: if either is missing or malformed, both are
 * null so callers never show a half-formed sale.
 */
export function withBannerPricing<T extends Product>(
  product: T,
): T & Required<Pick<Product, "originalPrice" | "bannerDiscount">> {
  const bannerDiscount = readBannerDiscount(product.bannerDiscount);
  const originalPrice =
    typeof product.originalPrice === "number" &&
    Number.isFinite(product.originalPrice)
      ? product.originalPrice
      : null;
  const valid = bannerDiscount !== null && originalPrice !== null;

  return {
    ...product,
    originalPrice: valid ? originalPrice : null,
    bannerDiscount: valid ? bannerDiscount : null,
  };
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

  return withBannerPricing({
    ...value,
    volumeTiers: readVolumeTier(value.volumeTiers),
    reviews,
    displayPrice,
    displayMinQty,
    isWholesale,
  });
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
    // The signed-in user's token gets role-based prices (displayPrice/displayMinQty).
    auth: "optional",
  });

  const page = parseApiPage(result, "products", isProduct);
  return { ...page, data: page.data.map(withBannerPricing) };
}

export type FeaturedProductsSource = "featured" | "fallback";

export interface FeaturedProductsResult extends ApiPage<Product> {
  source: FeaturedProductsSource;
}

export async function getFeaturedProducts(
  query: { limit?: number } = {},
): Promise<FeaturedProductsResult> {
  const limit = Math.min(Math.max(query.limit ?? 8, 1), 24);
  const result: unknown = await apiGet("products/featured", {
    searchParams: { limit },
    tags: [productsTag],
    auth: "optional",
  });

  if (
    !isRecord(result) ||
    result.success !== true ||
    !isRecord(result.data) ||
    !Array.isArray(result.data.data) ||
    !isRecord(result.data.meta)
  ) {
    throw new Error("API returned an invalid response: /products/featured");
  }

  const page = parseApiPage(
    {
      success: true,
      message: typeof result.message === "string" ? result.message : "",
      data: {
        data: result.data.data,
        meta: result.data.meta,
      },
    },
    "products/featured",
    isProduct,
  );

  const source: FeaturedProductsSource =
    result.data.source === "featured" ? "featured" : "fallback";

  return {
    ...page,
    data: page.data
      .filter((product) => !product.isDeleted)
      .map(withBannerPricing),
    source,
  };
}

export async function getProductById(
  id: string,
): Promise<ProductDetail | null> {
  const resource = `products/${encodeURIComponent(id)}`;

  try {
    const result: unknown = await apiGet(resource, {
      tags: [productsTag],
      auth: "optional",
    });

    return readProductDetail(parseApiItem(result, resource, isRecord));
  } catch (error) {
    if (isMissingResourceError(error)) {
      return null;
    }

    throw error;
  }
}
