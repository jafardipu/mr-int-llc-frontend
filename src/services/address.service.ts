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

const addressTag = "customer-addresses";

export interface Address {
  id: string;
  userId: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function readAddress(value: unknown): Address | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    userId: typeof value.userId === "string" ? value.userId : "",
    addressLine1:
      typeof value.addressLine1 === "string" ? value.addressLine1 : null,
    addressLine2:
      typeof value.addressLine2 === "string" ? value.addressLine2 : null,
    city: typeof value.city === "string" ? value.city : null,
    state: typeof value.state === "string" ? value.state : null,
    postalCode: typeof value.postalCode === "string" ? value.postalCode : null,
    country: typeof value.country === "string" ? value.country : null,
    isDefault: value.isDefault === true,
    isDeleted: value.isDeleted === true,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function isAddress(value: unknown): value is Address {
  return readAddress(value) !== null;
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

export async function getMyAddresses(query: {
  page?: number;
  limit?: number;
} = {}): Promise<ApiPage<Address>> {
  const result: unknown = await apiGet("address", {
    searchParams: {
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    },
    tags: [addressTag],
    ...(await authHeaders()),
  });

  const page = parseApiPage(result, "address", isAddress);
  return {
    ...page,
    data: page.data.flatMap((item) => {
      const address = readAddress(item);
      return address && !address.isDeleted ? [address] : [];
    }),
  };
}

export async function getAddressById(id: string): Promise<Address | null> {
  const resource = `address/${encodeURIComponent(id)}`;
  try {
    const result: unknown = await apiGet(resource, {
      tags: [addressTag],
      ...(await authHeaders()),
    });
    const address = readAddress(parseApiItem(result, resource, isRecord));
    return address && !address.isDeleted ? address : null;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
