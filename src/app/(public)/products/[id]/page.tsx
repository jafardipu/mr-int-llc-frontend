import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/container/Container";
import { productImageFallback } from "@/lib/product-image";
import { ApiRequestError } from "@/services/api-service";
import { getProductById } from "@/services/products.service";
import ProductImagesCarousel from "./_components/carousel/ProductImagesCarousel";
import {
  ProductFavoriteButton,
  ProductPurchaseControls,
} from "./_components/ProductDetailsActions";
import ProductReviews from "./_components/ProductReviews";
import ProductVolumeTiers from "./_components/ProductVolumeTiers";
import RelatedProducts from "./_components/RelatedProducts";

type ProductDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }

  try {
    const product = await getProductById(id);
    return {
      title: product?.name ?? "Product not found",
      description: product
        ? product.description
        : "This product could not be found.",
    };
  } catch {
    return {
      title: "Product not found",
      description: "This product could not be found.",
    };
  }
}

function ProductDetailsFallback() {
  return (
    <Container className="page-padding">
      <main
        aria-busy="true"
        aria-label="Loading product details"
        className="mx-auto grid w-full max-w-7xl items-start gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-12"
      >
        <div className="aspect-[1.12/1] animate-pulse rounded-xl bg-[#F1F0ED]" />
        <div className="space-y-5">
          <div className="h-9 max-w-sm animate-pulse rounded bg-[#F1F0ED]" />
          <div className="h-6 max-w-32 animate-pulse rounded bg-[#F1F0ED]" />
          <div className="h-28 animate-pulse rounded bg-[#F1F0ED]" />
          <div className="h-28 animate-pulse rounded bg-[#F1F0ED]" />
          <div className="grid max-w-2/3 grid-cols-2 gap-x-4 gap-y-2">
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
          </div>
        </div>
      </main>
    </Container>
  );
}

function stockLabel(stock: number, status: string) {
  if (status === "out_of_stock" || stock <= 0) {
    return "Currently unavailable";
  }
  if (status === "inactive") {
    return "Currently unavailable";
  }
  return `In stock (${stock} available)`;
}

export default function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  return (
    <div className="space-y-10 md:space-y-14">
      <Suspense fallback={<ProductDetailsFallback />}>
        <ProductDetailsContent params={params} />
      </Suspense>
      <RelatedProducts />
    </div>
  );
}

async function ProductDetailsContent({ params }: ProductDetailsPageProps) {
  const { id: rawId } = await params;
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }

  let product;
  try {
    product = await getProductById(id);
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load this product.";

    return (
      <Container className="page-padding">
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {message}
        </p>
      </Container>
    );
  }

  if (!product) notFound();

  const images = (product.images ?? [])
    .filter((image) => image.url)
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const galleryImages = images.length
    ? images.map((image) => image.url)
    : [productImageFallback];
  const primaryImage = galleryImages[0] ?? productImageFallback;
  const brandName = product.brand?.name;
  const categoryName = product.category?.name;
  const brandLinkable = Boolean(
    product.brand && product.brand.isDeleted !== true,
  );
  const categoryLinkable = Boolean(
    product.category &&
      product.category.isDeleted !== true &&
      product.category.status !== "inactive",
  );
  const availability = stockLabel(product.stock, product.status);
  const unavailable =
    product.status === "out_of_stock" ||
    product.status === "inactive" ||
    product.stock <= 0;

  return (
    <Container className="page-padding">
      <main className="mx-auto w-full max-w-7xl">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-12">
          <ProductImagesCarousel
            slides={galleryImages.map((url) => ({
              url,
              alt: product.name,
            }))}
          />

          <section aria-labelledby="product-title" className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {product.isDeal && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      On Sale
                    </span>
                  )}
                  {/* {product.isWholesale && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Wholesale
                    </span>
                  )} */}
                  {product.status === "inactive" && (
                    <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                      Inactive
                    </span>
                  )}
                </div>
                <h1
                  className="text-2xl font-bold leading-tight tracking-tight text-[#252A30] sm:text-3xl"
                  id="product-title"
                >
                  {product.name}
                </h1>
                <p className="mt-2 text-xs text-[#4B5563]">
                  SKU: {product.sku}
                </p>
                <p
                  className={`mt-2 flex items-center gap-2 text-xs font-medium ${
                    unavailable ? "text-[#DC1638]" : "text-[#348267]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${
                      unavailable ? "bg-[#DC1638]" : "bg-[#348267]"
                    }`}
                  />
                  {availability}
                </p>
              </div>
              <ProductFavoriteButton
                productId={product.id}
                productTitle={product.name}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tracking-tight text-[#252A30]">
                ${product.displayPrice.toFixed(2)}
              </p>
              {product.isDeal &&
                product.dealPrice !== null &&
                product.dealPrice < product.retailPrice && (
                  <p className="text-black/60">
                    <span className="line-through">
                      ${product.retailPrice.toFixed(2)}
                    </span>
                  </p>
                )}
              {product.displayMinQty > 1 && (
                <p className="text-sm text-[#6B7280]">
                  Min qty {product.displayMinQty}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-black/60">
              <p>{product.description}</p>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-black/60">
                Product details
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[#737983] marker:text-[#9CA3AF]">
                <li>
                  Brand:{" "}
                  {brandName ? (
                    brandLinkable ? (
                      <Link
                        href={`/shop-by-brand/${product.brandId}`}
                        className="font-medium text-secondary-color hover:underline"
                      >
                        {brandName}
                      </Link>
                    ) : (
                      brandName
                    )
                  ) : (
                    "—"
                  )}
                </li>
                <li>
                  Category:{" "}
                  {categoryName ? (
                    categoryLinkable ? (
                      <Link
                        href={`/categories/${product.categoryId}`}
                        className="font-medium text-secondary-color hover:underline"
                      >
                        {categoryName}
                      </Link>
                    ) : (
                      categoryName
                    )
                  ) : (
                    "—"
                  )}
                </li>
                {product.subcategory && (
                  <li>Subcategory: {product.subcategory}</li>
                )}
                {product.asin && <li>ASIN: {product.asin}</li>}
                <li>
                  {product.totalReview > 0
                    ? `${product.avgRating.toFixed(1)} out of 5 (${product.totalReview} ${product.totalReview === 1 ? "review" : "reviews"})`
                    : "No customer ratings yet"}
                </li>
              </ul>
            </div>

            {product.volumeTiers && product.volumeTiers.length > 0 && (
              <ProductVolumeTiers tiers={product.volumeTiers} />
            )}

            <ProductPurchaseControls
              stockCount={product.stock}
              product={{
                id: product.id,
                title: product.name,
                price: product.displayPrice,
                image: primaryImage,
                imageAlt: product.name,
                stockCount: product.stock,
                displayMinQty: product.displayMinQty,
                amazonUrl: product.amazonUrl,
                walmartUrl: product.walmartUrl,
                isWholesale: product.isWholesale,
              }}
            />

            {/* <ProductReviews
              reviews={product.reviews}
              avgRating={product.avgRating}
              totalReview={product.totalReview}
            /> */}
          </section>
        </div>
      </main>
    </Container>
  );
}
