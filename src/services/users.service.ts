import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { ApiRequestError, apiGet } from "@/services/api-service";
import { isRecord } from "@/services/api-response";
import type { MyProfile, ProfileOrder, UserProfile, UserRole } from "@/services/users.types";

const userRoles: UserRole[] = ["retail", "wholesale", "admin", "supper_admin"];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

function readProfileOrder(value: unknown): ProfileOrder | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.orderNumber !== "string" ||
    typeof value.status !== "string" ||
    typeof value.customerType !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  const total = typeof value.total === "number"
    ? value.total
    : typeof value.total === "string" && Number.isFinite(Number(value.total))
      ? Number(value.total)
      : null;
  if (total === null) return null;

  return {
    id: value.id,
    orderNumber: value.orderNumber,
    status: value.status,
    customerType: value.customerType,
    total,
    createdAt: value.createdAt,
  };
}

function readUserProfile(value: unknown): UserProfile {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string" ||
    typeof value.status !== "string" ||
    !isUserRole(value.role) ||
    typeof value.isVerified !== "boolean" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw new ApiRequestError("The API returned an invalid profile.", 500);
  }

  const verification = isRecord(value.verification) &&
    typeof value.verification.status === "boolean"
    ? { status: value.verification.status }
    : { status: value.isVerified };

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    status: value.status,
    role: value.role,
    profile: typeof value.profile === "string" ? value.profile : null,
    phoneNumber: typeof value.phoneNumber === "string" ? value.phoneNumber : null,
    isVerified: value.isVerified,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    verification,
    address: Array.isArray(value.address) ? value.address : [],
    deviceHistory: Array.isArray(value.deviceHistory) ? value.deviceHistory : [],
  };
}

export function parseMyProfile(result: unknown): MyProfile {
  if (!isRecord(result) || result.success === false) {
    throw new ApiRequestError(
      isRecord(result) && typeof result.message === "string"
        ? result.message
        : "The API returned an invalid profile.",
      500,
    );
  }

  const profile = readUserProfile(result.data);
  const orders = isRecord(result.data) && Array.isArray(result.data.orders)
    ? result.data.orders.flatMap((order) => {
        const parsed = readProfileOrder(order);
        return parsed ? [parsed] : [];
      })
    : [];

  return { ...profile, orders };
}

export function parseUpdatedProfile(result: unknown): UserProfile {
  if (!isRecord(result) || result.success === false) {
    throw new ApiRequestError(
      isRecord(result) && typeof result.message === "string"
        ? result.message
        : "The API returned an invalid profile.",
      500,
    );
  }

  return readUserProfile(result.data);
}

export function readProfileMessage(result: unknown) {
  return isRecord(result) && typeof result.message === "string"
    ? result.message
    : "";
}

async function loadMyProfile() {
  const accessToken = (await cookies()).get(accessTokenCookie)?.value;
  if (!accessToken) {
    throw new ApiRequestError("Please sign in again.", 401);
  }

  const result = await apiGet<unknown>("users/my-profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  return parseMyProfile(result);
}

export const getMyProfile = cache(loadMyProfile);
