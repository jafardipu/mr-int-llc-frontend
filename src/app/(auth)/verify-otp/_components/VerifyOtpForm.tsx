"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  resendSignupOtpAction,
  verifySignupOtpAction,
} from "@/actions/auth.actions";
import type { AuthActionState } from "@/actions/auth.types";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function VerifyOTpForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    verifySignupOtpAction,
    initialState,
  );
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendSignupOtpAction,
    initialState,
  );
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [inputError, setInputError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;

    router.replace(state.flow === "reset" ? "/reset-password" : "/user/dashboard");
  }, [router, state.flow, state.status]);

  useEffect(() => {
    if (resendState.status !== "success") return;
    setCooldown(60);
  }, [resendState.message, resendState.status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextInputs = [...codeInputs];
    nextInputs[index] = value.slice(-1);
    setCodeInputs(nextInputs);
    setInputError("");

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !codeInputs[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const validateCode = (event: FormEvent<HTMLFormElement>) => {
    if (codeInputs.join("").length !== 6) {
      event.preventDefault();
      setInputError("Please enter all 6 digits.");
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    setCodeInputs(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    setInputError("");
    const nextIndex = Math.min(pasted.length, 5);
    document.getElementById(`code-${nextIndex}`)?.focus();
  };

  return (
    <div className="w-full xl:max-w-4xl md:max-w-xl mx-auto rounded-2xl bg-white p-8 shadow-xl">
      <form action={formAction} onSubmit={validateCode} className="text-center">
        <h1 className="mb-3 lg:text-3xl md:text-2xl text-xl font-bold text-primary-black">
          Verify your email
        </h1>
        <p className="mb-4 text-primary-black max-w-xl mx-auto">
          Enter the 6-digit verification code sent to{" "}
          {email || "the email address used to sign up"}.
        </p>

        <input type="hidden" name="otp" value={codeInputs.join("")} />
        <div className="mb-8">
          <div className="flex justify-center gap-2">
            {codeInputs.map((value, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={value}
                aria-label={`Verification digit ${index + 1}`}
                onChange={(event) =>
                  handleInputChange(index, event.target.value)
                }
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                className="size-14 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-center text-xl font-semibold transition-colors focus:border-primary-black focus:outline-none hover:border-gray-400"
              />
            ))}
          </div>
          {(inputError || state.status === "error") && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {inputError || state.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || !email}
          className="w-full rounded-lg bg-secondary-color py-2.5 font-semibold text-white transition-colors hover:bg-secondary-color/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Verifying..." : "Verify Code"}
        </button>
      </form>
      <form action={resendFormAction} className="mt-4 text-center">
        <button
          type="submit"
          disabled={resendPending || !email || cooldown > 0}
          className="font-medium text-secondary-color hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resendPending
            ? "Sending..."
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>
        {resendState.message && (
          <p
            role={resendState.status === "error" ? "alert" : "status"}
            className={`mt-2 text-sm ${
              resendState.status === "error"
                ? "text-red-600"
                : "text-green-700"
            }`}
          >
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
