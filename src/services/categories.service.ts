import "server-only";

import { ApiRequestError, apiGet } from "@/services/api-service";
import {
  collectPages,
  isRecord,
  parseApiItem,
  parseApiPage,
  type ApiPage,
  type ApiResponse,
} from "@/services/api-response";
import { isProduct, type Product } from "@/services/products.service";

const categoriesTag = "catalog-categories";

export interface Category {
  id: string;
  name: string;
  image: string | null;
  status: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export interface CategoryDetail extends Category {
  products: Product[];
}

export type CategoriesResponse = ApiResponse<ApiPage<Category>>;
export type CategoryResponse = ApiResponse<CategoryDetail>;

export interface CategoryListQuery {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sort?: string;
  status?: "active" | "inactive";
}

export function readCategory(value: unknown): Category | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  const count = isRecord(value._count) ? value._count.products : 0;

  return {
    id: value.id,
    name: value.name,
    image:
      typeof value.image === "string" && value.image.trim()
        ? value.image
        : null,
    status: value.status === "inactive" ? "inactive" : "active",
    isDeleted: value.isDeleted === true,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    _count: { products: typeof count === "number" ? count : 0 },
  };
}

function isCategory(value: unknown): value is Category {
  return readCategory(value) !== null;
}

function readCategoryDetail(value: unknown): CategoryDetail | null {
  const category = readCategory(value);
  if (!category || !isRecord(value)) return null;

  const products = Array.isArray(value.products)
    ? value.products.filter(isProduct)
    : [];

  return { ...category, products };
}

export async function getCategories(
  query: CategoryListQuery = {},
): Promise<ApiPage<Category>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 100;
  const result: unknown = await apiGet("categories", {
    searchParams: {
      page,
      limit,
      searchTerm: query.searchTerm,
      sort: query.sort,
      status: query.status,
    },
    tags: [categoriesTag],
  });

  const pageResult = parseApiPage(result, "categories", isCategory);
  return {
    ...pageResult,
    data: pageResult.data.flatMap((item) => {
      const category = readCategory(item);
      return category && !category.isDeleted ? [category] : [];
    }),
  };
}

export async function getAllCategories(
  query: Omit<CategoryListQuery, "page" | "limit"> = {},
): Promise<Category[]> {
  return collectPages((page, limit) => getCategories({ ...query, page, limit }));
}

export async function getCategoryById(
  id: string,
): Promise<CategoryDetail | null> {
  const resource = `categories/${encodeURIComponent(id)}`;

  try {
    const result: unknown = await apiGet(resource, {
      tags: [categoriesTag],
    });
    const category = readCategoryDetail(parseApiItem(result, resource, isRecord));
    return category && !category.isDeleted ? category : null;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
