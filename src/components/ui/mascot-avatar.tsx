import { useState } from "react";
import type { MascotIdentity } from "../../../supabase/functions/_shared/mascotCatalog";

/** Shared framing; preserve the original character artwork and avoid cropping. */
export function MascotAvatar({ mascot, decorative = false, className = "" }: {
  mascot: MascotIdentity; decorative?: boolean; className?: string;
}) {
  const [failedImage, setFailedImage] = useState<string>();
  return (
    <span className={`relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[hsl(var(--squad-avatar-bg))] ring-1 ring-border/30 ${className}`}>
      {failedImage === mascot.image ? (
        <span aria-hidden={decorative || undefined} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : mascot.name} className="text-xl">{mascot.emoji}</span>
      ) : (
        <img src={mascot.image} alt={decorative ? "" : mascot.name} className="h-full w-full object-contain p-1" onError={() => setFailedImage(mascot.image)} />
      )}
    </span>
  );
}
