// Client-safe banner helpers. They live here, not in banners.service.ts,
// because that module is server-only and BannerCarousel is a client component.
import type { Banner } from "@/services/banners.service";

const defaultBannerHref = "/products";

/**
 * Legacy banner links were saved without a leading slash
 * ("products/<id>"). Make them root-relative so they resolve the same way
 * from any page. Absolute URLs (https:, mailto:, …) are left as-is.
 */
function normalizeLink(link: string | null) {
  const trimmed = link?.trim();
  if (!trimmed) return null;
  if (/^([a-z][a-z\d+.-]*:|[/?#])/i.test(trimmed)) return trimmed;
  return `/${trimmed}`;
}

/** Where a banner click goes: its product, its category, or its old link. */
export function bannerHref(banner: Banner): string {
  if (banner.targetType === "product" && banner.productId) {
    return `/products/${encodeURIComponent(banner.productId)}`;
  }
  if (banner.targetType === "category" && banner.categoryId) {
    return `/categories/${encodeURIComponent(banner.categoryId)}`;
  }
  return normalizeLink(banner.link) ?? defaultBannerHref;
}

/** Accessible name for the banner's link, matching where `bannerHref` goes. */
export function bannerLinkLabel(banner: Banner, index: number): string {
  if (banner.targetType === "product" && banner.productId && banner.product) {
    return `View ${banner.product.name}`;
  }
  if (banner.targetType === "category" && banner.categoryId && banner.category) {
    return `Shop ${banner.category.name}`;
  }
  return `Open banner link ${index + 1}`;
}
