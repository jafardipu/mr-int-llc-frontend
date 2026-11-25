import "server-only";

import {
  isRecord,
  parseApiItem,
  parseApiPage,
  type ApiPage,
} from "@/services/api-response";
import { ApiRequestError, apiGet } from "@/services/api-service";

const ordersTag = "customer-orders";

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "canceled"
  | "failed"
  | string;

export interface OrderImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface OrderProduct {
  id: string;
  name: string;
  sku?: string;
  images: OrderImage[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: OrderProduct | null;
}

export interface OrderAddress {
  id: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isDefault: boolean;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile: string | null;
  phoneNumber: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string | null;
  customerType: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  promoCodeId: string | null;
  promoCode: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: OrderAddress | null;
  payment: OrderPayment | null;
  user: OrderUser | null;
}

export interface MyOrdersQuery {
  page?: number;
  limit?: number;
  sort?: string;
  searchTerm?: string;
  status?: OrderStatus;
}

export interface CheckoutSummaryItem {
  key: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string | null;
  /** Banner offer already included in `unitPrice`; shown as a note only. */
  bannerDiscountPercent: number | null;
}

/** Server-priced cart. Display these numbers as-is; never recompute them. */
export interface CheckoutSummary {
  items: CheckoutSummaryItem[];
  subtotal: number;
  discount: number;
  promoCode: string | null;
  shippingFee: number;
  tax: number;
  total: number;
}

/** Only `pending` orders can be paid (or cancelled) by the customer. */
export function orderNeedsPayment(order: Pick<Order, "status" | "payment">) {
  return order.status === "pending" && order.payment?.status !== "paid";
}

const orderStatuses = new Set<OrderStatus>([
  "pending",
  "processing",
  "completed",
  "cancelled",
]);

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readImage(value: unknown): OrderImage | null {
  if (!isRecord(value) || typeof value.url !== "string" || !value.url.trim()) {
    return null;
  }
  return {
    id: typeof value.id === "string" ? value.id : value.url,
    url: value.url,
    isPrimary: value.isPrimary === true,
  };
}

function readProduct(value: unknown): OrderProduct | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const images = Array.isArray(value.images)
    ? value.images.flatMap((image) => {
        const parsed = readImage(image);
        return parsed ? [parsed] : [];
      })
    : [];
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "Product",
    sku: typeof value.sku === "string" ? value.sku : undefined,
    images,
  };
}

function readItem(value: unknown): OrderItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.productId !== "string"
  ) {
    return null;
  }

  const quantity = readNumber(value.quantity, NaN);
  const unitPrice = readNumber(value.unitPrice, NaN);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    return null;
  }

  return {
    id: value.id,
    orderId: typeof value.orderId === "string" ? value.orderId : "",
    productId: value.productId,
    name: typeof value.name === "string" ? value.name : "Product",
    sku: typeof value.sku === "string" ? value.sku : "",
    quantity,
    unitPrice,
    total: readNumber(value.total, unitPrice * quantity),
    product: readProduct(value.product),
  };
}

function readAddress(value: unknown): OrderAddress | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    addressLine1:
      typeof value.addressLine1 === "string" ? value.addressLine1 : null,
    addressLine2:
      typeof value.addressLine2 === "string" ? value.addressLine2 : null,
    city: typeof value.city === "string" ? value.city : null,
    state: typeof value.state === "string" ? value.state : null,
    postalCode: typeof value.postalCode === "string" ? value.postalCode : null,
    country: typeof value.country === "string" ? value.country : null,
    isDefault: value.isDefault === true,
  };
}

function readPayment(value: unknown): OrderPayment | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    orderId: typeof value.orderId === "string" ? value.orderId : "",
    amount: readNumber(value.amount),
    status: typeof value.status === "string" ? value.status : "pending",
    transactionId:
      typeof value.transactionId === "string" ? value.transactionId : null,
    paymentMethod:
      typeof value.paymentMethod === "string" ? value.paymentMethod : null,
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function readUser(value: unknown): OrderUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: typeof value.role === "string" ? value.role : "",
    profile: typeof value.profile === "string" ? value.profile : null,
    phoneNumber:
      typeof value.phoneNumber === "string" ? value.phoneNumber : null,
  };
}

