import "server-only";

import { cookies } from "next/headers";
import { AuthApiError, authRequest } from "@/actions/auth-request";
import { accessTokenCookie } from "@/lib/auth-cookies";
import {
  parseUpdatedProfile,
  readProfileMessage,
} from "@/services/users.service";
import type { UpdateMyProfileInput, UserProfile } from "@/services/users.types";

export interface CreatedUser {
  id: string;
  name: string;
  email: string;
  role: "retail" | "wholesale";
  phoneNumber: string | null;
  profile: string | null;
  isVerified: boolean;
}

export interface CreateUserResponse {
  user: CreatedUser;
  otpToken: {
    token: string;
  };
}

export function createUser(body: FormData) {
  return authRequest<CreateUserResponse>("/users", {
    method: "POST",
    body,
  });
}

function profileFormData(input: FormData | UpdateMyProfileInput) {
  const body = new FormData();
  const name = input instanceof FormData ? input.get("name") : input.name;
  const phoneNumber =
    input instanceof FormData ? input.get("phoneNumber") : input.phoneNumber;
  const profileFile =
    input instanceof FormData ? input.get("profile") : input.profileFile;

  if (typeof name === "string" && name.trim()) {
    body.append("name", name.trim());
  }
  if (typeof phoneNumber === "string") {
    body.append("phoneNumber", phoneNumber.trim());
  }
  if (profileFile instanceof File && profileFile.size > 0) {
    body.append("profile", profileFile);
  }

  return body;
}

export async function updateMyProfile(
  input: FormData | UpdateMyProfileInput,
): Promise<{ message: string; profile: UserProfile }> {
  const accessToken = (await cookies()).get(accessTokenCookie)?.value;
  if (!accessToken) {
    throw new AuthApiError("Please sign in again.", 401);
  }

  const result = await authRequest<unknown>("/users/update-my-profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: profileFormData(input),
  });

  return {
    message: readProfileMessage(result) || "profile updated successfully",
    profile: parseUpdatedProfile(result),
  };
}
