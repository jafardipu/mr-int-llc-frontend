import { SettingIcon } from "@/icons";
import { PackageCheck } from "lucide-react";

const steps = [
  {
    title: "Submit Your Files",
    description: "Upload your CSV or TSV files through our request form.",
    highlighted: true,
  },
  {
    title: "Our Team Reviews",
    description: "We check your file and requirements.",
  },
  {
    title: "Processing",
    description: "We prepare your products according to your requirements.",
  },
  {
    title: "You are All Set",
    description:
      "Round-the-clock customer support and emergency services when you need them most.",
  },
];

export default function HowPrepWork() {
  return (
    <section
      aria-labelledby="how-prep-work-title"
      className="grid gap-6  lg:grid-cols-[minmax(230px,0.9fr)_2fr] lg:gap-10"
    >
      <div>
        <h2
          id="how-prep-work-title"
          className="text-3xl font-bold tracking-tight text-[#171d2b] sm:text-4xl xl:text-5xl"
        >
          How It’s Work
        </h2>
        <p className="mt-2 text-sm lg:text-lg text-[#596273]">
          Get your products ready in a simple steps
        </p>
      </div>

      <ol className="grid gap-4 lg:gap-6 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`min-h-32 rounded-xl p-5 shadow-[0_2.279px_13.674px_0_rgba(44,120,220,0.08)] sm:p-6 bg-[#FAFAFA] hover:bg-[#fff7f3]`}
          >
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-[#9b430f] text-white"
            >
              <SettingIcon  />
            </span>
            <h3 className="mt-4 text-lg md:text-xl font-semibold text-[#374151] lg:text-2xl">
              <span className="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-5 text-[#4B5563] sm:text-base lg:text-lg ">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
