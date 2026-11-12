import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import TopInfo from "@/components/shared/navbar/TopInfo";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import ReduxProvider from "@/redux/ReduxProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MR International LLC",
    template: "%s | MR International LLC",
  },
  description:
    "Discover products from around the world with MR International — global shopping, made simple.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.className}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReduxProvider>
          <WishlistProvider>
            <TopInfo />
            <div>{children}</div>
            <Toaster position="top-center" richColors />
          </WishlistProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
