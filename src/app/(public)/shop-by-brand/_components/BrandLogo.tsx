"use client";

import { useState } from "react";

export default function BrandLogo({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <span className="line-clamp-2 px-2 text-center text-sm font-semibold text-[#24231F]">
        {name}
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setFailed(true)}
      className="h-auto max-h-8 w-auto max-w-28 object-contain"
    />
  );
}
