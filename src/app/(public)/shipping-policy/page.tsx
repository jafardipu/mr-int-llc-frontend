import { Suspense } from "react";
import Container from "@/components/container/Container";
import CmsContent from "@/components/shared/cms/CmsContent";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";
import { getContentByKey } from "@/services/contents.service";

export const metadata = {
  title: "Shipping Policy",
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

async function ShippingPolicyContent() {
  let content: string | null = null;
  try {
    content = await getContentByKey("shippingPolicy");
  } catch {
    content = null;
  }

  return (
    <Container>
      <CmsContent
        content={content}
        emptyMessage="Shipping policy content is not available yet."
      />
    </Container>
  );
}

export default function ShippingPolicyPage() {
  return (
    <div className="page-padding">
      <PageSectionTitle
        title="Shipping Policy"
        subTitle="Here’s everything you need to know about shipping."
      />
      <div className="mt-10">
        <Suspense
          fallback={
            <div
              aria-busy="true"
              aria-label="Loading shipping policy"
              className="mx-auto min-h-64 max-w-5xl animate-pulse rounded-xl bg-[#f1f0ed]"
            />
          }
        >
          <ShippingPolicyContent />
        </Suspense>
      </div>
    </div>
  );
}
