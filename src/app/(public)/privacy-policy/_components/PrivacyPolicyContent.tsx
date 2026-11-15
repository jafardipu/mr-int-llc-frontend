import Container from "@/components/container/Container";
import CmsContent from "@/components/shared/cms/CmsContent";
import { getContentByKey } from "@/services/contents.service";

export default async function PrivacyPolicyContent() {
  let content: string | null = null;
  try {
    content = await getContentByKey("privacyPolicy");
  } catch {
    content = null;
  }

  return (
    <Container>
      <CmsContent
        content={content}
        emptyMessage="Privacy policy content is not available yet."
      />
    </Container>
  );
}
