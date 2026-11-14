"use client";

import { useState } from "react";

export default function CategoryImage({
  image,
  className,
}: {
  image: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return <div aria-hidden="true" className={className ?? "h-full w-full bg-slate-300"} />;
  }

  return (
    <img
      src={image}
      alt=""
      onError={() => setFailed(true)}
      className={className ?? "h-full w-full object-cover"}
    />
  );
}
