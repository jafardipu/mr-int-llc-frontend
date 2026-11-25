import "server-only";

import { envConfig } from "@/config";
import { isAuthEndpoint } from "@/lib/auth-session";
import {
  sendWithSession,
  withBearer,
  type SessionAuth,
} from "@/lib/server-session";

export interface ApiEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    // Raw API response body, kept for debugging.
    public readonly body?: unknown,
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

/**
 * `auth` sends the signed-in user's `Bearer` token and refreshes it when it
 * expires or the API rejects it (one retry). Don't set the Authorization
 * header yourself. Ignored for the sign-in endpoints (login, OTP, password
 * reset), which never refresh.
 */
export async function authRequest<T>(
  path: string,
  init: RequestInit = {},
  { auth }: { auth?: SessionAuth } = {},
): Promise<ApiEnvelope<T>> {
  if (!auth || isAuthEndpoint(path)) return sendRequest<T>(path, init);

  return sendWithSession(
    (accessToken) =>
      sendRequest<T>(path, {
        ...init,
        headers: withBearer(init.headers, accessToken),
      }),
    {
      auth,
      toError: (message, status) => new AuthApiError(message, status),
    },
  );
}

async function sendRequest<T>(
  path: string,
  init: RequestInit,
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
    const message =
      readMessage(payload) ??
      `The request failed (${response.status}). Please try again.`;

    console.error("[api error]", {
      path,
      status: response.status,
      message,
      body: payload,
      raw: responseText.slice(0, 2000),
    });

    throw new AuthApiError(
      message,
      response.status,
      Object.keys(payload).length > 0 ? payload : responseText.slice(0, 2000),
    );
  }

  return {
    success: true,
    message: typeof payload.message === "string" ? payload.message : "",
    data: payload.data as T,
  };
}
