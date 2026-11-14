"use client";

import { useState, type DragEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { CloudUpload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatePrepService } from "@/hooks/usePrepService";

type PrepRequestFormValues = {
  serviceType: string;
  notes: string;
  files: File[];
};

const SERVICE_TYPE_OPTIONS = [
  "FBA Labeling",
  "Poly Bagging",
  "Bundling & Kitting",
  "Carton Compliance",
  "Full Prep & Inspection",
  "Custom Prep",
];

const fileInputId = "prep-request-files";

const isSupportedFile = (file: File) =>
  /\.(csv|tsv|pdf|xlsx|xls|png|jpg|jpeg)$/i.test(file.name);

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PrepRequestForm() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const createPrepService = useCreatePrepService();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PrepRequestFormValues>({
    defaultValues: {
      serviceType: "FBA Labeling",
      notes: "",
      files: [],
    },
  });

  const files = useWatch({ control, name: "files" }) || [];

  useEffect(() => {
    register("files", {
      validate: {
        maxCount: (selected) =>
          !selected ||
          selected.length <= 8 ||
          "You can upload a maximum of 8 files.",
      },
    });
  }, [register]);

  const addFiles = (selectedFiles: File[]) => {
    const combined = [...files, ...selectedFiles].filter(
      (file, index, allFiles) =>
        allFiles.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified
        ) === index
    );

    if (combined.length > 8) {
      setValue("files", combined.slice(0, 8), {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue("files", combined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (indexToRemove: number) => {
    setValue(
      "files",
      files.filter((_, index) => index !== indexToRemove),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const onSubmit = async (values: PrepRequestFormValues) => {
    try {
      await createPrepService.mutateAsync({
        serviceType: values.serviceType,
        notes: values.notes.trim() || undefined,
        attachments: values.files,
      });

      router.push("/user/pl-services");
    } catch {
      // Error handled by mutation onError toast
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-3xl mx-auto space-y-6 rounded-2xl border border-[#dfe6ef] bg-white p-6 sm:p-8 lg:p-10 shadow-sm"
      noValidate
    >
      <div>
        <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
          Submit 3PL Prep Request
        </h1>
        <p className="mt-1 text-sm text-[#4b5563] sm:text-base">
          Fill in your service requirements and upload your inventory files.
        </p>
      </div>

      {/* Service Type */}
      <div className="space-y-1.5">
        <label
          htmlFor="serviceType"
          className="block text-sm font-semibold text-[#111827]"
        >
          Service Type <span className="text-red-500">*</span>
        </label>
        <select
          id="serviceType"
          {...register("serviceType", {
            required: "Please select a service type",
          })}
          className="h-11 w-full rounded-xl border border-[#e1e5eb] bg-white px-4 text-sm text-[#374151] shadow-xs outline-none focus:border-[#995618] focus:ring-2 focus:ring-[#995618]/15"
        >
          {SERVICE_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.serviceType && (
          <p className="text-xs text-red-600">{errors.serviceType.message}</p>
        )}
      </div>

      {/* Notes / Instructions */}
      <div className="space-y-1.5">
        <label
          htmlFor="notes"
          className="block text-sm font-semibold text-[#111827]"
        >
          Instructions / Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Include any specific preparation instructions, labeling guidelines, or deadlines..."
          {...register("notes")}
          className="w-full rounded-xl border border-[#e1e5eb] bg-white p-4 text-sm text-[#374151] shadow-xs outline-none focus:border-[#995618] focus:ring-2 focus:ring-[#995618]/15 placeholder:text-[#9ca3af]"
        />
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-[#111827]">
            Upload Attachments (CSV, TSV, PDF, XLSX - max 8 files)
          </label>
          <span className="text-xs text-[#6b7280]">
            {files.length} / 8 files
          </span>
        </div>

        <input
          id={fileInputId}
          type="file"
          accept=".csv,.tsv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,text/csv,text/tab-separated-values"
          multiple
          className="sr-only"
          aria-label="Upload prep files"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <label
          htmlFor={fileInputId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget;
            if (
              !(nextTarget instanceof Node) ||
              !event.currentTarget.contains(nextTarget)
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors ${
            isDragging
              ? "border-[#9b5317] bg-[#f7e9dd]"
              : errors.files
                ? "border-red-300 bg-[#f7eee8]"
                : "border-[#ead9cb] bg-[#fcf8f5] hover:bg-[#f7eee8]"
          }`}
        >
          <CloudUpload aria-hidden="true" size={24} className="text-[#a45a1a]" />
          <span className="mt-2 text-sm font-semibold text-[#283041]">
            Drag and drop your file here
          </span>
          <span className="mt-0.5 text-xs text-[#8790a0]">or</span>
          <span className="mt-2.5 rounded-full bg-[#9b5317] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#81430f]">
            Browse Files
          </span>
        </label>

        {errors.files && (
          <p role="alert" className="text-xs text-red-600">
            {errors.files.message}
          </p>
        )}
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className={`flex items-center gap-3 rounded-lg border bg-white px-3.5 py-2.5 ${
                isSupportedFile(file) ? "border-[#e1e6ed]" : "border-red-300"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded border border-[#f0dfd1] text-[#a45a1a]">
                <FileText size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[#283041]">
                  {file.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8790a0]">
                  {formatFileSize(file.size)} ·{" "}
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="rounded p-1 text-[#8790a0] transition-colors hover:text-red-600 cursor-pointer"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={createPrepService.isPending}
        className="h-11 w-full rounded-full bg-secondary-color text-sm font-semibold text-white transition-colors hover:bg-[#7f360c] cursor-pointer"
      >
        {createPrepService.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Submitting request...
          </span>
        ) : (
          "Submit Prep Request"
        )}
      </Button>
    </form>
  );
}
