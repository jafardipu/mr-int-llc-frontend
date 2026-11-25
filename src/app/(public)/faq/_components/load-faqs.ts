import "server-only";

import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { getFaqs, type Faq } from "@/services/faq.service";

export type FaqLoadResult = { ok: true; faqs: Faq[] } | { ok: false };

/** Loads the FAQs for display; a failed request becomes `{ ok: false }`. */
export async function loadFaqs(): Promise<FaqLoadResult> {
  try {
    return { ok: true, faqs: await getFaqs() };
  } catch (error) {
    unstable_rethrow(error);
  }

  // The FAQ list is cached and can be part of the prerendered page. Without
  // this, a backend blip during a background re-render would cache the error
  // state for every visitor until the next revalidation. `connection()` moves
  // the failure to request time instead (it resolves at once during a request).
  await connection();
  return { ok: false };
}
