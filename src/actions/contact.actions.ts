"use server";

import { AuthApiError } from "@/actions/auth-request";
import {
  submitContact,
  type ContactMessage,
  type SubmitContactInput,
} from "@/actions/contact.service";

type ActionResult<T> =
  | { status: "success"; message: string; data: T }
  | { status: "error"; message: string; statusCode?: number };

function fail(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof AuthApiError) {
    return {
      status: "error",
      message: error.message,
      statusCode: error.status,
    };
  }
  return { status: "error", message: fallback };
}

export async function submitContactAction(
  input: SubmitContactInput,
): Promise<ActionResult<ContactMessage>> {
  try {
    const result = await submitContact(input);
    return {
      status: "success",
      message: result.message,
      data: result.contact,
    };
  } catch (error) {
    return fail(error, "Unable to send your message. Please try again.");
  }
}
