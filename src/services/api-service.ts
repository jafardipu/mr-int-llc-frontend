import "server-only";

import { envConfig } from "@/config";

type ApiQueryValue = string | number | undefined;

export interface ApiGetOptions {
  searchParams?: Record<string, ApiQueryValue>;
  revalidate?: number | false;
  tags?: string[];
  headers?: HeadersInit;
  cache?: RequestCache;
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
  { searchParams, revalidate = 300, tags, headers, cache }: ApiGetOptions = {},
): Promise<T> {
  const url = new URL(endpoint.replace(/^\/+/, ""), getApiBaseUrl());

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers,
    ...(cache === "no-store"
      ? { cache: "no-store" as const }
      : {
          next: {
            revalidate,
            ...(tags?.length ? { tags } : {}),
          },
        }),
  });

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      isRecord(payload) &&
      typeof payload.message === "string" &&
      payload.message
        ? payload.message
        : `API request failed with status ${response.status}: ${url.pathname}`;
    throw new ApiRequestError(message, response.status);
  }

  return payload as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
