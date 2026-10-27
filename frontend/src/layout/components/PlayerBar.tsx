import { useEffect, useState } from "react";
import {
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { Visualizer } from "@/components/Visualizer";
import { LyricsPanel } from "@/components/lyrics/LyricsPanel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const PlayerBar = () => {
  const user = useAuthStore((state) => state.user);
  const isSignedIn = Boolean(user);
  const recordPlay = useLibraryStore((state) => state.recordPlay);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const crossfade = usePlayerStore((state) => state.crossfade);
  const eq = usePlayerStore((state) => state.eq);
  const graphMode = usePlayerStore((state) => state.graphMode);
  const queueOpen = usePlayerStore((state) => state.queueOpen);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const seek = usePlayerStore((state) => state.seek);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const setCrossfade = usePlayerStore((state) => state.setCrossfade);
  const setEq = usePlayerStore((state) => state.setEq);
  const toggleQueue = usePlayerStore((state) => state.toggleQueue);

  const [scrub, setScrub] = useState<number | null>(null);
  const [volumeScrub, setVolumeScrub] = useState<number | null>(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const currentSongId = currentSong?._id;

  useEffect(() => {
    const song = usePlayerStore.getState().currentSong;
    if (song && isSignedIn) {
      void recordPlay(song);
    }
  }, [currentSongId, isSignedIn, recordPlay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a, [contenteditable='true'], [role='button']"
        )
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight" && event.shiftKey) {
        seek(Math.min(duration, progress + 5));
      } else if (event.key === "ArrowLeft" && event.shiftKey) {
        seek(Math.max(0, progress - 5));
      } else if (event.key.toLowerCase() === "m") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration, progress, seek, toggleMute, togglePlay]);

  const displayProgress = scrub ?? progress;
  const displayVolume = volumeScrub ?? (muted ? 0 : volume);
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer className="flex h-[78px] shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-2 text-white sm:h-[86px] sm:gap-3 sm:px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 sm:w-[30%] sm:flex-none">
        {currentSong ? (
          <>
            <CoverImage
              src={currentSong.imageUrl}
              alt={currentSong.title}
              fallbackLabel={currentSong.title}
              className="size-14 shrink-0 rounded"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentSong.title}</p>
              <p className="truncate text-xs text-zinc-400">{currentSong.artist}</p>
            </div>
            <LikeButton song={currentSong} className="hidden sm:grid" />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center rounded bg-zinc-800 text-zinc-500">
              <Play className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Nothing playing</p>
              <p className="text-xs text-zinc-500">Pick a song to start listening</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-[2] flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Shuffle"
            aria-pressed={shuffle}
            onClick={toggleShuffle}
            className={cn(
              "relative hidden text-zinc-400 transition hover:text-white sm:block",
              shuffle && "text-emerald-400 hover:text-emerald-300"
            )}
          >
            <Shuffle className="size-4" />
            {shuffle && <span className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-400" />}
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={playPrevious}
            disabled={!currentSong}
            className="text-zinc-400 transition hover:text-white disabled:opacity-40"
          >
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
            disabled={!currentSong}
            className="grid size-9 place-items-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-40"
          >
            {isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : isLoading ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <Play className="size-4 translate-x-px fill-current" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => playNext()}
            disabled={!currentSong}
            className="text-zinc-400 transition hover:text-white disabled:opacity-40"
          >
            <SkipForward className="size-5 fill-current" />
          </button>
          <button
            type="button"
            aria-label={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off"}
            onClick={cycleRepeat}
            className={cn(
              "relative hidden text-zinc-400 transition hover:text-white sm:block",
              repeat !== "off" && "text-emerald-400 hover:text-emerald-300"
            )}
          >
            {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            {repeat !== "off" && <span className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-400" />}
          </button>
        </div>

        <div className="flex w-full max-w-[560px] items-center gap-2">
          <span className="w-9 text-right text-[11px] tabular-nums text-zinc-400">
            {formatTime(displayProgress)}
          </span>
          <Slider
            aria-label="Seek"
            value={[Math.min(displayProgress, duration || 1)]}
            max={duration || 1}
            step={0.1}
            disabled={!currentSong}
            onValueChange={(value) => setScrub(value[0])}
            onValueCommit={(value) => {
              seek(value[0]);
              setScrub(null);
            }}
            className="group [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-600"
          />
          <span className="w-9 text-[11px] tabular-nums text-zinc-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:w-[30%] sm:flex-none">
        <Visualizer className="hidden h-7 w-16 lg:block" />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Audio settings"
              className="hidden text-zinc-400 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Playback</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Equalizer, crossfade and engine details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">Equalizer</h3>
                {(["bass", "mid", "treble"] as const).map((band) => (
                  <div key={band} className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-zinc-400">
                      <span className="capitalize">{band}</span>
                      <span className="tabular-nums">{eq[band] > 0 ? "+" : ""}{eq[band]} dB</span>
                    </div>
                    <Slider
                      value={[eq[band]]}
                      min={-12}
                      max={12}
                      step={0.5}
                      onValueChange={(value) => setEq({ ...eq, [band]: value[0] })}
                      className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500 [&_[data-slot=slider-track]]:bg-zinc-700"
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  onClick={() => setEq({ bass: 0, mid: 0, treble: 0 })}
                >
                  Reset equalizer
                </Button>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>Crossfade</span>
                  <span className="tabular-nums">{(crossfade / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                  value={[crossfade / 1000]}
                  min={0}
                  max={12}
                  step={0.5}
                  onValueChange={(value) => setCrossfade(Math.round(value[0] * 1000))}
                  className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500 [&_[data-slot=slider-track]]:bg-zinc-700"
                />
              </div>

              <div className="rounded-md border border-zinc-800 p-3 text-xs text-zinc-400">
                <p className="flex justify-between">
                  <span>Engine</span>
                  <span className="font-mono text-emerald-400">
                    {graphMode === "webaudio" ? "Web Audio (dual deck)" : "HTML5 fallback"}
                  </span>
                </p>
                <p className="mt-1 flex justify-between">
                  <span>Format support</span>
                  <span className="font-mono">
                    {["MP3", "WAV", "AAC", "OGG", "FLAC"]
                      .filter((format) => {
                        const probe = document.createElement("audio");
                        return probe.canPlayType(`audio/${format.toLowerCase()}`) !== "";
                      })
                      .join(" · ") || "—"}
                  </span>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <button
          type="button"
          aria-label="Lyrics"
          onClick={() => setLyricsOpen(true)}
          disabled={!currentSong}
          className="text-zinc-400 transition hover:text-white disabled:opacity-40"
        >
          <Mic2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Queue"
          aria-pressed={queueOpen}
          onClick={toggleQueue}
          className={cn(
            "hidden text-zinc-400 transition hover:text-white sm:block",
            queueOpen && "text-emerald-400 hover:text-emerald-300"
          )}
        >
          <ListMusic className="size-4" />
        </button>
        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          className="text-zinc-400 transition hover:text-white"
        >
          <VolumeIcon className="size-4" />
        </button>
        <Slider
          aria-label="Volume"
          value={[displayVolume]}
          max={1}
          step={0.01}
          onValueChange={(value) => {
            setVolumeScrub(value[0]);
            setVolume(value[0]);
          }}
          onValueCommit={() => setVolumeScrub(null)}
          className="hidden w-24 sm:flex [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-600"
        />
      </div>
      <LyricsPanel open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
    </footer>
  );
};
