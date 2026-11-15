import Container from "@/components/container/Container";
import CmsContent from "@/components/shared/cms/CmsContent";
import { getContentByKey } from "@/services/contents.service";

export default async function AboutCmsContent() {
  let content: string | null = null;
  try {
    content = await getContentByKey("aboutUs");
  } catch {
    content = null;
  }

  if (!content?.trim()) return null;

  return (
    <Container>
      <CmsContent
        content={content}
        className="mx-auto max-w-3xl text-center text-base leading-7 text-[#1A2028] sm:text-lg"
      />
    </Container>
  );
}
