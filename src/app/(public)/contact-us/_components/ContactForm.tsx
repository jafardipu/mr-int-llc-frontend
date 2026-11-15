"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitContactAction } from "@/actions/contact.actions";
import { Button } from "@/components/ui/button";
import { contactFormSchema, type ContactFormData } from "./schemas";

type ContactFormProps = {
  initialValues?: Partial<Pick<ContactFormData, "name" | "email">>;
};

export default function ContactForm({ initialValues }: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    const result = await submitContactAction({
      name: data.name,
      email: data.email,
      subject: data.subject?.trim() || undefined,
      message: data.message,
    });

    if (result.status === "error") {
      toast.error(result.message);
      return;
    }

    toast.success(
      "Message received successfully! We will get back to you soon",
    );
    form.reset({
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      subject: "",
      message: "",
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 lg:space-y-5"
      noValidate
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-primary-gray"
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your name"
            autoComplete="name"
            {...form.register("name")}
            className="w-full rounded-md border border-[#051a0e0a] bg-[#F7F9FB] px-4 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-color"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm font-semibold text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-primary-gray"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            {...form.register("email")}
            className="w-full rounded-md border border-[#051a0e0a] bg-[#F7F9FB] px-4 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-color"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm font-semibold text-red-600">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-semibold text-primary-gray"
        >
          Subject <span className="font-normal text-[#9ca3af]">(optional)</span>
        </label>
        <input
          id="subject"
          type="text"
          placeholder="Enter your subject"
          {...form.register("subject")}
          className="w-full rounded-md border border-[#051a0e0a] bg-[#F7F9FB] px-4 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-color"
        />
        {form.formState.errors.subject && (
          <p className="mt-1 text-sm font-semibold text-red-600">
            {form.formState.errors.subject.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-semibold text-primary-gray"
        >
          Message
        </label>
        <textarea
          id="message"
          placeholder="How can we help you?"
          rows={4}
          {...form.register("message")}
          className="w-full rounded-md border border-[#051a0e0a] bg-[#F7F9FB] px-4 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-color"
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-sm font-semibold text-red-600">
            {form.formState.errors.message.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full cursor-pointer rounded-full bg-secondary-color py-6 font-bold text-white hover:bg-secondary-color/90"
      >
        {form.formState.isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
