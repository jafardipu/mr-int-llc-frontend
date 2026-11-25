import { Suspense } from "react";
import { CircleHelp } from "lucide-react";
import Container from "@/components/container/Container";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import FAQContainer from "./_components/FAQContainer";
import FaqError from "./_components/FaqError";
import FaqListSkeleton from "./_components/FaqListSkeleton";
import { loadFaqs } from "./_components/load-faqs";

export const metadata = {
  title: "FAQ",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

export default function FAQPage() {
  return (
    <Container className="page-padding">
      <PageSectionTitle
        title="Frequently Asked Questions"
        subTitle="Got questions? We’ve got answers. Here’s everything you need to know about our app."
      />
      <Suspense fallback={<FaqListSkeleton />}>
        <FaqList />
      </Suspense>
    </Container>
  );
}

async function FaqList() {
  const result = await loadFaqs();

  if (!result.ok) return <FaqError />;
  if (result.faqs.length === 0) {
    return (
      <EmptyState
        icon={CircleHelp}
        message="No FAQs yet."
        className="mt-10 sm:mt-12"
      />
    );
  }
  return <FAQContainer faqs={result.faqs} />;
}
