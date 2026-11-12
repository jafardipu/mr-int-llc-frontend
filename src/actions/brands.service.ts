import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import { isRecord, parseApiItem } from "@/services/api-response";
import type { Brand } from "@/services/brands.service";

function readBrand(value: unknown): Brand | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    image:
      typeof value.image === "string" && value.image.trim()
        ? value.image
        : null,
    isDeleted: value.isDeleted === true,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

function isBrand(value: unknown): value is Brand {
  return readBrand(value) !== null;
}

async function accessToken() {
  const token = (await cookies()).get(accessTokenCookie)?.value;
  if (!token) {
    throw new AuthApiError("Please sign in again.", 401);
  }
  return token;
}

function brandFormData(input: FormData, requireName: boolean) {
  const body = new FormData();
  const name = input.get("name");
  const image = input.get("image");
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (requireName && !trimmedName) {
    throw new AuthApiError("Name is required", 400);
  }
  if (trimmedName.length > 120) {
    throw new AuthApiError("Name is too long", 400);
  }
  if (trimmedName) {
    body.append("name", trimmedName);
  }
  if (image instanceof File && image.size > 0) {
    body.append("image", image);
  }
  if (!requireName && !trimmedName && !(image instanceof File && image.size > 0)) {
    throw new AuthApiError("Add a name or image to update this brand.", 400);
  }

  return body;
}

async function mutateBrand(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: FormData,
) {
  const token = await accessToken();
  return authRequest<unknown>(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

export async function createBrand(input: FormData) {
  const result = await mutateBrand("/brands", "POST", brandFormData(input, true));
  return {
    message: result.message || "Brand created successfully",
    brand: readBrand(parseApiItem(result, "brands", isBrand)),
  };
}

export async function updateBrand(id: string, input: FormData) {
  const result = await mutateBrand(
    `/brands/${encodeURIComponent(id)}`,
    "PATCH",
    brandFormData(input, false),
  );
  return {
    message: result.message || "Brand updated successfully",
    brand: readBrand(parseApiItem(result, "brands", isBrand)),
  };
}

export async function deleteBrand(id: string) {
  const result = await mutateBrand(
    `/brands/${encodeURIComponent(id)}`,
    "DELETE",
  );
  return {
    message: result.message || "Brand deleted successfully",
  };
}
