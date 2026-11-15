import { Suspense } from "react";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import PrivacyPolicyContent from "./_components/PrivacyPolicyContent";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

function ContentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading privacy policy"
      className="mx-auto min-h-64 max-w-5xl animate-pulse rounded-xl bg-[#f1f0ed]"
    />
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="page-padding">
      <PageSectionTitle
        title="Privacy and Policy"
        subTitle="Here’s everything you need to know about our app."
      />
      <div className="mt-10">
        <Suspense fallback={<ContentSkeleton />}>
          <PrivacyPolicyContent />
        </Suspense>
      </div>
    </div>
  );
}
