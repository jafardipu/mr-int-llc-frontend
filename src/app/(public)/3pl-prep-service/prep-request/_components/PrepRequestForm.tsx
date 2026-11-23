"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrepFilePicker from "@/components/prep-service/PrepFilePicker";
import SessionExpired from "@/app/(protected)/user/_components/SessionExpired";
import { useCreatePrepService } from "@/hooks/usePrepService";
import { readApiError } from "@/lib/apiClient";
import { validatePrepFiles } from "@/lib/prep-service";

type PrepRequestFormValues = { files: File[] };

export default function PrepRequestForm() {
  const router = useRouter();
  const createPrepService = useCreatePrepService();
  const submitError = createPrepService.error
    ? readApiError(createPrepService.error, "We couldn't submit your request. Please try again.")
    : null;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrepRequestFormValues>({ defaultValues: { files: [] } });

  const onSubmit = ({ files }: PrepRequestFormValues) => {
    createPrepService.mutate(files, {
      onSuccess: (request) => {
        router.push(`/user/pl-services/${encodeURIComponent(request.id)}`);
      },
    });
  };

  if (submitError?.statusCode === 401) {
    return <SessionExpired callbackUrl="/3pl-prep-service/prep-request" />;
  }

  const isUploading = createPrepService.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-[#dfe6ef] bg-white p-6 shadow-sm sm:p-8 lg:p-10"
      noValidate
      aria-busy={isUploading}
    >
      <div>
        <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
          Submit 3PL Prep Request
        </h1>
        <p className="mt-1 text-sm text-[#4b5563] sm:text-base">
          Upload your product files as CSV or TSV. Our team will review them
          and let you know if anything needs changing.
        </p>
      </div>

      <Controller
        name="files"
        control={control}
        rules={{ validate: validatePrepFiles }}
        render={({ field }) => (
          <PrepFilePicker
            id="prep-request-files"
            label="Files"
            files={field.value}
            onChange={field.onChange}
            error={errors.files?.message}
            disabled={isUploading}
          />
        )}
      />

      {submitError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isUploading}
        className="h-11 w-full cursor-pointer rounded-full bg-secondary-color text-sm font-semibold text-white transition-colors hover:bg-[#7f360c]"
      >
        {isUploading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Uploading files…
          </span>
        ) : (
          "Submit Prep Request"
        )}
      </Button>
    </form>
  );
}
