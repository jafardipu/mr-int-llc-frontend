import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  getAccessTokenAction,
  refreshSessionAction,
} from "@/actions/auth-token.action";
import {
  classifyAuthFailure,
  isAuthEndpoint,
  offlineMessage,
  permissionDeniedMessage,
  type RefreshSessionResult,
} from "./auth-session";
import { endClientSession } from "./client-session";
import { goToWholesaleFeeIfRequired } from "./wholesale-fee";

const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:5000/api/v1";
  return url.replace(/\/+$/, "");
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  // The token goes in the Authorization header. The API's own cookies are
  // not relied on: browsers drop them in production, and a stale one could
  // win over the header.
  withCredentials: false,
});

type AuthRequestConfig = InternalAxiosRequestConfig & {
  /** The token this request was sent with. */
  _accessToken?: string;
  /** Already retried once after a refresh. */
  _authRetried?: boolean;
};

apiClient.interceptors.request.use(async (config: AuthRequestConfig) => {
  if (typeof window === "undefined" || isAuthEndpoint(config.url ?? "")) {
    return config;
  }

  // The cookie is httpOnly, so ask the server. The proxy runs before that
  // action, so a token that expires within 24 hours is already refreshed.
  // A retry carries the refreshed token already.
  if (!config._accessToken) {
    try {
      config._accessToken = (await getAccessTokenAction()) ?? undefined;
    } catch {
      // Offline: send it without a token; the response says what happened.
    }
  }
  if (config._accessToken) {
    config.headers.Authorization = `Bearer ${config._accessToken}`;
  }
  return config;
});

let refreshing: Promise<RefreshSessionResult> | null = null;

/** One refresh at a time: requests failing together wait for the same one. */
function refreshOnce(failedAccessToken: string | undefined) {
  refreshing ??= refreshSessionAction(failedAccessToken)
    .catch((): RefreshSessionResult => ({ status: "unreachable" }))
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function readMessage(data: unknown) {
  return typeof data === "object" && data !== null && "message" in data
    ? data.message
    : undefined;
}

/**
 * The client's single auth error handler (see `classifyAuthFailure`):
 * - 402: wholesale fee unpaid. Go pay it; leave the request pending so no
 *   caller shows an error. Never a refresh or a logout.
 * - 401 expired/invalid/no token: refresh once, retry once. A failed refresh
 *   or a second 401 ends the session.
 * - 401 blocked / not verified, 404 deleted: end the session.
 * - 401 role not allowed: a 403 "no permission" error; the session stays.
 * - No response: offline. Not a logout; tokens are kept.
 */
apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error;
  const response = error.response;
  const config = error.config as AuthRequestConfig | undefined;

  if (goToWholesaleFeeIfRequired(response?.status)) {
    return new Promise<never>(() => {});
  }
  if (!response || !config || isAuthEndpoint(config.url ?? "")) throw error;

  const failure = classifyAuthFailure(response.status, readMessage(response.data));
  if (!failure || failure.action === "wholesale-fee") throw error;

  if (failure.action === "forbidden") {
    throw new AxiosError(
      permissionDeniedMessage,
      error.code,
      config,
      error.request,
      {
        ...response,
        status: 403,
        data: { success: false, message: permissionDeniedMessage },
      },
    );
  }

  if (failure.action === "end-session") {
    void endClientSession({ reason: failure.reason });
    throw error;
  }

  // Expired or invalid token. Never loop: a retried request that still gets
  // a 401 ends the session.
  if (config._authRetried) {
    void endClientSession({ reason: "expired" });
    throw error;
  }

  const result = await refreshOnce(config._accessToken);
  if (result.status === "unreachable") {
    throw new AxiosError(offlineMessage, AxiosError.ERR_NETWORK, config);
  }
  if (result.status === "ended") {
    void endClientSession({ reason: "expired" });
    throw error;
  }

  config._authRetried = true;
  config._accessToken = result.accessToken;
  config.headers.Authorization = `Bearer ${result.accessToken}`;
  return apiClient(config);
});

export type ApiClientError = { message: string; statusCode?: number };

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * Reads a backend error: `{ success: false, message, errorSources: [{ path, message }] }`.
 * Upload errors arrive as message "Validation Error" with the real reason in
 * `errorSources[0].message`, so that one wins when present.
 */
export function readApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): ApiClientError {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    if (!error.response) {
      return {
        message: "Couldn't reach the server. Check your connection and try again.",
      };
    }

    const body: unknown = error.response.data;
    if (body && typeof body === "object") {
      const { errorSources, message } = body as Record<string, unknown>;
      const firstSource =
        Array.isArray(errorSources) && errorSources[0] && typeof errorSources[0] === "object"
          ? nonEmptyString((errorSources[0] as Record<string, unknown>).message)
          : null;
      const text = firstSource ?? nonEmptyString(message);
      if (text) return { message: text, statusCode };
    }
    return { message: fallback, statusCode };
  }

  if (error instanceof Error && error.message) return { message: error.message };
  return { message: fallback };
}

export default apiClient;

