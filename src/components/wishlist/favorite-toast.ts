import { toast } from "sonner";
import type { WishlistActionResult } from "@/actions/wishlist.actions";
import { goToWholesaleFeeIfRequired } from "@/lib/wholesale-fee";

export async function runFavoriteAction(
  loadingMessage: string,
  action: () => Promise<WishlistActionResult>,
) {
  const toastId = toast.loading(loadingMessage);
  const result = await action();

  if (result.status === "error") {
    // Unpaid wholesale fee: go pay it; that's not an error to show.
    if (goToWholesaleFeeIfRequired(result.statusCode)) {
      toast.dismiss(toastId);
      return result;
    }
    toast.error(result.message, { id: toastId });
    return result;
  }

  toast.success(result.message, { id: toastId });
  return result;
}