export function readOrder(value: unknown): Order | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  if (value.isDeleted === true) return null;

  const status =
    typeof value.status === "string" && orderStatuses.has(value.status as OrderStatus)
      ? (value.status as OrderStatus)
      : "pending";

  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const parsed = readItem(item);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    id: value.id,
    orderNumber:
      typeof value.orderNumber === "string" ? value.orderNumber : value.id,
    userId: typeof value.userId === "string" ? value.userId : "",
    addressId: typeof value.addressId === "string" ? value.addressId : null,
    customerType:
      typeof value.customerType === "string" ? value.customerType : "",
    status,
    subtotal: readNumber(value.subtotal),
    shippingFee: readNumber(value.shippingFee),
    tax: readNumber(value.tax),
    discount: readNumber(value.discount),
    total: readNumber(value.total),
    notes: typeof value.notes === "string" ? value.notes : null,
    promoCodeId:
      typeof value.promoCodeId === "string" ? value.promoCodeId : null,
    promoCode: typeof value.promoCode === "string" ? value.promoCode : null,
    isDeleted: false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    items,
    address: readAddress(value.address),
    payment: readPayment(value.payment),
    user: readUser(value.user),
  };
}

function isOrder(value: unknown): value is Order {
  return readOrder(value) !== null;
}

export async function getMyOrders(
  query: MyOrdersQuery = {},
): Promise<ApiPage<Order>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const result: unknown = await apiGet("orders/my-orders", {
    searchParams: {
      page,
      limit,
      sort: query.sort,
      searchTerm: query.searchTerm,
      status: query.status,
    },
    tags: [ordersTag],
    auth: "required",
  });

  const pageResult = parseApiPage(result, "orders/my-orders", isOrder);
  return {
    ...pageResult,
    data: pageResult.data.flatMap((item) => {
      const order = readOrder(item);
      return order ? [order] : [];
    }),
  };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const resource = `orders/${encodeURIComponent(id)}`;
  try {
    const result: unknown = await apiGet(resource, {
      tags: [ordersTag],
      auth: "required",
    });
    return readOrder(parseApiItem(result, resource, isRecord));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  /** An OrderStatus; any other value is kept so the UI can show it as-is. */
  status: string;
  /** null when the customer never started a payment. */
  paymentStatus: PaymentStatus | null;
  total: number;
  /** Total quantity across all items, not the number of products. */
  itemCount: number;
  image: string | null;
  firstItemName: string | null;
};

export type CustomerDashboard = {
  stats: { totalOrders: number; activeOrders: number };
  recentOrders: DashboardOrder[];
};

function readDashboardOrder(value: unknown): DashboardOrder | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    orderNumber:
      typeof value.orderNumber === "string" ? value.orderNumber : value.id,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    status: typeof value.status === "string" ? value.status : "",
    paymentStatus:
      typeof value.paymentStatus === "string" ? value.paymentStatus : null,
    total: readNumber(value.total),
    itemCount: readNumber(value.itemCount),
    image:
      typeof value.image === "string" && value.image.trim() ? value.image : null,
    firstItemName:
      typeof value.firstItemName === "string" && value.firstItemName.trim()
        ? value.firstItemName
        : null,
  };
}

function readDashboard(value: unknown): CustomerDashboard {
  const stats = isRecord(value) && isRecord(value.stats) ? value.stats : null;
  if (!stats) {
    throw new ApiRequestError("The API returned an invalid dashboard.", 500);
  }
  const recentOrders =
    isRecord(value) && Array.isArray(value.recentOrders)
      ? value.recentOrders
      : [];

  return {
    stats: {
      totalOrders: readNumber(stats.totalOrders),
      activeOrders: readNumber(stats.activeOrders),
    },
    recentOrders: recentOrders.flatMap((order) => {
      const parsed = readDashboardOrder(order);
      return parsed ? [parsed] : [];
    }),
  };
}

