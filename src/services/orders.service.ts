import "server-only";

import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";
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

export function orderNeedsPayment(order: Pick<Order, "payment">) {
  return order.payment?.status !== "paid";
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

async function authHeaders() {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) {
    throw new ApiRequestError("Please sign in again.", 401);
  }
  return {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store" as const,
  };
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
    ...(await authHeaders()),
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
      ...(await authHeaders()),
    });
    return readOrder(parseApiItem(result, resource, isRecord));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
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
