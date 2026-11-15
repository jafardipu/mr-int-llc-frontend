import { Suspense } from "react";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import TermsContent from "./_components/TermsContent";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

function ContentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading terms and conditions"
      className="mx-auto min-h-64 max-w-5xl animate-pulse rounded-xl bg-[#f1f0ed]"
    />
  );
}

export default function TermsConditionPage() {
  return (
    <div className="page-padding">
      <PageSectionTitle
        title="Terms and Conditions"
        subTitle="Here’s everything you need to know about our app."
      />
      <div className="mt-10">
        <Suspense fallback={<ContentSkeleton />}>
          <TermsContent />
        </Suspense>
      </div>
    </div>
  );
}