/**
 * Order counts and the five newest orders for the signed-in customer. Never
 * cached: statuses change after Stripe payments, cancellations and admin
 * updates. Throws ApiRequestError 401 (session ended) or 403 (admin account).
 */
export async function getMyDashboard(): Promise<CustomerDashboard> {
  const resource = "orders/my-dashboard";
  const result: unknown = await apiGet(resource, {
    tags: [ordersTag],
    auth: "required",
  });
  return readDashboard(parseApiItem(result, resource, isRecord));
}

function readSummaryItem(value: unknown, index: number): CheckoutSummaryItem | null {
  if (!isRecord(value)) return null;

  const product = isRecord(value.product) ? value.product : null;
  const productId =
    typeof value.productId === "string"
      ? value.productId
      : typeof product?.id === "string"
        ? product.id
        : "";
  const quantity = readNumber(value.quantity, NaN);
  const unitPrice = readNumber(value.unitPrice ?? value.price, NaN);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return null;

  const images = Array.isArray(product?.images)
    ? product.images.flatMap((image) => {
        const parsed = readImage(image);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    key:
      typeof value.id === "string" ? value.id : productId || `item-${index}`,
    productId,
    name:
      typeof value.name === "string"
        ? value.name
        : typeof product?.name === "string"
          ? product.name
          : "Product",
    sku:
      typeof value.sku === "string"
        ? value.sku
        : typeof product?.sku === "string"
          ? product.sku
          : "",
    quantity,
    unitPrice,
    total: readNumber(value.total ?? value.lineTotal, unitPrice * quantity),
    image:
      images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? null,
    bannerDiscountPercent:
      isRecord(product?.bannerDiscount) &&
      typeof product.bannerDiscount.percent === "number" &&
      Number.isFinite(product.bannerDiscount.percent) &&
      product.bannerDiscount.percent > 0
        ? product.bannerDiscount.percent
        : null,
  };
}

function readCheckoutSummary(value: unknown): CheckoutSummary {
  if (!isRecord(value) || !Number.isFinite(readNumber(value.total, NaN))) {
    throw new ApiRequestError("The API returned an invalid checkout summary.", 500);
  }

  const promoCode =
    typeof value.promoCode === "string" && value.promoCode.trim()
      ? value.promoCode
      : isRecord(value.promoCode) && typeof value.promoCode.code === "string"
        ? value.promoCode.code
        : null;

  return {
    items: Array.isArray(value.items)
      ? value.items.flatMap((item, index) => {
          const parsed = readSummaryItem(item, index);
          return parsed ? [parsed] : [];
        })
      : [],
    subtotal: readNumber(value.subtotal),
    discount: readNumber(value.discount),
    promoCode,
    shippingFee: readNumber(value.shippingFee),
    tax: readNumber(value.tax),
    total: readNumber(value.total),
  };
}

/**
 * Prices the current server cart exactly like checkout will. Throws an
 * ApiRequestError (400) with a user-facing message for an invalid promo code,
 * an empty cart, insufficient stock or a wholesale minimum quantity.
 */
export async function getCheckoutSummary(
  promoCode?: string,
): Promise<CheckoutSummary> {
  const code = promoCode?.trim();
  const result: unknown = await apiGet("orders/checkout-summary", {
    searchParams: { promoCode: code || undefined },
    auth: "required",
  });

  return readCheckoutSummary(parseApiItem(result, "orders/checkout-summary", isRecord));
}

export function orderItemCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function orderPrimaryImage(order: Order) {
  for (const item of order.items) {
    const images = item.product?.images ?? [];
    const primary =
      images.find((image) => image.isPrimary)?.url ?? images[0]?.url;
    if (primary) return primary;
  }
  return null;
}
