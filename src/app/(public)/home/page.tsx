import { Suspense } from "react";
import Banner, { BannerSkeleton } from "./_components/banner/Banner";
import AboutHeader from "../about-us/_components/AboutHeader";
import Categories, {
  CategoriesSkeleton,
} from "./_components/categories/categories";
import Brands, { BrandsSkeleton } from "./_components/brands/brands";
import FeaturedProducts, {
  FeaturedProductsSkeleton,
} from "./_components/featured-products/FeaturedProducts";
import WholesaleBanner from "@/components/shared/banner/WholesaleBanner";
import Reviews from "./_components/client-reviews/Reviews";
import FAQ from "./_components/Faq/FAQ";
import Deals, { DealsSkeleton } from "./_components/deals/Deals";

export default function page() {
  return (
    <main className="flex-1 space-y-12 md:space-y-16">
      <div>
        <Suspense fallback={<BannerSkeleton />}>
          <Banner />
        </Suspense>
      </div>
      <div className="space-y-10 md:space-y-12">
        <AboutHeader page="home" />
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
        <Suspense fallback={<BrandsSkeleton />}>
          <Brands />
        </Suspense>
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </div>
      <WholesaleBanner />
      <Suspense fallback={<DealsSkeleton />}>
        <Deals />
      </Suspense>
      <Reviews />
      <FAQ />
    </main>
  );
}
