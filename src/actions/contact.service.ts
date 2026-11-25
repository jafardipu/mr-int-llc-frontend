import "server-only";

import { AuthApiError, authRequest } from "@/actions/auth-request";
import { isRecord } from "@/services/api-response";

export type ContactStatus = "pending" | "replied";

export type SubmitContactInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type ContactMessage = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: ContactStatus;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function readContact(value: unknown): ContactMessage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.email !== "string" ||
    typeof value.message !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: typeof value.userId === "string" ? value.userId : null,
    name: value.name,
    email: value.email,
    subject: typeof value.subject === "string" ? value.subject : null,
    message: value.message,
    status: value.status === "replied" ? "replied" : "pending",
    reply: typeof value.reply === "string" ? value.reply : null,
    repliedAt: typeof value.repliedAt === "string" ? value.repliedAt : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

export async function submitContact(input: SubmitContactInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const subject = input.subject?.trim();

  if (!name) throw new AuthApiError("Name is required", 400);
  if (!email) throw new AuthApiError("Email is required", 400);
  if (!message) throw new AuthApiError("Message is required", 400);

  const body: Record<string, string> = { name, email, message };
  if (subject) body.subject = subject;

  // Signed-in senders are linked to their account; guests can write too.
  const result = await authRequest<unknown>(
    "/contact",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { auth: "optional" },
  );

  const contact = readContact(result.data);
  if (!contact) {
    throw new AuthApiError("Contact response was invalid.", 500);
  }

  return {
    message: result.message || "Message sent successfully",
    contact,
  };
}
