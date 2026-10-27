import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import type { Song } from "@/types";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  song: Song;
  className?: string;
}

export const LikeButton = ({ song, className }: LikeButtonProps) => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
  const likedSongIds = useLibraryStore((state) => state.likedSongIds);
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const liked = likedSongIds.includes(song._id);

  return (
    <button
      type="button"
      aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
      aria-pressed={liked}
      className={cn(
        "grid place-items-center rounded-full p-1 text-zinc-400 transition hover:text-white",
        liked && "text-emerald-400 hover:text-emerald-300",
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!isSignedIn) {
          toast.error("Sign in to save songs");
          return;
        }
        void toggleLike(song);
      }}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
    </button>
  );
};
