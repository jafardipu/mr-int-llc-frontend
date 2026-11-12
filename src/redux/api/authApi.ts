import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createUser: build.mutation({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    login: build.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth, tagTypes.property, tagTypes.profile],
    }),
    forgetPassword: build.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    verifyOtp: build.mutation({
      query: ({ otp, token }: { otp: string; token: string }) => ({
        url: "/otp/verify-otp",
        method: "POST",
        body: { otp },
        headers: { token },
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    resetPassword: build.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
    changePassword: build.mutation({
      query: (data) => ({
        url: "/auth/change-password",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useLoginMutation,
  useForgetPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
