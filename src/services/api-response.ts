import "server-only";

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiPage<T> {
  data: T[];
  meta: ApiMeta;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseApiPage<T>(
  result: unknown,
  resource: string,
  isItem: (value: unknown) => value is T,
): ApiPage<T> {
  if (
    !isRecord(result) ||
    result.success !== true ||
    !isRecord(result.data) ||
    !Array.isArray(result.data.data) ||
    !result.data.data.every(isItem) ||
    !isRecord(result.data.meta) ||
    typeof result.data.meta.page !== "number" ||
    typeof result.data.meta.limit !== "number" ||
    result.data.meta.limit <= 0 ||
    typeof result.data.meta.total !== "number" ||
    result.data.meta.total < 0
  ) {
    throw new Error(`API returned an invalid response: /${resource}`);
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

export function parseApiItem<T>(
  result: unknown,
  resource: string,
  isItem: (value: unknown) => value is T,
): T {
  if (!isRecord(result) || result.success !== true || !isItem(result.data)) {
    throw new Error(`API returned an invalid response: /${resource}`);
  }

  return result.data;
}

export async function collectPages<T>(
  loadPage: (page: number, limit: number) => Promise<ApiPage<T>>,
  limit = 100,
): Promise<T[]> {
  const firstPage = await loadPage(1, limit);
  const pageCount = Math.ceil(firstPage.meta.total / firstPage.meta.limit);

  if (pageCount <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      loadPage(index + 2, limit),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.data);
}
