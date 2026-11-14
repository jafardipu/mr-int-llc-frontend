"use client";

import { useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CloudUpload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PrepRequestFileCard from "./PrepRequestFileCard";
import PrepRequestHeader from "./PrepRequestHeader";
import type { PrepServiceRequest } from "@/types/prepService";
import type { PrepRequest } from "../_data/prep-requests";
import { useCreatePrepService } from "@/hooks/usePrepService";

type RequestType = PrepServiceRequest | PrepRequest;

const acceptedFile = /\.(csv|tsv|pdf|xlsx|xls|png|jpg|jpeg)$/i;

export default function CorrectionUploadPage({
  request,
}: {
  request: RequestType;
}) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");
  const createPrepService = useCreatePrepService();

  const adminNote =
    "adminNote" in request && request.adminNote
      ? request.adminNote
      : "correctionNotes" in request && request.correctionNotes?.length
        ? request.correctionNotes.join("; ")
        : "The admin has requested corrections for this request. Please upload updated files.";

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!acceptedFile.test(file.name)) {
      setSelectedFile(null);
      toast.error("Please upload a supported file (CSV, TSV, PDF, XLSX, images).");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleSubmitCorrection = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    try {
      const serviceType =
        "serviceType" in request && request.serviceType
          ? `${request.serviceType} (Correction)`
          : "Correction Submission";

      await createPrepService.mutateAsync({
        serviceType,
        notes: `Correction for Request #${request.id}: ${correctionNote.trim() || "Updated files attached."}`,
        attachments: [selectedFile],
      });

      router.push("/user/pl-services");
    } catch {
      // Handled by mutation onError toast
    }
  };

  return (
    <main className="w-full space-y-6">
      <PrepRequestHeader request={request} />

      {/* Alert Header */}
      <section
        role="status"
        className="flex gap-3 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-4 text-[#c2410c] sm:px-5"
      >
        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Correction Required</p>
          <p className="mt-1 text-sm leading-5">
            The admin has reviewed your submission and requested corrections.
          </p>
        </div>
      </section>

      {/* Admin Notes Section */}
      <section className="rounded-xl border border-[#dfe6ef] bg-white px-4 py-4 shadow-xs sm:px-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
          ADMIN&apos;S CORRECTION INSTRUCTIONS
        </h2>
        <div className="mt-3 rounded-lg bg-amber-50/70 border border-amber-200 p-3.5 text-sm text-amber-900 leading-relaxed whitespace-pre-line">
          {adminNote}
        </div>
      </section>

      <div className="space-y-6">
        <PrepRequestFileCard request={request} />

        <section
          aria-labelledby="upload-corrected-file-title"
          className="rounded-xl border border-[#dfe6ef] bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <h2
            id="upload-corrected-file-title"
            className="text-base font-semibold text-[#111827]"
          >
            Upload Corrected File
          </h2>

          <div>
            <label
              htmlFor="correction-note"
              className="block text-xs font-semibold text-[#374151] mb-1.5"
            >
              Response / Note to Admin (Optional)
            </label>
            <textarea
              id="correction-note"
              rows={2}
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="Explain the changes made in this corrected submission..."
              className="w-full rounded-xl border border-[#e1e5eb] bg-white p-3 text-sm text-[#374151] outline-none focus:border-[#995618] focus:ring-2 focus:ring-[#995618]/15"
            />
          </div>

          <input
            id="corrected-prep-file"
            type="file"
            accept=".csv,.tsv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,text/csv,text/tab-separated-values"
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
          <label
            htmlFor="corrected-prep-file"
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
            className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-[#9b5317] bg-[#f4e5d9]"
                : "border-[#ead9cb] bg-[#fcf8f5] hover:bg-[#f7eee8]"
            }`}
          >
            <CloudUpload
              size={24}
              aria-hidden="true"
              className="text-[#a45a1a]"
            />
            <span className="mt-2 text-sm font-semibold text-[#283041]">
              Drag and drop your corrected file here
            </span>
            <span className="mt-0.5 text-xs text-[#8790a0]">or</span>
            <span className="mt-2 rounded-full bg-[#9b5317] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#81430f]">
              Browse Files
            </span>
          </label>

          {selectedFile && (
            <div className="flex items-center gap-3 rounded-lg border border-[#e1e6ed] bg-white px-3.5 py-2.5">
              <FileText
                size={18}
                aria-hidden="true"
                className="shrink-0 text-[#a45a1a]"
              />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#273449]">
                {selectedFile.name}
              </p>
              <p className="shrink-0 text-xs text-[#8790a0]">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmitCorrection}
            disabled={!selectedFile || createPrepService.isPending}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-secondary-color px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7f360c] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {createPrepService.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting correction...
              </>
            ) : (
              "Submit Corrected File"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
