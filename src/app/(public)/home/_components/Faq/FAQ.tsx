import FAQContainer from "@/app/(public)/faq/_components/FAQContainer";
import Container from "@/components/container/Container";
import PageSectionTitle from "@/components/shared/section/PageSectionTitle";

export default function FAQ() {
  return (
    <Container className="space-y-10 md:space-y-7">
      <PageSectionTitle
        title="Frequently Asked Questions"
        subTitle="Got questions? We’ve got answers. Here’s everything you need to know about our app."
      />
      <FAQContainer />
    </Container>
  );
}
