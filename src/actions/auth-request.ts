import "server-only";

import { envConfig } from "@/config";

export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessage(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }
  return undefined;
}

export async function authRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const baseUrl = (envConfig.serverUrl ?? envConfig.baseUrl)?.replace(
    /\/+$/,
    "",
  );
  if (!baseUrl) {
    throw new AuthApiError("The API base URL is not configured.", 0);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
    });
  } catch {
    throw new AuthApiError(
      "Unable to connect to the API. Please try again.",
      0,
    );
  }

  const responseText = await response.text();
  let payload: Record<string, unknown> = {};

  if (responseText) {
    try {
      const parsed: unknown = JSON.parse(responseText);
      if (!isRecord(parsed)) {
        throw new AuthApiError(
          "The API returned an invalid response.",
          response.status,
        );
      }
      payload = parsed;
    } catch (error) {
      if (error instanceof AuthApiError) throw error;
      if (response.ok) {
        throw new AuthApiError(
          "The API returned an invalid response.",
          response.status,
        );
      }
    }
  }

  if (!response.ok || payload.success === false) {
    throw new AuthApiError(
      readMessage(payload) ??
        `The request failed (${response.status}). Please try again.`,
      response.status,
    );
  }

  return {
    success: true,
    message: typeof payload.message === "string" ? payload.message : "",
    data: payload.data as T,
  };
}
