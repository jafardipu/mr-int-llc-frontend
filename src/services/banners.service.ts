import "server-only";

import { apiGet } from "@/services/api-service";
import {
  isRecord,
  parseApiPage,
  type ApiPage,
} from "@/services/api-response";

const bannersTag = "homepage-banners";

export interface Banner {
  id: string;
  image: string;
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

  return {
    id: value.id,
    image: value.image,
    link:
      typeof value.link === "string" && value.link.trim() ? value.link : null,
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
