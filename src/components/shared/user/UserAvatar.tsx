import { profileInitials } from "@/lib/profile";

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E6EAF0] bg-[#F4EDDF] font-semibold text-[#995618] ${className ?? ""}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        profileInitials(name)
      )}
    </span>
  );
}
