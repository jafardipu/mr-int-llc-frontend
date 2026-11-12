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

const brandsTag = "catalog-brands";

export interface Brand {
  id: string;
  name: string;
  image: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BrandsResponse = ApiResponse<ApiPage<Brand>>;
export type BrandResponse = ApiResponse<Brand>;

export interface BrandListQuery {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sort?: string;
}

function readBrand(value: unknown): Brand | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    image:
      typeof value.image === "string" && value.image.trim()
        ? value.image
        : null,
    isDeleted: value.isDeleted === true,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function isBrand(value: unknown): value is Brand {
  return readBrand(value) !== null;
}

export async function getBrands(
  query: BrandListQuery = {},
): Promise<ApiPage<Brand>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 100;
  const result: unknown = await apiGet("brands", {
    searchParams: {
      page,
      limit,
      searchTerm: query.searchTerm,
      sort: query.sort,
    },
    tags: [brandsTag],
  });

  const pageResult = parseApiPage(result, "brands", isBrand);
  return {
    ...pageResult,
    data: pageResult.data.flatMap((item) => {
      const brand = readBrand(item);
      return brand && !brand.isDeleted ? [brand] : [];
    }),
  };
}

export async function getAllBrands(): Promise<Brand[]> {
  return collectPages((page, limit) => getBrands({ page, limit }));
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const resource = `brands/${encodeURIComponent(id)}`;

  try {
    const result: unknown = await apiGet(resource, {
      tags: [brandsTag],
    });
    const brand = readBrand(parseApiItem(result, resource, isBrand));
    return brand && !brand.isDeleted ? brand : null;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
