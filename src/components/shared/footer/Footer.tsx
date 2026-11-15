import { Suspense } from "react";
import logo from "@/assets/footer_logo.png";
import Container from "@/components/container/Container";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { quickLinks, serviceLinks } from "./footer.data";
import { Input } from "@/components/ui/input";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/icons";
import { getContents } from "@/services/contents.service";

async function FooterCmsCopy() {
  try {
    const contents = await getContents();
    return {
      footerText: contents.footerText?.trim() || null,
      copyRight:
        contents.copyRight?.trim() ||
        "© 2026 MR International LLC. All rights reserved.",
    };
  } catch {
    return {
      footerText: null,
      copyRight: "© 2026 MR International LLC. All rights reserved.",
    };
  }
}

async function FooterBrandBlurb() {
  const { footerText } = await FooterCmsCopy();
  if (!footerText) return null;
  return (
    <p className="mt-4 max-w-xs text-sm leading-6 text-secondary-color/80">
      {footerText}
    </p>
  );
}

async function FooterCopyright() {
  const { copyRight } = await FooterCmsCopy();
  return <p>{copyRight}</p>;
}

export default function Footer() {
  return (
    <footer className="mt-10 bg-primary-color text-secondary-color lg:mt-16 xl:mt-20">
      <div className="border-b border-secondary-color/20 py-10 sm:py-12 lg:py-16">
        <Container>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1.2fr_1.2fr] lg:gap-10">
            <div className="col-span-2 flex flex-col items-start sm:col-span-3 lg:col-span-1">
              <Link href="/" aria-label="MR International home">
                <Image
                  src={logo}
                  alt="MR International LLC"
                  width={1200}
                  height={1200}
                  className="h-auto w-52 object-contain sm:w-40"
                />
              </Link>
              <Suspense fallback={null}>
                <FooterBrandBlurb />
              </Suspense>
              <div className="mt-6 flex items-center justify-center gap-4">
                <Link href={"#"}>
                  <XIcon />
                </Link>
                <Link href={"#"}>
                  <FacebookIcon />
                </Link>
                <Link href={"#"}>
                  <LinkedInIcon />
                </Link>
                <Link href={"#"}>
                  <InstagramIcon />
                </Link>
              </div>
            </div>

            <FooterLinkGroup heading="Quick Links" links={quickLinks} />
            <FooterLinkGroup heading="Services" links={serviceLinks} />

            <div>
              <h2 className="mb-4 font-semibold uppercase tracking-[0.16em]">
                Contact
              </h2>

              <div className="mb-3 flex items-center gap-1.5">
                <MapPin size={18} />
                <p className="leading-6 text-secondary-color/80 hover:text-secondary-color">
                  1234 Street, City, State, 12345
                </p>
              </div>
              <div className="mb-3 flex items-center gap-1.5">
                <Phone size={18} />
                <Link
                  href="tel:(391) 943-5578"
                  className="leading-6 text-secondary-color/80 hover:text-secondary-color"
                >
                  (391) 943-5578
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail size={18} />
                <Link
                  href="mailto:info@brightfolk.co"
                  className="leading-6 text-secondary-color/80"
                >
                  info@brightfolk.co
                </Link>
              </div>
            </div>

            <div>
              <h2 className="mb-4 font-semibold uppercase tracking-[0.16em]">
                Subscribe
              </h2>
              <div className="relative h-fit border-secondary-color/20">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="mb-3 bg-white py-5.5"
                />

                <Send
                  size={24}
                  className="absolute top-0 right-0 -translate-1/2 translate-y-1/2 cursor-pointer bg-white duration-500 hover:rotate-45"
                />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="flex flex-col gap-3 py-5 text-sm font-semibold text-secondary-color/75 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<p>© 2026 MR International LLC. All rights reserved.</p>}>
          <FooterCopyright />
        </Suspense>
        <div className="flex items-center gap-5">
          <Link
            className="transition-colors hover:text-secondary-color"
            href="/privacy-policy"
          >
            Privacy Policy
          </Link>
          <Link
            className="transition-colors hover:text-secondary-color"
            href="/terms-conditions"
          >
            Terms Of Use
          </Link>
        </div>
      </Container>
    </footer>
  );
}

function FooterLinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="mb-4 font-semibold uppercase tracking-[0.16em]">
        {heading}
      </h2>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-secondary-color/80 transition-colors hover:text-secondary-color"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
