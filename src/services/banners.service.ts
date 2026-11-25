import "server-only";

import { apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiPage,
  type ApiPage,
} from "@/services/api-response";

const bannersTag = "homepage-banners";

export type BannerTargetType = "product" | "category";

export interface BannerTarget {
  id: string;
  name: string;
}

export interface Banner {
  id: string;
  image: string;
  /** null for legacy banners, which only have `link`. */
  targetType: BannerTargetType | null;
  productId: string | null;
  categoryId: string | null;
  product: BannerTarget | null;
  category: BannerTarget | null;
  /** The offer fields are null when the banner carries no discount. */
  discountPercent: number | null;
  startDate: string | null;
  endDate: string | null;
  link: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageBannersQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readTarget(value: unknown): BannerTarget | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.name !== "string" ||
    !value.name.trim()
  ) {
    return null;
  }

  return { id: value.id, name: value.name };
}

function readBanner(value: unknown): Banner | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.image !== "string" ||
    !value.image.trim()
  ) {
    return null;
  }

  if (value.isDeleted === true || value.isActive === false) {
    return null;
  }

  const targetType =
    value.targetType === "product" || value.targetType === "category"
      ? value.targetType
      : null;
  const product = readTarget(value.product);
  const category = readTarget(value.category);
  const discountPercent =
    typeof value.discountPercent === "number" &&
    Number.isFinite(value.discountPercent) &&
    value.discountPercent > 0
      ? value.discountPercent
      : null;

  return {
    id: value.id,
    image: value.image,
    targetType,
    productId: readOptionalString(value.productId) ?? product?.id ?? null,
    categoryId: readOptionalString(value.categoryId) ?? category?.id ?? null,
    product,
    category,
    discountPercent,
    startDate: readOptionalString(value.startDate),
    endDate: readOptionalString(value.endDate),
    link: readOptionalString(value.link),
    isActive: true,
    isDeleted: false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function isBanner(value: unknown): value is Banner {
  return readBanner(value) !== null;
}

export async function getHomepageBanners(
  query: HomepageBannersQuery = {},
): Promise<ApiPage<Banner>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const result: unknown = await apiGet("banners/homepage", {
    searchParams: {
      page,
      limit,
      sort: query.sort,
    },
    tags: [bannersTag],
    revalidate: 300,
  });

  const pageResult = parseApiPage(result, "banners/homepage", isBanner);
  return {
    ...pageResult,
    data: pageResult.data.flatMap((item) => {
      const banner = readBanner(item);
      return banner ? [banner] : [];
    }),
  };
}
