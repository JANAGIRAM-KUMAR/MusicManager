import { useState } from "react";
import { ListEnd, ListMusic, ListPlus, Pause, Play, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { PlaylistPickerDialog } from "@/components/PlaylistPickerDialog";
import { formatTime } from "@/lib/format";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";
import type { Song } from "@/types";

interface SongRowProps {
  song: Song;
  index?: number;
  isActive?: boolean;
  isPlaying?: boolean;
  onPlay: (song: Song) => void;
  onRemove?: () => void;
  className?: string;
}

export const SongRow = ({
  song,
  index,
  isActive = false,
  isPlaying = false,
  onPlay,
  onRemove,
  className,
}: SongRowProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const activate = () => {
    if (isActive) togglePlay();
    else onPlay(song);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
          }
        }}
        className={cn(
          "group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-white/10 sm:grid-cols-[2rem_4fr_2fr_auto]",
          isActive && "bg-white/5",
          className
        )}
      >
        <div className="flex w-8 items-center justify-center text-right">
          <span className={cn("text-xs tabular-nums group-hover:hidden", isActive && "hidden text-emerald-400")}>
            {index === undefined ? "" : index + 1}
          </span>
          <span className={cn("hidden group-hover:block", isActive && "block")}>
            {isActive && isPlaying ? (
              <Pause className="size-3.5 fill-current" />
            ) : (
              <Play className="size-3.5 fill-current" />
            )}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <CoverImage
            src={song.imageUrl}
            alt={song.title}
            fallbackLabel={song.title}
            className="size-10 shrink-0 rounded"
          />
          <div className="min-w-0">
            <p className={cn("truncate font-medium text-white", isActive && "text-emerald-400")}>
              {song.title}
            </p>
            <p className="truncate text-xs text-zinc-400">{song.artist}</p>
          </div>
        </div>

        <div className="hidden truncate text-xs sm:block">
          {song.albumId ? "Album" : "Single"}
        </div>

        <div className="flex items-center gap-1">
          <LikeButton song={song} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />
          <button
            type="button"
            aria-label="Play next"
            className="grid place-items-center rounded-full p-1 opacity-0 transition hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              usePlayerStore.getState().playNextInQueue(song);
              toast.success("Playing next");
            }}
          >
            <ListEnd className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Add to queue"
            className="grid place-items-center rounded-full p-1 opacity-0 transition hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              usePlayerStore.getState().addToQueue(song);
              toast.success("Added to queue");
            }}
          >
            <ListPlus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Add to playlist"
            className="grid place-items-center rounded-full p-1 opacity-0 transition hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              setPickerOpen(true);
            }}
          >
            <ListMusic className="size-4" />
          </button>
          {onRemove ? (
            <button
              type="button"
              aria-label="Remove song"
              className="grid place-items-center rounded-full p-1 opacity-0 transition hover:text-red-400 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
          <span className="w-10 text-right text-xs tabular-nums">{formatTime(song.duration)}</span>
        </div>
      </div>

      <PlaylistPickerDialog song={song} open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
};
