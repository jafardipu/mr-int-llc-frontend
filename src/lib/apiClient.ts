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

export default apiClient;

