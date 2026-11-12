"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordFieldName = keyof ChangePasswordFormValues;

type PasswordFormFieldProps = {
  name: PasswordFieldName;
  label: string;
  autoComplete: string;
  onValueChange: () => void;
};

export default function PasswordFormField({
  name,
  label,
  autoComplete,
  onValueChange,
}: PasswordFormFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { register, getValues, control, formState: { errors } } =
    useFormContext<ChangePasswordFormValues>();
  const [newPassword, confirmPassword] = useWatch({
    control,
    name: ["newPassword", "confirmPassword"],
  });
  const error = errors[name];
  const showMatch =
    name === "confirmPassword" &&
    Boolean(confirmPassword) &&
    newPassword === confirmPassword;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={name}
          className="text-sm font-medium text-[#374151] sm:text-base"
        >
          {label} <span className="text-red-500">*</span>
        </label>
        {name === "currentPassword" && (
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#a45a1a] transition-colors hover:text-[#81430f] sm:text-base"
          >
            Forgot current password?
          </Link>
        )}
      </div>

      <div className="relative">
        <LockKeyhole
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa4b2]"
        />
        <input
          id={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...register(name, {
            required: `${label} is required.`,
            ...(name !== "currentPassword" && {
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters.",
              },
            }),
            ...(name === "newPassword" && {
              deps: "confirmPassword",
            }),
            ...(name === "confirmPassword" && {
              validate: (value) =>
                value === getValues("newPassword") ||
                "Passwords do not match.",
            }),
            onChange: onValueChange,
          })}
          className={`h-12 w-full rounded-xl border bg-white pl-12 pr-12 text-base text-[#374151] outline-none transition placeholder:text-[#9ca3af] focus:border-[#a45a1a] focus:ring-2 focus:ring-[#a45a1a]/15 sm:h-13.25 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-[#dfe3e8]"
          }`}
        />
        {showMatch ? (
          <Check
            size={17}
            aria-label="Passwords match"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={isVisible}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#9aa4b2] transition-colors hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45a1a]"
          >
            {isVisible ? (
              <EyeOff size={17} aria-hidden="true" />
            ) : (
              <Eye size={17} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="mt-1.5 text-sm text-red-600"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
