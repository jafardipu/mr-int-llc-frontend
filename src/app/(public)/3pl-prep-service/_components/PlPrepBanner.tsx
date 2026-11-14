import Image from "next/image";
import Link from "next/link";

export default function PlPrepBanner() {
  return (
    <section className=" py-5 sm:py-6">
      <div className="relative isolate flex min-h-90 items-center overflow-hidden rounded-xl sm:aspect-[2.4/1] sm:min-h-0">
        <Image
          src="/image/pl_prep_image.png"
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 90vw"
          className="-z-20 object-cover object-[62%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-[#f7ede0]/95 via-[#f7ede0]/85 to-transparent sm:via-[#f7ede0]/65"
        />

        <div className=" px-6 py-10 sm:px-8 sm:py-12 lg:px-10 xl:px-14">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-black sm:text-5xl xl:text-6xl">
            3PL Prep Service Simplify
            <span className="block text-secondary-color">
              Your Product Preparation
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#656565] sm:text-lg">
            Submit your product information in one place and let our team review
            your preparation request. We handle labeling, poly bagging,
            bundling, and carton compliance so you can focus on growing your
            business.
          </p>
          <div className="flex gap-5 flex-wrap">
            <Link
              href="/3pl-prep-service/prep-request"
              className="mt-5 block w-fit rounded-full bg-secondary-color px-6 py-3 text-xs font-medium text-white transition-colors hover:bg-[#7f360c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b430f]"
            >
              Submit a Prep Request
            </Link>
            <Link
              href="/3pl-prep-service/my-prep-requests"
              className="mt-5 block w-fit rounded-full bg-transparent px-6 py-3 text-xs font-medium text-secondary-color border border-secondary-color transition-colors hover:bg-[#e7e5e3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b430f]"
            >
              My Submitted Prep Requests
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
