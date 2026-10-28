import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CoverImage } from "@/components/CoverImage";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  round?: boolean;
  onPlay?: () => void;
  className?: string;
}

export const MediaCard = ({
  title,
  subtitle,
  imageUrl,
  href,
  round = false,
  onPlay,
  className,
}: MediaCardProps) => {
  const content = (
    <>
      <div className="relative mb-3">
        <CoverImage
          src={imageUrl}
          alt={title}
          fallbackLabel={title}
          className={cn(
            "aspect-square w-full shadow-lg transition-transform duration-300 group-hover:scale-[1.02]",
            round ? "rounded-full" : "rounded-xl"
          )}
        />
      </div>
      <p className={cn("truncate font-semibold text-white text-xs sm:text-sm", round && "text-center")}>{title}</p>
      {subtitle && (
        <p className={cn("mt-1 line-clamp-2 text-[11px] sm:text-xs text-zinc-400", round && "text-center")}>
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(
          "group block rounded-2xl p-3 glass-card hover:bg-white/10 transition-all duration-300",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      role={onPlay ? "button" : undefined}
      tabIndex={onPlay ? 0 : undefined}
      onClick={() => {
        if (!onPlay) return;
        const user = useAuthStore.getState().user;
        if (!user) {
          toast.error("Log in to listen");
          useAuthStore.getState().openSignIn?.();
          return;
        }
        onPlay();
      }}
      onKeyDown={(event) => {
        if (!onPlay) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const user = useAuthStore.getState().user;
          if (!user) {
            toast.error("Log in to listen");
            useAuthStore.getState().openSignIn?.();
            return;
          }
          onPlay();
        }
      }}
      className={cn(
        "group block rounded-2xl p-3 glass-card hover:bg-white/10 transition-all duration-300",
        onPlay && "cursor-pointer",
        className
      )}
    >
      {content}
    </div>
  );
};
