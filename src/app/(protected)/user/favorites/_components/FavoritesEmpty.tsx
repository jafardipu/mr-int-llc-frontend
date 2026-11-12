import { Heart } from "lucide-react";

export default function FavoritesEmpty({
  message = "No favorites yet.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center gap-3 px-4 text-center xl:min-h-[calc(100dvh-16rem)]">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Heart
          aria-hidden="true"
          className="size-7 text-[#9CA3AF]"
          strokeWidth={1.5}
        />
      </span>
      <p className="text-sm text-[#6B7280]">{message}</p>
    </div>
  );
}
