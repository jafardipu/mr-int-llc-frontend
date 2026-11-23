"use client";

import { useState, type DragEvent } from "react";
import { CloudUpload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PREP_ALLOWED_TYPES_LABEL,
  PREP_FILE_ACCEPT,
  PREP_MAX_FILES,
  addPrepFiles,
  formatFileSize,
} from "@/lib/prep-service";

type PrepFilePickerProps = {
  id: string;
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Form validation message (e.g. "Add at least one file."). */
  error?: string;
  disabled?: boolean;
};

/**
 * Multiple-file picker with drag and drop. It checks type, size and count as
 * files are added, so only uploadable files end up in `files`.
 */
export default function PrepFilePicker({
  id,
  label,
  files,
  onChange,
  error,
  disabled = false,
}: PrepFilePickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const hintId = `${id}-hint`;
  const isFull = files.length >= PREP_MAX_FILES;

  const add = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    const result = addPrepFiles(files, incoming);
    setRejected(result.rejected);
    if (result.files.length !== files.length) onChange(result.files);
  };

  const remove = (index: number) => {
    setRejected([]);
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    add(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-[#111827]">
          {label} <span className="text-red-500">*</span>
        </label>
        <span className="shrink-0 text-xs text-[#6b7280]">
          {files.length} / {PREP_MAX_FILES} files
        </span>
      </div>

      <input
        id={id}
        type="file"
        multiple
        accept={PREP_FILE_ACCEPT}
        disabled={disabled || isFull}
        aria-describedby={hintId}
        aria-invalid={Boolean(error)}
        className="sr-only"
        onChange={(event) => {
          add(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isFull) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors",
          disabled || isFull
            ? "cursor-not-allowed border-[#e5e7eb] bg-[#f9fafb] opacity-70"
            : isDragging
              ? "cursor-pointer border-[#9b5317] bg-[#f7e9dd]"
              : error
                ? "cursor-pointer border-red-300 bg-[#fdf4f2]"
                : "cursor-pointer border-[#ead9cb] bg-[#fcf8f5] hover:bg-[#f7eee8]",
        )}
      >
        <CloudUpload aria-hidden="true" size={24} className="text-[#a45a1a]" />
        <span className="mt-2 text-sm font-semibold text-[#283041]">
          {isFull ? "File limit reached" : "Drag and drop your files here"}
        </span>
        {!isFull && (
          <>
            <span className="mt-0.5 text-xs text-[#8790a0]">or</span>
            <span className="mt-2.5 rounded-full bg-[#9b5317] px-4 py-1.5 text-xs font-medium text-white">
              Browse Files
            </span>
          </>
        )}
      </label>

      <p id={hintId} className="text-xs text-[#6b7280]">
        {PREP_ALLOWED_TYPES_LABEL} · up to 10 MB each · 1 to {PREP_MAX_FILES} files
      </p>

      {rejected.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {rejected.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Selected files">
          {files.map((file, index) => {
            return (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-3 rounded-lg border border-[#e1e6ed] bg-white px-3.5 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded border border-[#f0dfd1] text-[#a45a1a]">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#283041]">
                    {file.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#8790a0]">
                    {formatFileSize(file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  className="cursor-pointer rounded p-1.5 text-[#8790a0] transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
