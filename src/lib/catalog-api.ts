import "server-only";

import { ApiRequestError, apiGet } from "@/services/api-service";
import type { TProducts } from "@/types/products";

interface ApiPage<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ApiProductImage {
  url: string;
  isPrimary: boolean;
}

interface ApiProduct {
  id: string;
  name: string;
  description: string;
  sku: string;
  retailPrice: number;
  dealPrice: number | null;
  displayPrice?: number;
  stock: number;
  brandId: string;
  categoryId: string;
  isDeal: boolean;
  avgRating: number;
  brand?: { name: string } | null;
  category?: { name: string; image?: string | null } | null;
  images?: ApiProductImage[] | null;
}

export interface CatalogOption {
  id: string;
  name: string;
}

export interface CatalogProduct extends TProducts {
  brand: string;
  brandId: string;
  categoryId: string;
  description: string;
  sku: string;
  galleryImages: string[];
}

export const catalogCacheTags = {
  products: "catalog-products",
  categories: "catalog-categories",
  brands: "catalog-brands",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiProduct(value: unknown): value is ApiProduct {
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
    (value.images === undefined ||
      value.images === null ||
      (Array.isArray(value.images) &&
        value.images.every(
          (image) =>
            isRecord(image) &&
            typeof image.url === "string" &&
            typeof image.isPrimary === "boolean",
        )))
  );
}

function isCatalogOption(value: unknown): value is CatalogOption {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

async function fetchPage<T>(
  resource: string,
  page: number,
  limit: number,
  tags: string[],
  isItem: (value: unknown) => value is T,
  extraSearchParams?: Record<string, string | number | undefined>,
): Promise<ApiPage<T>> {
  const result: unknown = await apiGet(resource, {
    searchParams: {
      ...extraSearchParams,
      page,
      limit,
    },
    tags,
  });

  if (
    !isRecord(result) ||
    result.success !== true ||
    !isRecord(result.data) ||
    !Array.isArray(result.data.data) ||
    !isRecord(result.data.meta) ||
    !result.data.data.every(isItem) ||
    typeof result.data.meta.page !== "number" ||
    typeof result.data.meta.limit !== "number" ||
    result.data.meta.limit <= 0 ||
    typeof result.data.meta.total !== "number" ||
    result.data.meta.total < 0
  ) {
    throw new Error(`Catalog API returned an invalid response: /${resource}`);
  }

  return {
    data: result.data.data,
    meta: {
      page: result.data.meta.page,
      limit: result.data.meta.limit,
      total: result.data.meta.total,
    },
  };
}

async function fetchAllPages<T>(
  resource: string,
  tags: string[],
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  const limit = 100;
  const firstPage = await fetchPage<T>(resource, 1, limit, tags, isItem);
  const pageCount = Math.ceil(firstPage.meta.total / firstPage.meta.limit);

  if (pageCount <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchPage<T>(resource, index + 2, limit, tags, isItem),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.data);
}

function mapProduct(product: ApiProduct): CatalogProduct {
  const images = (product.images ?? []).filter((image) => image.url);
  const image =
    images.find((item) => item.isPrimary)?.url ??
    images[0]?.url ??
    product.category?.image ??
    "/image/product/headphones.jpg";
  const price =
    product.displayPrice ??
    (product.isDeal ? product.dealPrice : null) ??
    product.retailPrice;
  const hasDiscount =
    product.isDeal &&
    product.dealPrice !== null &&
    product.dealPrice < product.retailPrice;

  return {
    id: product.id,
    image,
    imageAlt: product.name,
    category: product.category?.name ?? "Other",
    title: product.name,
    price,
    ...(hasDiscount
      ? { originalPrice: product.retailPrice, badge: "On Sale" }
      : {}),
    rating: product.avgRating,
    stockCount: product.stock,
    brand: product.brand?.name ?? "Other",
    brandId: product.brandId,
    categoryId: product.categoryId,
    description: product.description,
    sku: product.sku,
    galleryImages: images.length ? images.map((item) => item.url) : [image],
  };
}

export interface CatalogProductQuery {
  page: number;
  limit: number;
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export async function getCatalogProducts(query: CatalogProductQuery) {
  const result = await fetchPage<ApiProduct>(
    "products",
    query.page,
    query.limit,
    [catalogCacheTags.products],
    isApiProduct,
    {
      brandId: query.brandId,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
    },
  );
  const lastPage = Math.ceil(result.meta.total / result.meta.limit);

  if (lastPage > 0 && query.page > lastPage) {
    const lastPageResult = await fetchPage<ApiProduct>(
      "products",
      lastPage,
      query.limit,
      [catalogCacheTags.products],
      isApiProduct,
      {
        brandId: query.brandId,
        categoryId: query.categoryId,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        sort: query.sort,
      },
    );

    return {
      ...lastPageResult,
      data: lastPageResult.data.map(mapProduct),
    };
  }

  return {
    ...result,
    data: result.data.map(mapProduct),
  };
}

export async function getCatalogFilters() {
  const [categories, brands] = await Promise.all([
    fetchAllPages<CatalogOption>(
      "categories",
      [catalogCacheTags.categories],
      isCatalogOption,
    ),
    fetchAllPages<CatalogOption>(
      "brands",
      [catalogCacheTags.brands],
      isCatalogOption,
    ),
  ]);

  return { categories, brands };
}

export async function getCatalogProductById(
  id: string,
): Promise<CatalogProduct | null> {
  let result: unknown;
  try {
    result = await apiGet(`products/${encodeURIComponent(id)}`, {
      tags: [catalogCacheTags.products],
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }

  if (
    !isRecord(result) ||
    result.success !== true ||
    !isRecord(result.data)
  ) {
    throw new Error("Catalog API returned an invalid product response.");
  }

  if (!isApiProduct(result.data)) {
    throw new Error("Catalog API returned an invalid product response.");
  }

  return mapProduct(result.data);
}
