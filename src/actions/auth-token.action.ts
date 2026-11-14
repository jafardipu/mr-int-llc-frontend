"use server";

import { cookies } from "next/headers";
import { accessTokenCookie } from "@/lib/auth-cookies";

export async function getAccessTokenAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(accessTokenCookie)?.value ?? null;
}

