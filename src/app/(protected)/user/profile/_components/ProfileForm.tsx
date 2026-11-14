"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Camera, Mail, Package, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/shared/empty-state/EmptyState";
import { updateMyProfileAction } from "@/actions/profile.actions";
import { UserAvatar } from "@/components/shared/user/UserAvatar";
import { profileRoleLabel } from "@/lib/profile";
import type { MyProfile } from "@/services/users.types";

type ProfileFormValues = {
  name: string;
  phoneNumber: string;
};

const fieldClassName =
  "h-11 w-full rounded-lg border border-[#E1E5EA] bg-white px-4 pl-11 text-sm text-[#273449] shadow-sm outline-none transition focus:border-[#a45a1a] focus:ring-2 focus:ring-[#a45a1a]/15 sm:h-12";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfileForm({ profile: initialProfile }: { profile: MyProfile }) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const form = useForm<ProfileFormValues>({
    mode: "onBlur",
    defaultValues: {
      name: initialProfile.name,
      phoneNumber: initialProfile.phoneNumber ?? "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    setProfile(initialProfile);
    reset({
      name: initialProfile.name,
      phoneNumber: initialProfile.phoneNumber ?? "",
    });
  }, [initialProfile, reset]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose an image file.");
      return;
    }

    setProfileFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAvatarError("");
    setSubmitMessage("");
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setPending(true);
    setSubmitError("");
    setSubmitMessage("");

    const body = new FormData();
    body.set("name", values.name.trim());
    body.set("phoneNumber", values.phoneNumber.trim());
    if (profileFile) body.set("profile", profileFile);

    const result = await updateMyProfileAction(body);
    setPending(false);

    if (result.status === "error" || !result.profile) {
      setSubmitError(result.message);
      return;
    }

    const updated = result.profile;
    setProfile((current) => ({ ...updated, orders: current.orders }));
    setProfileFile(null);
    setPreviewUrl(null);
    form.reset({
      name: updated.name,
      phoneNumber: updated.phoneNumber ?? "",
    });
    setSubmitMessage(result.message || "profile updated successfully");
    router.refresh();
  };

  const verified = profile.verification.status;

  return (
    <div className="mx-auto w-full max-w-240 space-y-8">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold text-[#171D2A] sm:text-[28px]">
              Personal Information
            </h1>
            <p className="mt-1 text-sm text-[#7b8493]">
              Manage your account details.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-[#344054] border border-[#cce8dc] bg-[#eaf5ef] text-[#388165]">
                {profileRoleLabel(profile.role)}
              </span>
              {/* <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  verified
                    ? "border border-[#cce8dc] bg-[#eaf5ef] text-[#388165]"
                    : "border border-[#F3D6A8] bg-[#FBF6EE] text-[#9A6700]"
                }`}
              >
                {verified ? "Verified" : "Not verified"}
              </span> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserAvatar
              name={profile.name}
              src={previewUrl || profile.profile}
              className="size-16 text-lg sm:size-18"
            />
            <div>
              <p className="text-sm font-semibold text-[#273449]">Profile photo</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1 inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-medium text-[#a45a1a] hover:text-[#81430f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45a1a]"
              >
                <Camera aria-hidden="true" className="size-4" />
                Change photo
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                name="profile"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Choose a profile photo"
              />
            </div>
          </div>
        </header>

        {avatarError && (
          <p role="alert" className="text-sm text-red-600">
            {avatarError}
          </p>
        )}

        <section aria-labelledby="profile-information-heading" className="space-y-5">
          <h2
            id="profile-information-heading"
            className="text-sm font-semibold text-[#202a39]"
          >
            Your Information
          </h2>

          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#344054]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserRound aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  id="name"
                  autoComplete="name"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  className={fieldClassName}
                  {...form.register("name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Enter at least 2 characters",
                    },
                  })}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#344054]">
                Email Address
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  readOnly
                  aria-readonly="true"
                  className={`${fieldClassName} bg-[#F8F9FB] text-[#667085]`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-[#344054]">
                Phone Number
              </label>
              <div className="relative">
                <Phone aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  className={fieldClassName}
                  {...form.register("phoneNumber")}
                />
              </div>
            </div>
          </div>
        </section>

        {submitError && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </p>
        )}
        {submitMessage && (
          <p role="status" className="text-sm font-medium text-[#348267]">
            {submitMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#a45a1a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#81430f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a45a1a] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-14"
        >
          {pending ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </form>

      <RecentOrders orders={profile.orders} />
    </div>
  );
}

function RecentOrders({ orders }: { orders: MyProfile["orders"] }) {
  return (
    <section aria-labelledby="recent-orders-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-orders-heading" className="text-sm font-semibold text-[#202a39]">
          Recent orders
        </h2>
        <Link href="/user/orders" className="text-sm font-medium text-[#a45a1a] hover:text-[#81430f]">
          View all
        </Link>
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={Package} message="No recent orders." className="min-h-40" />
      ) : (
        <ul className="divide-y divide-[#E1E5EA] rounded-xl border border-[#E1E5EA] bg-white">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#273449]">{order.orderNumber}</p>
                <p className="text-xs text-[#7b8493]">
                  {formatOrderDate(order.createdAt)} · {order.status}
                </p>
              </div>
              <p className="text-sm font-medium text-[#273449]">{currency.format(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
