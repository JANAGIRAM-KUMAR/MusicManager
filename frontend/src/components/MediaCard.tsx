import { Link } from "react-router-dom";
import { Play } from "lucide-react";
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
            "aspect-square w-full shadow-lg",
            round ? "rounded-full" : "rounded-md"
          )}
        />
      {false && onPlay && (
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const user = useAuthStore.getState().user;
            if (!user) {
              toast.error("Log in to listen");
              useAuthStore.getState().openSignIn?.();
              return;
            }
            onPlay();
          }}
            className="absolute right-2 bottom-2 grid size-11 translate-y-2 place-items-center rounded-full bg-emerald-500 text-black opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-emerald-400"
          >
            <Play className="size-5 fill-current" />
          </button>
        )}
      </div>
      <p className={cn("truncate font-semibold text-white", round && "text-center")}>{title}</p>
      {subtitle && (
        <p className={cn("mt-1 line-clamp-2 text-xs text-zinc-400", round && "text-center")}>
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
          "group block rounded-lg p-3 transition hover:bg-white/10",
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
      className={cn("group block rounded-lg p-3 transition hover:bg-white/10", onPlay && "cursor-pointer", className)}
    >
      {content}
    </div>
  );
};
