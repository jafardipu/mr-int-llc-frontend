import "server-only";

import { apiGet } from "@/services/api-service";
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

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.image === "string" || value.image === null) &&
    typeof value.status === "string" &&
    typeof value.isDeleted === "boolean"
  );
}

function isCategoryDetail(value: unknown): value is CategoryDetail {
  if (!isRecord(value) || !Array.isArray(value.products)) {
    return false;
  }

  return value.products.every(isProduct) && isCategory(value);
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

  return parseApiPage(result, "categories", isCategory);
}

export async function getAllCategories(
  query: Omit<CategoryListQuery, "page" | "limit"> = {},
): Promise<Category[]> {
  return collectPages((page, limit) => getCategories({ ...query, page, limit }));
}

export async function getCategoryById(id: string): Promise<CategoryDetail> {
  const resource = `categories/${encodeURIComponent(id)}`;
  const result: unknown = await apiGet(resource, {
    tags: [categoriesTag],
  });

  return parseApiItem(result, resource, isCategoryDetail);
}
