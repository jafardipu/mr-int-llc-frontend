import { toast } from "sonner";
import type { WishlistActionResult } from "@/actions/wishlist.actions";

export async function runFavoriteAction(
  loadingMessage: string,
  action: () => Promise<WishlistActionResult>,
) {
  const toastId = toast.loading(loadingMessage);
  const result = await action();

  if (result.status === "error") {
    toast.error(result.message, { id: toastId });
    return result;
  }

  toast.success(result.message, { id: toastId });
  return result;
}
