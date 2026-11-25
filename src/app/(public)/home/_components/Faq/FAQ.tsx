import { Suspense, type ReactNode } from "react";
import FAQContainer from "@/app/(public)/faq/_components/FAQContainer";
import FaqError from "@/app/(public)/faq/_components/FaqError";
import FaqListSkeleton from "@/app/(public)/faq/_components/FaqListSkeleton";
import { loadFaqs } from "@/app/(public)/faq/_components/load-faqs";
import Container from "@/components/container/Container";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";

function FaqSectionLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="space-y-10 md:space-y-7">
      <PageSectionTitle
        title="Frequently Asked Questions"
        subTitle="Got questions? We’ve got answers. Here’s everything you need to know about our app."
      />
      {children}
    </Container>
  );
}

export default function FAQ() {
  return (
    <Suspense
      fallback={
        <FaqSectionLayout>
          <FaqListSkeleton />
        </FaqSectionLayout>
      }
    >
      <FaqSection />
    </Suspense>
  );
}

async function FaqSection() {
  const result = await loadFaqs();

  // No FAQs: leave the whole section, heading included, off the home page.
  if (result.ok && result.faqs.length === 0) return null;

  return (
    <FaqSectionLayout>
      {result.ok ? <FAQContainer faqs={result.faqs} /> : <FaqError />}
    </FaqSectionLayout>
  );
}
