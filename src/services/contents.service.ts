import "server-only";

import { cache } from "react";
import { apiGet } from "@/services/api-service";
import { isRecord, parseApiItem } from "@/services/api-response";

const contentsTag = "cms-contents";
const contentsRevalidate = 3600;

export type ContentKey =
  | "aboutUs"
  | "termsAndCondition"
  | "privacyPolicy"
  | "refundPolicy"
  | "shippingPolicy"
  | "copyRight"
  | "footerText";

export interface Contents {
  id: string;
  type: string;
  termsAndCondition: string | null;
  privacyPolicy: string | null;
  refundPolicy: string | null;
  shippingPolicy: string | null;
  aboutUs: string | null;
  copyRight: string | null;
  footerText: string | null;
  createdAt: string;
  updatedAt: string;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isContents(value: unknown): value is Contents {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  return true;
}

function readContents(value: unknown): Contents {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error("API returned an invalid response: /contents");
  }

  return {
    id: value.id,
    type: typeof value.type === "string" ? value.type : "main",
    termsAndCondition: readNullableString(value.termsAndCondition),
    privacyPolicy: readNullableString(value.privacyPolicy),
    refundPolicy: readNullableString(value.refundPolicy),
    shippingPolicy: readNullableString(value.shippingPolicy),
    aboutUs: readNullableString(value.aboutUs),
    copyRight: readNullableString(value.copyRight),
    footerText: readNullableString(value.footerText),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

export const getContents = cache(async (): Promise<Contents> => {
  const result: unknown = await apiGet("contents", {
    tags: [contentsTag],
    revalidate: contentsRevalidate,
  });
  return readContents(parseApiItem(result, "contents", isContents));
});

export const getContentByKey = cache(
  async (key: ContentKey): Promise<string | null> => {
    const result: unknown = await apiGet("contents", {
      searchParams: { key },
      tags: [contentsTag],
      revalidate: contentsRevalidate,
    });

    if (
      !isRecord(result) ||
      result.success !== true ||
      !isRecord(result.data)
    ) {
      throw new Error(`API returned an invalid response: /contents?key=${key}`);
    }

    const value = result.data[key];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? value : null;
  },
);
