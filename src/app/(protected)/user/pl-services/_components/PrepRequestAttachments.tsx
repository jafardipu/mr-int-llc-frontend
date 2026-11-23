"use client";

import { useState } from "react";
import { ExternalLink, FileSpreadsheet, FileText, ImageIcon } from "lucide-react";
import {
  attachmentExtension,
  attachmentName,
  isImageAttachment,
  safeAttachmentUrl,
} from "@/lib/prep-service";

function FileIcon({ url }: { url: string }) {
  const extension = attachmentExtension(url);
  const Icon = ["csv", "xls", "xlsx"].includes(extension)
    ? FileSpreadsheet
    : isImageAttachment(url)
      ? ImageIcon
      : FileText;
  return (
    <span className="flex size-full flex-col items-center justify-center gap-1.5 text-[#a45a1a]">
      <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6a4f]">
        {extension || "file"}
      </span>
    </span>
  );
}

function Preview({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!isImageAttachment(url) || failed) return <FileIcon url={url} />;
  return (
    // Attachment hosts vary, so this is a plain <img> rather than next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover"
    />
  );
}

export default function PrepRequestAttachments({
  attachments,
  title = "Files",
}: {
  attachments: string[];
  title?: string;
}) {
  return (
    <section aria-labelledby="prep-files-title" className="space-y-3">
      <h2 id="prep-files-title" className="text-base font-semibold text-[#111827]">
        {title} ({attachments.length})
      </h2>

      {attachments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#dfe6ef] bg-white p-5 text-center text-sm text-[#6b7280]">
          No files are attached to this request.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {attachments.map((url, index) => {
            const name = attachmentName(url);
            const href = safeAttachmentUrl(url);
            const content = (
              <>
                <span className="block aspect-4/3 overflow-hidden border-b border-[#edf0f3] bg-[#fcf8f5]">
                  <Preview url={url} name={name} />
                </span>
                <span className="flex items-center gap-1.5 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#273449]" title={name}>
                    {name}
                  </span>
                  {href && (
                    <ExternalLink size={13} aria-hidden="true" className="shrink-0 text-[#94a3b8]" />
                  )}
                </span>
              </>
            );

            return (
              <li key={`${url}-${index}`}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${name} in a new tab`}
                    className="block overflow-hidden rounded-xl border border-[#dfe6ef] bg-white shadow-xs transition hover:border-[#995618]/50 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618]"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#dfe6ef] bg-white">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
