import axios from "axios";
import Cookies from "js-cookie";
import { accessTokenCookie } from "./auth-cookies";
import { getAccessTokenAction } from "@/actions/auth-token.action";

const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:5000/api/v1";
  return url.replace(/\/+$/, "");
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  let token: string | null | undefined = undefined;

  if (typeof window !== "undefined") {
    token =
      Cookies.get(accessTokenCookie) ||
      Cookies.get("accessToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");

    if (!token) {
      try {
        token = await getAccessTokenAction();
      } catch {
        // Fallback or unauthenticated
      }
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
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

