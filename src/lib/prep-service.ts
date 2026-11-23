import type { PrepServiceStatus } from "@/types/prepService";

/* ---------- Status ---------- */

export const PREP_STATUS_LABELS: Record<PrepServiceStatus, string> = {
  under_review: "Under review",
  correction_required: "Needs correction",
  completed: "Approved",
};

/** Short reference shown in lists, e.g. "#3F9A12BC". */
export function prepRequestRef(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

export function formatPrepDate(value: string, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

/* ---------- Upload rules: CSV and TSV files only ---------- */

export const PREP_MAX_FILES = 8;
export const PREP_MAX_FILE_BYTES = 10 * 1024 * 1024;

const allowedExtensions = ["csv", "tsv"];

export const PREP_ALLOWED_TYPES_LABEL = "CSV or TSV";

/** For the file input's `accept` attribute. */
export const PREP_FILE_ACCEPT = [
  ".csv",
  ".tsv",
  "text/csv",
  "text/tab-separated-values",
].join(",");

function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why a file can't be uploaded, or null when it's fine. */
export function prepFileProblem(file: File): string | null {
  if (!allowedExtensions.includes(fileExtension(file.name))) {
    return `${file.name}: this file type isn't allowed. Use ${PREP_ALLOWED_TYPES_LABEL}.`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > PREP_MAX_FILE_BYTES) {
    return `${file.name} is ${formatFileSize(file.size)}. Each file can be at most 10 MB.`;
  }
  return null;
}

function sameFile(a: File, b: File) {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * Adds picked files to the selection. Invalid files and files over the limit
 * are left out and explained in `rejected`; exact duplicates are skipped.
 */
export function addPrepFiles(current: File[], incoming: File[]) {
  const files = [...current];
  const rejected: string[] = [];

  for (const file of incoming) {
    if (files.some((existing) => sameFile(existing, file))) continue;
    const problem = prepFileProblem(file);
    if (problem) {
      rejected.push(problem);
    } else if (files.length >= PREP_MAX_FILES) {
      rejected.push(`${file.name} wasn't added. You can upload up to ${PREP_MAX_FILES} files.`);
    } else {
      files.push(file);
    }
  }

  return { files, rejected };
}

/** Form-level check before sending: 1 to 8 valid files. */
export function validatePrepFiles(files: File[]): true | string {
  if (files.length === 0) return "Add at least one file.";
  if (files.length > PREP_MAX_FILES) {
    return `You can upload up to ${PREP_MAX_FILES} files.`;
  }
  const problem = files.map(prepFileProblem).find(Boolean);
  return problem ?? true;
}

/* ---------- Attachments (URLs from the server) ---------- */

/** The file name is the last path segment of the URL. */
export function attachmentName(url: string) {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split(/[?#]/)[0];
  }
  const segment = path.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(segment) || "attachment";
  } catch {
    return segment || "attachment";
  }
}

export function attachmentExtension(url: string) {
  return fileExtension(attachmentName(url));
}

export function isImageAttachment(url: string) {
  return ["jpg", "jpeg", "png", "webp"].includes(attachmentExtension(url));
}

/** Only http(s) URLs become links. */
export function safeAttachmentUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}
