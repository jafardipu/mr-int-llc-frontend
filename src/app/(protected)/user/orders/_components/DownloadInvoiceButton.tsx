"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import type { Order } from "@/services/orders.service";

function invoiceFileName(orderNumber: string) {
  const safe = orderNumber.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `invoice-${safe || "order"}.pdf`;
}

export default function DownloadInvoiceButton({ order }: { order: Order }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Loaded on click so the PDF renderer stays out of the page bundle.
      const { createInvoicePdf } = await import("./InvoicePdf");
      const blob = await createInvoicePdf(order, {
        logoUrl: new URL(logo.src, window.location.href).href,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = invoiceFileName(order.orderNumber);
      document.body.append(link);
      link.click();
      link.remove();
      // Give the browser time to start the download before releasing it.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error("Failed to generate invoice PDF", error);
      toast.error("Could not create the invoice. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      aria-busy={isGenerating}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e1e5eb] bg-white px-4 text-sm font-medium text-[#4b5563] shadow-[0_1px_3px_rgba(27,39,58,0.06)] transition-colors hover:bg-[#f9fafb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#995618] disabled:cursor-wait disabled:opacity-70 sm:mt-2 sm:w-auto"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        <Download size={16} aria-hidden="true" />
      )}
      {isGenerating ? "Preparing PDF…" : "Download Invoice"}
    </button>
  );
}
