import { Skeleton } from "@/components/ui/skeleton";
import {
  getHomepageBanners,
  type Banner as BannerItem,
} from "@/services/banners.service";
import BannerCarousel from "./BannerCarousel";

const defaultBannerLink = "/products";

const fallbackBanners: BannerItem[] = [
  {
    id: "fallback-banner-1",
    image: "/image/banner_image_2.png",
    link: defaultBannerLink,
    isActive: true,
    isDeleted: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-banner-2",
    image: "/image/auth_banner_image.png",
    link: defaultBannerLink,
    isActive: true,
    isDeleted: false,
    createdAt: "",
    updatedAt: "",
  },
];

function withDefaultLink(banners: BannerItem[]): BannerItem[] {
  return banners.map((banner) => ({
    ...banner,
    link: banner.link?.trim() || defaultBannerLink,
  }));
}

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
    const banners =
      result.data.length > 0
        ? withDefaultLink(result.data)
        : fallbackBanners;

    return <BannerCarousel banners={banners} />;
  } catch {
    return <BannerCarousel banners={fallbackBanners} />;
  }
}
