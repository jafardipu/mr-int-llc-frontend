import { Suspense } from "react";
import AboutCmsContent from "./_components/AboutCmsContent";
import AboutHeader from "./_components/AboutHeader";
import OurCommitment from "./_components/OurCommitment";

export const metadata = {
  title: "About",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

export default function AboutPage() {
  return (
    <main className="flex-1 space-y-10 page-padding lg:space-y-16">
      <AboutHeader />
      <Suspense fallback={null}>
        <AboutCmsContent />
      </Suspense>
      <OurCommitment />
    </main>
  );
}
