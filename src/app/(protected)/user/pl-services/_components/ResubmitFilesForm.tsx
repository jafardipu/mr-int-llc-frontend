"use client";

import { Controller, useForm } from "react-hook-form";
import { Info, Loader2, RefreshCw } from "lucide-react";
import PrepFilePicker from "@/components/prep-service/PrepFilePicker";
import { useResubmitPrepService } from "@/hooks/usePrepService";
import { readApiError } from "@/lib/apiClient";
import { validatePrepFiles } from "@/lib/prep-service";
import SessionExpired from "../../_components/SessionExpired";

type ResubmitFormValues = { files: File[] };

export default function ResubmitFilesForm({
  requestId,
  onRefresh,
}: {
  requestId: string;
  /** Reloads the request, e.g. after a 409 (it changed in the meantime). */
  onRefresh: () => void;
}) {
  const resubmit = useResubmitPrepService(requestId);
  const submitError = resubmit.error
    ? readApiError(resubmit.error, "We couldn't upload your files. Please try again.")
    : null;
  // 400: no longer awaiting a correction. 409: changed since this page loaded.
  const isStale = submitError?.statusCode === 409 || submitError?.statusCode === 400;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResubmitFormValues>({ defaultValues: { files: [] } });

  const onSubmit = ({ files }: ResubmitFormValues) => {
    resubmit.mutate(files, {
      onSuccess: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    });
  };

  if (submitError?.statusCode === 401) {
    return <SessionExpired callbackUrl={`/user/pl-services/${encodeURIComponent(requestId)}`} />;
  }

  const isUploading = resubmit.isPending;

  return (
    <section
      aria-labelledby="resubmit-title"
      className="space-y-5 rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-xs sm:p-6"
    >
      <div>
        <h2 id="resubmit-title" className="text-base font-semibold text-[#111827]">
          Upload corrected files
        </h2>
        <div className="mt-3 flex gap-2.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-3 text-sm text-[#1e40af]">
          <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>
            Resubmitting <strong>replaces all files</strong> on this request. Upload
            the complete corrected set, including files that didn&apos;t need
            changes, not only the files you changed.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-busy={isUploading}>
        <Controller
          name="files"
          control={control}
          rules={{ validate: validatePrepFiles }}
          render={({ field }) => (
            <PrepFilePicker
              id="prep-resubmit-files"
              label="Corrected files"
              files={field.value}
              onChange={field.onChange}
              error={errors.files?.message}
              disabled={isUploading}
            />
          )}
        />

        {submitError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              {submitError.message}
              {isStale && " Refresh to see the request's current status."}
            </p>
            {isStale && (
              <button
                type="button"
                onClick={() => {
                  resubmit.reset();
                  onRefresh();
                }}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-red-300 bg-white px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Refresh
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary-color px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#7f360c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Uploading files…
            </>
          ) : (
            "Resubmit files"
          )}
        </button>
      </form>
    </section>
  );
}
