import SectionTitle from "@/components/shared/section/SectionTitle";
import PrepRequestsList from "./_components/PrepRequestsList";

export default function PlServicePage() {
  return (
    <div className="space-y-7">
      <SectionTitle
        title="Prep Services"
        subTitle="Track your 3PL prep requests and upload corrected files when our team asks for changes."
        btn={false}
        className="space-y-1 lg:space-y-1.5"
        subTitleClass="max-w-xl text-[#6B7280]"
      />
      <PrepRequestsList />
    </div>
  );
}
