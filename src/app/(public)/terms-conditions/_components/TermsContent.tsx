import Container from "@/components/container/Container";
import CmsContent from "@/components/shared/cms/CmsContent";
import { getContentByKey } from "@/services/contents.service";

export default async function TermsContent() {
  let content: string | null = null;
  try {
    content = await getContentByKey("termsAndCondition");
  } catch {
    content = null;
  }

  return (
    <Container>
      <CmsContent
        content={content}
        emptyMessage="Terms and conditions content is not available yet."
      />
    </Container>
  );
}
