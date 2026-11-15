import { Suspense } from "react";
import Image from "next/image";
import Container from "@/components/container/Container";
import { ApiRequestError } from "@/services/api-service";
import { getMyProfile } from "@/services/users.service";
import WholesaleBannerCtaButton from "./WholesaleBannerCtaButton";

function WholesaleBannerShell({
  mode,
}: {
  mode: "products" | "sign-up" | "logout-then-sign-up";
}) {
  return (
    <section aria-labelledby="wholesale-banner-title">
      <Container>
        <div className="relative isolate flex min-h-100 items-center overflow-hidden rounded-md md:min-h-135">
          <Image
            src="/image/wholesale_banner.jpg"
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 90vw"
            className="-z-10 object-cover object-[center_58%]"
            aria-hidden="true"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-linear-to-t from-black/90 via-black/40 to-black/0"
          />

          <div className="relative z-10 px-6 py-9 text-white sm:px-10 md:px-12">
            <h2
              id="wholesale-banner-title"
              className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            >
              Buying for
              <br />
              Your Business?
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-[#CBD5E1] md:text-lg">
              Access applicable wholesale pricing and special discounts through
              your wholesale account.
            </p>
            <WholesaleBannerCtaButton mode={mode} />
          </div>
        </div>
      </Container>
    </section>
  );
}

async function WholesaleBannerCta() {
  try {
    const profile = await getMyProfile();
    if (profile.role === "wholesale") {
      return <WholesaleBannerShell mode="products" />;
    }
    return <WholesaleBannerShell mode="logout-then-sign-up" />;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return <WholesaleBannerShell mode="sign-up" />;
    }
    return <WholesaleBannerShell mode="sign-up" />;
  }
}

export default function WholesaleBanner() {
  return (
    <Suspense fallback={<WholesaleBannerShell mode="sign-up" />}>
      <WholesaleBannerCta />
    </Suspense>
  );
}
