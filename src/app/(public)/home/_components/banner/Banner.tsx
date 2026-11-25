import { Skeleton } from "@/components/ui/skeleton";
import {
  getHomepageBanners,
  type Banner as BannerItem,
} from "@/services/banners.service";
import BannerCarousel from "./BannerCarousel";

function fallbackBanner(id: string, image: string): BannerItem {
  return {
    id,
    image,
    targetType: null,
    productId: null,
    categoryId: null,
    product: null,
    category: null,
    discountPercent: null,
    startDate: null,
    endDate: null,
    link: "/products",
    isActive: true,
    isDeleted: false,
    createdAt: "",
    updatedAt: "",
  };
}

// Where each banner links is decided by `bannerHref` in BannerCarousel.
const fallbackBanners: BannerItem[] = [
  fallbackBanner("fallback-banner-2", "/image/auth_banner_image.png"),
  fallbackBanner("fallback-banner-1", "/image/banner_image_2.png"),
];

export function BannerSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading banners"
      className="overflow-hidden pt-5"
    >
      <div className="px-4 md:px-8 xl:px-12 2xl:px-16">
        <Skeleton className="h-56 w-full rounded-md sm:h-80 lg:h-[26rem] xl:h-[30rem]" />
      </div>
    </section>
  );
}

export default async function Banner() {
  try {
    const result = await getHomepageBanners({ page: 1, limit: 10 });
    const banners = result.data.length > 0 ? result.data : fallbackBanners;

    return <BannerCarousel banners={banners} />;
  } catch {
    return <BannerCarousel banners={fallbackBanners} />;
  }
}
