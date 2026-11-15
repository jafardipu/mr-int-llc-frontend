import { FileText } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { looksLikeHtml, sanitizeHtml } from "@/lib/sanitize-html";

export default function CmsContent({
  content,
  emptyMessage = "Content coming soon.",
  className = "space-y-5 pb-12 text-sm leading-[1.5] text-[#555] sm:space-y-6 sm:text-base",
}: {
  content: string | null | undefined;
  emptyMessage?: string;
  className?: string;
}) {
  const value = content?.trim();
  if (!value) {
    return (
      <EmptyState
        icon={FileText}
        message={emptyMessage}
        className="min-h-48 rounded-2xl border border-[#e3e7ec] bg-white"
      />
    );
  }

  if (looksLikeHtml(value)) {
    return (
      <article
        className={`cms-content prose prose-neutral max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
      />
    );
  }

  return (
    <article className={className}>
      {value.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </article>
  );
}
