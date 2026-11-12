import { Suspense } from "react";
import { ApiRequestError } from "@/services/api-service";
import { getMyProfile } from "@/services/users.service";
import ProfileForm from "./_components/ProfileForm";
import ProfileSkeleton from "./_components/ProfileSkeleton";

export const metadata = {
  title: "My Profile",
};

async function ProfileContent() {
  try {
    const profile = await getMyProfile();
    return <ProfileForm profile={profile} />;
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load your profile.";

    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {message}
      </p>
    );
  }
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<ProfileSkeleton />}
    >
      <ProfileContent />
    </Suspense>
  );
}
