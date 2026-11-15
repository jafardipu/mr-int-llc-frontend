import { Suspense } from "react";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import Container from "@/components/container/Container";
import { ApiRequestError } from "@/services/api-service";
import { getMyProfile } from "@/services/users.service";
import ContactForm from "./ContactForm";

async function ContactFormWithProfile() {
  let name = "";
  let email = "";

  try {
    const profile = await getMyProfile();
    name = profile.name;
    email = profile.email;
  } catch (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      // Guests and expired sessions still get an empty form.
    }
  }

  return <ContactForm initialValues={{ name, email }} />;
}

export default function ContactUs() {
  return (
    <Container>
      <div className="w-full rounded-3xl p-6 lg:p-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-primary-black md:text-3xl lg:text-[40px]">
              Still have questions?
            </h1>
            <h2 className="mb-4 text-2xl font-bold text-[#7D8381] md:mb-6 md:text-3xl lg:text-[40px]">
              Contact our team
            </h2>

            <p className="mb-8 text-lg leading-relaxed text-primary-gray md:mb-12">
              Our dedicated support specialists are available 24/7 to help you
              navigate the property market with confidence.
            </p>

            <div>
              <h3 className="mb-3 text-xl font-bold text-primary-black md:mb-4 md:text-2xl">
                Contact support
              </h3>
              <p className="mb-3 text-primary-gray md:mb-4">
                We usually respond within 1 business day.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-[#92400e14]">
                      <Mail className="size-5 text-[#995618]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Email us
                    </p>
                    <Link
                      href="mailto:support@betteroffmarket.com"
                      className="font-semibold text-primary-black"
                    >
                      support@betteroffmarket.com
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-[#92400e14]">
                      <Phone className="size-5 text-[#995618]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-gray">
                      Call us
                    </p>
                    <Link
                      href="tel:+1800456789"
                      className="font-semibold text-primary-black"
                    >
                      +1 (800) 456789
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white/20 p-5 shadow-[0_10px_30px_0_rgba(15,23,42,0.05)] lg:p-8 xl:p-10">
              <h3 className="mb-5 text-xl font-semibold text-primary-black md:mb-6 lg:text-2xl">
                Send us a message
              </h3>
              <Suspense
                fallback={
                  <div
                    aria-busy="true"
                    aria-label="Loading contact form"
                    className="min-h-72 animate-pulse rounded-xl bg-[#f1f0ed]"
                  />
                }
              >
                <ContactFormWithProfile />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
