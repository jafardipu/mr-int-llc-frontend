import "server-only";

import { envConfig } from "@/config";

type ApiQueryValue = string | number | undefined;

export interface ApiGetOptions {
  searchParams?: Record<string, ApiQueryValue>;
  revalidate?: number | false;
  tags?: string[];
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function getApiBaseUrl() {
  const baseUrl = envConfig.serverUrl ?? envConfig.baseUrl;

  if (!baseUrl) {
    throw new Error("The API base URL is not configured.");
  }

  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export async function apiGet<T>(
  endpoint: string,
  { searchParams, revalidate = 300, tags }: ApiGetOptions = {},
): Promise<T> {
  const url = new URL(endpoint.replace(/^\/+/, ""), getApiBaseUrl());

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    next: {
      revalidate,
      ...(tags?.length ? { tags } : {}),
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(
      `API request failed with status ${response.status}: ${url.pathname}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}
