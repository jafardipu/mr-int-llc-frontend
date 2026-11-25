import "server-only";

import { cache } from "react";
import { ApiRequestError, apiGet } from "@/services/api-service";
import { isRecord } from "@/services/api-response";
import type {
  MyProfile,
  ProfileOrder,
  ProfileWholesaleFee,
  UserProfile,
  UserRole,
} from "@/services/users.types";

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
    wholesaleFee: readProfileWholesaleFee(value.wholesaleFee),
  };
}

function readProfileWholesaleFee(value: unknown): ProfileWholesaleFee | null {
  if (!isRecord(value)) return null;
  return {
    status:
      value.status === "pending" || value.status === "paid"
        ? value.status
        : null,
    amount:
      typeof value.amount === "number" && Number.isFinite(value.amount)
        ? value.amount
        : null,
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
  };
}

/**
 * The profile has no `required` flag: the fee is due when a wholesale account
 * has a fee record that isn't paid. Retail and older wholesale accounts have
 * no record, so this is false for them.
 */
export function isWholesaleFeeDue(profile: UserProfile) {
  return (
    profile.role === "wholesale" &&
    profile.wholesaleFee !== null &&
    profile.wholesaleFee.status !== "paid"
  );
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
  const result = await apiGet<unknown>("users/my-profile", {
    auth: "required",
  });

  return parseMyProfile(result);
}

export const getMyProfile = cache(loadMyProfile);
