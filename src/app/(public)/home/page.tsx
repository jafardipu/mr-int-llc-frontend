import { Suspense } from "react";
import Banner from "./_components/banner/Banner";
import AboutHeader from "../about-us/_components/AboutHeader";
import Categories, {
  CategoriesSkeleton,
} from "./_components/categories/categories";
import Brands, { BrandsSkeleton } from "./_components/brands/brands";
import FeaturedProducts from "./_components/featured-products/FeaturedProducts";
import WholesaleBanner from "@/components/shared/banner/WholesaleBanner";
import Reviews from "./_components/client-reviews/Reviews";
import FAQ from "./_components/Faq/FAQ";
import Deals from "./_components/deals/Deals";

export default function page() {
  return (
    <main className="flex-1 md:space-y-16 space-y-12" >
      <div>
        <Banner />
      </div>
      <div className="md:space-y-12 space-y-10">
        <AboutHeader page="home" />
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
        <Suspense fallback={<BrandsSkeleton />}>
          <Brands />
        </Suspense>
        <FeaturedProducts />
      </div>
      <WholesaleBanner />
      <Deals />
      <Reviews />
      <FAQ />
    </main>
  );
}
