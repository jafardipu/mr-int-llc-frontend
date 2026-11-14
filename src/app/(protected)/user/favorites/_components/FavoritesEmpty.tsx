import { Heart } from "lucide-react";
import EmptyState from "@/components/shared/empty-state/EmptyState";

export default function FavoritesEmpty({
  message = "No favorites yet.",
}: {
  message?: string;
}) {
  return (
    <EmptyState
      icon={Heart}
      message={message}
      className="min-h-[52vh] xl:min-h-[calc(100dvh-16rem)]"
    />
  );
}
