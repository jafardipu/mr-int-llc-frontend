"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/actions/auth.actions";
import type { AuthActionState } from "@/actions/auth.types";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success") return;
    router.push("/verify-otp");
  }, [router, state.status]);

  return (
    <div className="w-full xl:max-w-4xl md:max-w-xl mx-auto bg-white rounded-2xl shadow-2xl p-8 ">
      <div className="text-center mb-6">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-bold text-gray-900 mb-4">
          Recover Password
        </h1>
        <p className="text-primary-black text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Please provide the email address associated with your account, and
          we&apos;ll send you verification code to reset your password.
        </p>
      </div>

      {state.status === "error" && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="example@gmail.com"
            className="w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none border-primary-black border-gray-300 focus:border-primary-black hover:border-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-secondary-color hover:bg-secondary-color/85 disabled:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform cursor-pointer disabled:cursor-not-allowed"
        >
          {pending ? "Sending..." : "Send Code"}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="text-secondary-color hover:text-secondary-color/85 text-sm font-medium transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
