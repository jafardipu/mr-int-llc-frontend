import { Download, ExternalLink, FileText, MessageSquare } from "lucide-react";
import type { PrepServiceRequest } from "@/types/prepService";
import type { PrepRequest } from "../_data/prep-requests";

type RequestType = PrepServiceRequest | PrepRequest;

function getFilename(pathOrUrl: string) {
  try {
    const parts = pathOrUrl.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "attachment";
  } catch {
    return pathOrUrl;
  }
}

export default function PrepRequestFileCard({
  request,
}: {
  request: RequestType;
}) {
  const attachments =
    "attachments" in request && Array.isArray(request.attachments)
      ? request.attachments
      : "fileName" in request && request.fileName
        ? [request.fileName]
        : [];

  const notes = "notes" in request ? request.notes : null;
  const adminNote = "adminNote" in request ? request.adminNote : null;

  return (
    <div className="space-y-4">
      {/* Attachments Section */}
      <section aria-labelledby="current-files-title">
        <h2
          id="current-files-title"
          className="mb-2 text-sm font-semibold text-[#334155]"
        >
          Attachments ({attachments.length})
        </h2>

        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((fileUrl, index) => {
              const filename = getFilename(fileUrl);
              const extension = filename.split(".").pop()?.toUpperCase() || "FILE";
              const isExternal =
                fileUrl.startsWith("http://") || fileUrl.startsWith("https://");

              return (
                <div
                  key={`${fileUrl}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-[#dfe6ef] bg-white px-3.5 py-3 shadow-xs sm:px-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#f0dfd1] text-[#a45a1a]">
                    <FileText size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#273449]">
                      {filename}
                    </p>
                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      Format: {extension}
                    </p>
                  </div>
                  {isExternal ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-gray-50 sm:px-3.5 sm:text-sm"
                    >
                      <ExternalLink size={13} />
                      View File
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-gray-400">
                      Uploaded file
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#dfe6ef] bg-white p-5 text-center text-xs text-gray-500">
            No files attached to this request.
          </div>
        )}
      </section>

      {/* Customer Notes */}
      {notes && (
        <section className="rounded-xl border border-[#dfe6ef] bg-white p-4 sm:p-5 shadow-xs">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            <MessageSquare size={14} />
            Customer Instructions / Notes
          </h3>
          <p className="mt-2 text-sm text-[#374151] leading-relaxed whitespace-pre-line">
            {notes}
          </p>
        </section>
      )}

      {/* Admin Notes */}
      {adminNote && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Admin Note
          </h3>
          <p className="mt-2 text-sm text-amber-900 leading-relaxed whitespace-pre-line">
            {adminNote}
          </p>
        </section>
      )}
    </div>
  );
}
