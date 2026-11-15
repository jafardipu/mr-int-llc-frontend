"use client";

import { Download } from "lucide-react";

export default function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e1e5eb] bg-white px-4 text-sm font-medium text-[#4b5563] shadow-[0_1px_3px_rgba(27,39,58,0.06)] transition-colors hover:bg-[#f9fafb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] disabled:opacity-70 sm:mt-2 sm:w-auto"
    >
      <Download size={16} aria-hidden="true" />
      Download Invoice
    </button>
  );
}
