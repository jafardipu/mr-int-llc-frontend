import "server-only";

import { getAllBrands } from "@/services/brands.service";
import { getAllCategories } from "@/services/categories.service";
import {
  getProductById,
  getProducts,
  type Product,
  type ProductListQuery,
} from "@/services/products.service";
import { productImageFallback } from "@/lib/product-image";
import type { TProducts } from "@/types/products";

export interface CatalogOption {
  id: string;
  name: string;
}

export interface CatalogProduct extends TProducts {
  brand: string;
  brandId: string;
  categoryId: string;
  description: string;
  sku: string;
  galleryImages: string[];
}

export type CatalogProductQuery = ProductListQuery;

export function mapCatalogProduct(product: Product): CatalogProduct {
  const images = (product.images ?? []).filter((image) => image.url);
  const image =
    images.find((item) => item.isPrimary)?.url ??
    images[0]?.url ??
    product.category?.image ??
    productImageFallback;
  const price =
    product.displayPrice ??
    (product.isDeal ? product.dealPrice : null) ??
    product.retailPrice;
  const hasDiscount =
    product.isDeal &&
    product.dealPrice !== null &&
    product.dealPrice < product.retailPrice;

  return {
    id: product.id,
    image,
    imageAlt: product.name,
    category: product.category?.name ?? "Other",
    title: product.name,
    price,
    ...(hasDiscount
      ? { originalPrice: product.retailPrice, badge: "On Sale" }
      : {}),
    rating: product.avgRating,
    stockCount: product.stock,
    brand: product.brand?.name ?? "Other",
    brandId: product.brandId,
    categoryId: product.categoryId,
    description: product.description,
    sku: product.sku,
    galleryImages: images.length ? images.map((item) => item.url) : [image],
  };
}

export async function getCatalogProducts(query: CatalogProductQuery) {
  const result = await getProducts(query);
  const lastPage = Math.ceil(result.meta.total / result.meta.limit);

  if (lastPage > 0 && query.page > lastPage) {
    const lastPageResult = await getProducts({
      ...query,
      page: lastPage,
    });

    return {
      ...lastPageResult,
      data: lastPageResult.data.map(mapCatalogProduct),
    };
  }

  return {
    ...result,
    data: result.data.map(mapCatalogProduct),
  };
}

export async function getCatalogFilters() {
  const [categories, brands] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
  ]);

  return {
    categories: categories
      .filter((category) => category.status === "active" && !category.isDeleted)
      .map(({ id, name }) => ({ id, name })),
    brands: brands
      .filter((brand) => !brand.isDeleted)
      .map(({ id, name }) => ({ id, name })),
  };
}

export async function getCatalogProductById(
  id: string,
): Promise<CatalogProduct | null> {
  const product = await getProductById(id);
  return product ? mapCatalogProduct(product) : null;
}
