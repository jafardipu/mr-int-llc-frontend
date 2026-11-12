"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUserAction } from "@/actions/auth.actions";
import type { AuthActionState } from "@/actions/auth.types";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(
    registerUserAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    router.push("/verify-otp");
  }, [router, state.status]);

  const validatePasswords = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      event.preventDefault();
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
  };

  return (
    <div className="w-full xl:max-w-4xl md:max-w-xl mx-auto rounded-lg bg-white p-8 shadow-lg">
      <div className="mb-2 text-center">
        <Link href="/">
          <div className="inline-flex flex-col items-center">
            <Image
              src={logo}
              alt="BetterOffMarket Logo"
              width={1200}
              height={1200}
              className="w-32"
            />
          </div>
        </Link>
      </div>

      <h1 className="mb-2 text-center lg:text-3xl md:text-2xl text-xl font-bold text-gray-900">
        You&apos;re in the Right Place
      </h1>
      <p className="mb-6 text-center">Create a free account for full access</p>

      {state.status === "error" && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}
      {passwordError && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {passwordError}
        </p>
      )}

      <form action={formAction} onSubmit={validatePasswords} className="space-y-5">
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Select User
          </label>
          <div className="relative">
            <select
              id="role"
              name="role"
              required
              defaultValue="retail"
              className="w-full appearance-none rounded-lg border border-[#3D3D3D] bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="retail">Retail Customer</option>
              <option value="wholesale">Wholesale Customer</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            minLength={2}
            autoComplete="name"
            placeholder="Enter Full Name"
            required
            className="w-full rounded-lg border border-[#3D3D3D] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

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
              autoComplete="new-password"
              minLength={6}
              placeholder="••••••••"
              required
              onChange={() => setPasswordError("")}
              className="w-full rounded-lg border border-[#3D3D3D] px-4 py-2.5 pr-12 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={6}
              placeholder="••••••••"
              required
              onChange={() => setPasswordError("")}
              className="w-full rounded-lg border border-[#3D3D3D] px-4 py-2.5 pr-12 text-gray-900 placeholder-gray-400 transition focus:border-[#3D3D3D] focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((shown) => !shown)}
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <label
          htmlFor="agreeToTerms"
          className="flex mt-2 gap-2 text-sm text-gray-700"
        >
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            required
            checked={agreeToTerms}
            onChange={(event) => setAgreeToTerms(event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 transition focus:ring-blue-500 accent-secondary-color"
          />
          <span className="text-[#1E1E1E]">
            I have read and agree to the BetterOffMarket{" "}
            <Link
              href="/terms-conditions"
              className="text-secondary-color hover:text-blue-900 font-semibold underline"
            >
              Terms &amp; Conditions
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={!agreeToTerms || pending}
          className="w-full rounded-lg bg-secondary-color px-4 py-2.5 font-semibold text-white transition hover:bg-secondary-color/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-700">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-base text-[#2563EB] hover:text-blue-900"
        >
          Sign In
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-gray-700">
        <Link
          href="/"
          className="font-medium text-secondary-color hover:text-secondary-color/90"
        >
          Continue without Sign In
        </Link>
      </p>
    </div>
  );
}
