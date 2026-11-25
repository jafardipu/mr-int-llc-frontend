import "server-only";

import { AuthApiError, authRequest } from "@/actions/auth-request";
import { parseApiItem } from "@/services/api-response";
import { readCategory, type Category } from "@/services/categories.service";

function isCategory(value: unknown): value is Category {
  return readCategory(value) !== null;
}

function categoryFormData(input: FormData, requireName: boolean) {
  const body = new FormData();
  const name = input.get("name");
  const image = input.get("image");
  const status = input.get("status");
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const hasImage = image instanceof File && image.size > 0;
  const hasStatus = status === "active" || status === "inactive";

  if (requireName && !trimmedName) {
    throw new AuthApiError("Name is required", 400);
  }
  if (trimmedName.length > 120) {
    throw new AuthApiError("Name is too long", 400);
  }
  if (trimmedName) body.append("name", trimmedName);
  if (hasStatus) body.append("status", status);
  if (hasImage) body.append("image", image);
  if (!requireName && !trimmedName && !hasImage && !hasStatus) {
    throw new AuthApiError("Add a name, status, or image to update this category.", 400);
  }

  return body;
}

async function mutateCategory(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: FormData,
) {
  return authRequest<unknown>(path, { method, body }, { auth: "required" });
}

export async function createCategory(input: FormData) {
  const result = await mutateCategory(
    "/categories",
    "POST",
    categoryFormData(input, true),
  );
  return {
    message: result.message || "Category created successfully",
    category: readCategory(parseApiItem(result, "categories", isCategory)),
  };
}

export async function updateCategory(id: string, input: FormData) {
  const result = await mutateCategory(
    `/categories/${encodeURIComponent(id)}`,
    "PATCH",
    categoryFormData(input, false),
  );
  return {
    message: result.message || "Category updated successfully",
    category: readCategory(parseApiItem(result, "categories", isCategory)),
  };
}

export async function deleteCategory(id: string) {
  const result = await mutateCategory(
    `/categories/${encodeURIComponent(id)}`,
    "DELETE",
  );
  return {
    message: result.message || "Category deleted successfully",
  };
}
