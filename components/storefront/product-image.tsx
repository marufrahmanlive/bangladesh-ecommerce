"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: ProductImageProps) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={src ?? "/images/products/nakshi-kantha-bed-cover.svg"}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
