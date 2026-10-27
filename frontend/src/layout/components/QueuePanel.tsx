import { ListMusic, Trash2, X } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { Visualizer } from "@/components/Visualizer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { cn } from "@/lib/utils";

export const QueuePanel = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSong = usePlayerStore((state) => state.playSong);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen);
  const playSongs = usePlayerStore((state) => state.playSongs);

  const recentlyPlayed = useLibraryStore((state) => state.recentlyPlayed);
  const upcoming = queue.slice(currentIndex + 1);

  return (
    <div className="flex h-full flex-col rounded-lg bg-zinc-900">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-bold">Queue</h2>
        <div className="flex items-center gap-1">
          {upcoming.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:text-white"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            aria-label="Close queue"
            onClick={() => setQueueOpen(false)}
            className="grid size-7 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        {currentSong && (
          <section className="mb-4 px-2 pt-1">
            <p className="mb-2 text-xs font-semibold text-zinc-400">Now playing</p>
            <div className="flex items-center gap-3 rounded-md bg-white/5 p-2">
              <CoverImage
                src={currentSong.imageUrl}
                alt={currentSong.title}
                fallbackLabel={currentSong.title}
                className="size-11 rounded"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-emerald-400">{currentSong.title}</p>
                <p className="truncate text-xs text-zinc-400">{currentSong.artist}</p>
                <Visualizer className="mt-1 h-3 w-14" bars={12} />
              </div>
              {isPlaying && (
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              )}
            </div>
          </section>
        )}

        <section className="px-2">
          <p className="mb-2 text-xs font-semibold text-zinc-400">
            Next up {upcoming.length > 0 && `(${upcoming.length})`}
          </p>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-zinc-500">
              <ListMusic className="size-6" />
              <p>Nothing queued. Pick a playlist or album to keep the music going.</p>
            </div>
          ) : (
            <ul className="space-y-0.5 pb-4">
              {upcoming.map((song, index) => {
                const queueIndex = currentIndex + 1 + index;
                return (
                  <li key={`${song._id}-${queueIndex}`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => playSong(song)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") playSong(song);
                      }}
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-md p-1.5 transition hover:bg-white/10"
                      )}
                    >
                      <CoverImage
                        src={song.imageUrl}
                        alt={song.title}
                        fallbackLabel={song.title}
                        className="size-10 rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{song.title}</p>
                        <p className="truncate text-xs text-zinc-400">{song.artist}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${song.title} from queue`}
                        className="rounded-full p-1 text-zinc-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFromQueue(queueIndex);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {recentlyPlayed.length > 0 && (
          <section className="border-t border-zinc-800 px-2 pt-4 pb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400">Recently played</p>
              <button
                type="button"
                className="text-[11px] text-zinc-500 transition hover:text-white"
                onClick={() => playSongs(recentlyPlayed)}
              >
                Play all
              </button>
            </div>
            <ul className="space-y-0.5">
              {recentlyPlayed.slice(0, 5).map((song) => (
                <li key={`recent-${song._id}`}>
                  <button
                    type="button"
                    onClick={() => playSong(song)}
                    className="flex w-full items-center gap-3 rounded-md p-1.5 text-left transition hover:bg-white/10"
                  >
                    <CoverImage
                      src={song.imageUrl}
                      alt={song.title}
                      fallbackLabel={song.title}
                      className="size-8 rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white">{song.title}</p>
                      <p className="truncate text-[11px] text-zinc-500">{song.artist}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </ScrollArea>
    </div>
  );
};
