import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/container/Container";
import { allProducts } from "@/data/all-products";
import { getCatalogProductById } from "@/lib/catalog-api";
import ProductImagesCarousel from "./_components/carousel/ProductImagesCarousel";
import {
  ProductFavoriteButton,
  ProductPurchaseControls,
} from "./_components/ProductDetailsActions";
import RelatedProducts from "./_components/RelatedProducts";

type ProductDetailsPageProps = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string) {
  const localProduct = allProducts.find((product) => product.id === id);
  if (localProduct) return localProduct;

  return getCatalogProductById(id);
}

export function generateStaticParams() {
  return allProducts.map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product?.title ?? "Product not found",
    description: product
      ? `${product.title} from MR International. Browse product details and wholesale options.`
      : "This product could not be found.",
  };
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
          <div className="grid grid-cols-2 max-w-2/3 gap-x-4 gap-y-2 ">
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
            <div className="h-6 animate-pulse rounded bg-[#F1F0ED]" />
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

export default function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  return (
    <div className="md:space-y-14 space-y-10">
      <Suspense fallback={<ProductDetailsFallback />}>
        <ProductDetailsContent params={params} />
      </Suspense>
      <RelatedProducts />
    </div>
  );
}

async function ProductDetailsContent({ params }: ProductDetailsPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const price = Number(product.price);
  const description =
    ("description" in product && product.description) ||
    `Explore the ${product.title} in our ${product.category.toLowerCase()} collection. Contact our team for product information and wholesale purchasing options.`;
  const galleryImages =
    "galleryImages" in product && product.galleryImages.length
      ? product.galleryImages
      : [product.image];

  return (
    <Container className="page-padding">
      <main className="mx-auto w-full max-w-7xl">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-12">
          <ProductImagesCarousel
            slides={galleryImages.map((url) => ({
              url,
              alt: product.imageAlt,
            }))}
          />

          <section aria-labelledby="product-title" className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8A8D94]">
                  {product.category}
                </p> */}
                <h1
                  className="text-2xl font-bold leading-tight tracking-tight text-[#252A30] sm:text-3xl"
                  id="product-title"
                >
                  {product.title}
                </h1>
                <p className="mt-2 text-xs text-[#4B5563]">
                  SKU: {("sku" in product && product.sku) || product.id.toUpperCase()}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#348267]">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[#348267]"
                  />
                  {typeof product.stockCount === "number"
                    ? product.stockCount > 0
                      ? `In stock (${product.stockCount} available)`
                      : "Currently unavailable"
                    : "Availability confirmed on request"}
                </p>
              </div>
              <ProductFavoriteButton
                productId={product.id}
                productTitle={product.title}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tracking-tight text-[#252A30]">
                ${price.toFixed(2)}
              </p>
              {product.originalPrice !== undefined && (
                <p className=" text-black/60">
                 
                  <span className="line-through">
                    ${Number(product.originalPrice).toFixed(2)}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm leading-6 text-black/60">
              <p>{description}</p>
              <p>
                For bulk orders, our team can help with availability and
                wholesale pricing.
              </p>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-black/60">
                Product details
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[#737983] marker:text-[#9CA3AF]">
                <li>Brand: {product.brand}</li>
                <li>Category: {product.category}</li>
                <li>
                  {product.rating
                    ? `${product.rating} out of 5 customer rating`
                    : "Quality checked by MR International"}
                </li>
              </ul>
            </div>

            <ProductPurchaseControls stockCount={product.stockCount} />

          
          </section>
        </div>
      </main>
    </Container>
  );
}
