"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { changePasswordAction } from "@/actions/auth.actions";
import PasswordFormField, {
  type ChangePasswordFormValues,
  type PasswordFieldName,
} from "./PasswordFormField";

const passwordFields: {
  name: PasswordFieldName;
  label: string;
  autoComplete: string;
}[] = [
  {
    name: "currentPassword",
    label: "Current Password",
    autoComplete: "current-password",
  },
  {
    name: "newPassword",
    label: "New Password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm New Password",
    autoComplete: "new-password",
  },
];

export default function ChangePasswordForm() {
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const form = useForm<ChangePasswordFormValues>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setSubmitMessage("");
    setSubmitError("");
    const result = await changePasswordAction({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });

    if (result.status === "error") {
      setSubmitError(result.message);
      return;
    }

    form.reset();
    setSubmitMessage(result.message);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="w-full space-y-4 sm:space-y-5"
      >
        {passwordFields.map((field) => (
          <PasswordFormField
            key={field.name}
            {...field}
            onValueChange={() => {
              setSubmitMessage("");
              setSubmitError("");
            }}
          />
        ))}

        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
        {submitMessage && (
          <p role="status" className="text-sm text-[#348267]">
            {submitMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-5 min-h-12 w-full rounded-full bg-[#a45a1a] px-5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#81430f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45a1a] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:min-h-14 sm:text-base"
        >
          {form.formState.isSubmitting ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </form>
    </FormProvider>
  );
}
