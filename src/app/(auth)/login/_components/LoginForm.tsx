"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import logo from "@/assets/logo.png";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth.actions";
import type { AuthActionState } from "@/actions/auth.types";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl");

  useEffect(() => {
    if (state.status !== "success") return;

    const destination =
      callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/user/dashboard";
    router.replace(destination);
  }, [callbackUrl, router, state.status]);

  return (
    <div className="w-full xl:max-w-4xl md:max-w-xl mx-auto rounded-lg bg-white p-8 shadow-lg">
      <div className="mb-1 text-center">
        <div className="inline-flex flex-col items-center">
          <Link href="/">
            <Image
              src={logo}
              alt="logo"
              width={1200}
              height={1200}
              className="w-32"
            />
          </Link>
        </div>
      </div>

      <h1 className="mb-2 text-center lg:text-3xl md:text-2xl text-xl font-bold text-gray-900">
        Welcome Back
      </h1>
      <p className="mb-6 text-center">Sign in to your account</p>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mb-4 rounded-md p-3 text-sm ${
            state.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="example@gmail.com"
            required
            className="w-full rounded-lg border border-[#3D3D3D] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-[#3D3D3D] px-4 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="rememberMe"
            className="flex items-center gap-2 text-sm text-primary-black cursor-pointer"
          >
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 transition focus:ring-blue-500 accent-primary-color"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#2563EB] hover:text-blue-700"
          >
            Forgot Password?
          </Link>
        </div>

        <p className="mb-4 text-center text-sm text-[#1E1E1E]">
          Don&apos;t have Account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-base text-[#2563EB] hover:text-blue-700"
          >
            Sign Up
          </Link>
        </p>

        <div>
          <Link
            href="/"
            className="block w-full text-center font-medium text-secondary-color hover:text-secondary-color/80 cursor-pointer"
          >
            Continue without Sign In
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-secondary-color cursor-pointer px-4 py-2.5 font-semibold text-white transition hover:bg-secondary-color/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
