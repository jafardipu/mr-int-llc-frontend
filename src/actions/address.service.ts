import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord, parseApiItem } from "@/services/api-response";
import { readAddress, type Address } from "@/services/address.service";

export type AddressInput = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

async function accessToken() {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) throw new AuthApiError("Please sign in again.", 401);
  return token;
}

function isAddress(value: unknown): value is Address {
  return readAddress(value) !== null;
}

function addressBody(input: AddressInput, requireLine1: boolean) {
  const addressLine1 = input.addressLine1?.trim() ?? "";
  if (requireLine1 && !addressLine1) {
    throw new AuthApiError("Street address is required", 400);
  }

  const body: Record<string, string | boolean> = {};
  if (addressLine1) body.addressLine1 = addressLine1;
  if (input.addressLine2?.trim()) body.addressLine2 = input.addressLine2.trim();
  if (input.city?.trim()) body.city = input.city.trim();
  if (input.state?.trim()) body.state = input.state.trim();
  if (input.postalCode?.trim()) body.postalCode = input.postalCode.trim();
  if (input.country?.trim()) body.country = input.country.trim();
  if (typeof input.isDefault === "boolean") body.isDefault = input.isDefault;

  if (!requireLine1 && Object.keys(body).length === 0) {
    throw new AuthApiError("Add at least one address field to update.", 400);
  }

  return body;
}

export async function createAddress(input: AddressInput) {
  const token = await accessToken();
  const result = await authRequest<unknown>("/address", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressBody(input, true)),
  });

  return {
    message: result.message || "Address created successfully",
    address: readAddress(parseApiItem(result, "address", isAddress)),
  };
}

export async function updateAddress(id: string, input: AddressInput) {
  const token = await accessToken();
  const result = await authRequest<unknown>(
    `/address/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(addressBody(input, false)),
    },
  );

  return {
    message: result.message || "Address updated successfully",
    address: readAddress(parseApiItem(result, "address", isAddress)),
  };
}

export async function deleteAddress(id: string) {
  const token = await accessToken();
  const result = await authRequest<unknown>(
    `/address/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return {
    message: result.message || "Address deleted successfully",
    data: isRecord(result.data) ? result.data : null,
  };
}
