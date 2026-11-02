"use client";

import { useState, type ReactNode } from "react";

type CourseImageProps = {
  src: string | null;
  alt: string;
  className: string;
  fallback: ReactNode;
};

export default function CourseImage({
  src,
  alt,
  className,
  fallback,
}: CourseImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return fallback;

  return (
    <img
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
      src={src}
    />
  );
}
