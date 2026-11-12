/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "../features/authSlice";
import { tagTypesList } from "../tagTypes";
import { envConfig } from "@/config";

const baseQuery = fetchBaseQuery({
  baseUrl: envConfig.baseUrl,
  credentials: "include",
});

const baseQueryWithRefreshToken = async (
  args: any,
  api: any,
  extraOptions: any,
) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    api.dispatch(logout());
  } else if (result?.error?.status === 403) {
    // Handle 403 status for blocked user
    // api.dispatch(logout());

    console.log("Your account has been blocked");
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRefreshToken,

  tagTypes: tagTypesList,
  endpoints: () => ({}),
});
