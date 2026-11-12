"use server";

import { AuthApiError } from "@/actions/auth-request";
import { updateMyProfile } from "@/actions/users.service";
import { ApiRequestError } from "@/services/api-service";
import type { UserProfile } from "@/services/users.types";

export type ProfileActionState = {
  status: "success" | "error";
  message: string;
  profile?: UserProfile;
};

export async function updateMyProfileAction(
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const result = await updateMyProfile(formData);
    return {
      status: "success",
      message: result.message,
      profile: result.profile,
    };
  } catch (error) {
    if (error instanceof AuthApiError || error instanceof ApiRequestError) {
      return { status: "error", message: error.message };
    }

    return { status: "error", message: "Unable to update your profile." };
  }
}
