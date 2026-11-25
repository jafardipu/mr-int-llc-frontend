import { Suspense } from "react";
import { hasSessionCookie } from "@/lib/server-session";
import { getMyProfile, isWholesaleFeeDue } from "@/services/users.service";
import WholesaleFeeBannerBar from "./WholesaleFeeBannerBar";
import WholesaleFeeStateSync from "./WholesaleFeeStateSync";

async function WholesaleFeeBannerContent() {
  if (!(await hasSessionCookie())) {
    return <WholesaleFeeStateSync required={false} amount={null} />;
  }

  let required: boolean;
  let amount: number | null;
  try {
    // Cached per request; the Navbar already loads the profile.
    const profile = await getMyProfile();
    required = isWholesaleFeeDue(profile);
    amount = profile.wholesaleFee?.amount ?? null;
  } catch {
    // Unknown this time (signed out, network). Keep whatever the client had;
    // the backend still enforces the fee with a 402.
    return null;
  }

  return (
    <>
      {required && <WholesaleFeeBannerBar amount={amount} />}
      <WholesaleFeeStateSync required={required} amount={amount} />
    </>
  );
}

/**
 * The fee banner plus the client-store sync. Rendered by the Navbar, so it is
 * on every page and re-checks the profile on every server render.
 */
export default function WholesaleFeeBanner() {
  return (
    <Suspense fallback={null}>
      <WholesaleFeeBannerContent />
    </Suspense>
  );
}
