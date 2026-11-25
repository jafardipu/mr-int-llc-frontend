import "server-only";

import { apiGet } from "@/services/api-service";
import {
  collectPages,
  isRecord,
  parseApiPage,
  type ApiPage,
} from "@/services/api-response";

const faqTag = "site-faqs";
// Short enough that admin edits and reordering show up within minutes.
const faqRevalidate = 300;
// The API's default page size is 10; ask for everything in as few pages as possible.
const faqPageSize = 100;

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

function readFaq(value: unknown): Faq | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.question !== "string" ||
    !value.question.trim() ||
    typeof value.answer !== "string" ||
    !value.answer.trim()
  ) {
    return null;
  }

  return { id: value.id, question: value.question, answer: value.answer };
}

async function getFaqPage(page: number, limit: number): Promise<ApiPage<Faq>> {
  const result: unknown = await apiGet("faq", {
    searchParams: { page, limit },
    tags: [faqTag],
    revalidate: faqRevalidate,
  });

  // Skip a malformed entry rather than failing the whole list.
  const pageResult = parseApiPage(result, "faq", isRecord);
  return {
    ...pageResult,
    data: pageResult.data.flatMap((item) => {
      const faq = readFaq(item);
      return faq ? [faq] : [];
    }),
  };
}

/**
 * Every site-wide FAQ, in the order the admin chose. The API returns them
 * already ordered, so never sort this list.
 */
export async function getFaqs(): Promise<Faq[]> {
  return collectPages(getFaqPage, faqPageSize);
}
