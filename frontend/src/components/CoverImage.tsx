import { useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { coverFallback, initials } from "@/lib/format";

interface CoverImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  iconClassName?: string;
}

const CoverImageInner = ({
  src = "",
  alt,
  className,
  fallbackLabel,
  iconClassName,
}: CoverImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(!src);

  if (failed || !currentSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-emerald-500/30 via-zinc-700 to-zinc-900 text-white/70",
          className
        )}
        aria-label={alt}
      >
        {fallbackLabel ? (
          <span className="text-lg font-bold">{initials(fallbackLabel)}</span>
        ) : (
          <Music2 className={cn("size-6", iconClassName)} />
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      className={cn("object-cover", className)}
      onError={() => {
        const fallback = coverFallback(currentSrc);
        if (fallback !== currentSrc) {
          setCurrentSrc(fallback);
        } else {
          setFailed(true);
        }
      }}
    />
  );
};

export const CoverImage = (props: CoverImageProps) => (
  <CoverImageInner key={props.src ?? ""} {...props} />
);
