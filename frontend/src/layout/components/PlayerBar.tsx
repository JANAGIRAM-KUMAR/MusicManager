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
import { MobilePlayerModal } from "./MobilePlayerModal";

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
  void usePlayerStore((state) => state.graphMode);
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
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

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
    <>
      {/* ---------------- MOBILE FLOATING MINI-PLAYER ---------------- */}
      {currentSong && (
        <div className="sm:hidden w-full">
          <div
            onClick={() => setMobileModalOpen(true)}
            className="group relative flex items-center justify-between gap-3 p-2 bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-zinc-800 shadow-2xl cursor-pointer active:scale-[0.99] transition overflow-hidden"
          >
            {/* Top progress indicator bar */}
            <div
              className="absolute top-0 left-0 h-[2.5px] bg-emerald-400 transition-all duration-200"
              style={{
                width: `${Math.min(100, ((progress || 0) / (duration || 1)) * 100)}%`,
              }}
            />

            {/* Song Cover & Meta */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <CoverImage
                src={currentSong.imageUrl}
                alt={currentSong.title}
                fallbackLabel={currentSong.title}
                className="size-11 rounded-lg shrink-0 object-cover shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{currentSong.title}</p>
                <p className="truncate text-[11px] text-zinc-400 mt-0.5">{currentSong.artist}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButton song={currentSong} className="size-8 grid place-items-center" />
              <button
                type="button"
                onClick={togglePlay}
                className="size-9 rounded-full bg-white text-black grid place-items-center active:scale-90 transition shadow-md"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : isLoading ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                ) : (
                  <Play className="size-4 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DESKTOP FULL PLAYER BAR ---------------- */}
      <footer className="hidden sm:flex h-[84px] shrink-0 items-center gap-3 rounded-xl bg-zinc-900/95 backdrop-blur-md px-3 text-white border border-zinc-800/80 shadow-md">
        {/* Left: Song details */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:w-[30%] sm:flex-none">
          {currentSong ? (
            <>
              <CoverImage
                src={currentSong.imageUrl}
                alt={currentSong.title}
                fallbackLabel={currentSong.title}
                className="size-14 shrink-0 rounded-lg shadow-sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{currentSong.title}</p>
                <p className="truncate text-xs text-zinc-400 mt-0.5">{currentSong.artist}</p>
              </div>
              <LikeButton song={currentSong} className="hidden sm:grid" />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-500">
                <Play className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">Nothing playing</p>
                <p className="text-xs text-zinc-500">Select a song to start listening</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Playback controls & Seekbar */}
        <div className="flex flex-[2] flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Shuffle"
              aria-pressed={shuffle}
              onClick={toggleShuffle}
              className={cn(
                "relative text-zinc-400 transition hover:text-white",
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
              className="grid size-9 place-items-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 disabled:opacity-40 shadow-sm"
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
                "relative text-zinc-400 transition hover:text-white",
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
              className="group [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-700"
            />
            <span className="w-9 text-[11px] tabular-nums text-zinc-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Audio FX, Lyrics, Queue, Volume */}
        <div className="flex flex-1 items-center justify-end gap-2.5 sm:w-[30%] sm:flex-none">
          <Visualizer className="hidden h-7 w-16 sm:block" />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Audio settings"
                className="text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-[#121212] text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Playback & Audio settings</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Adjust equalizer and crossfade settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Crossfade</p>
                      <p className="text-xs text-zinc-400">Smooth transition between tracks</p>
                    </div>
                    <span className="text-xs tabular-nums text-zinc-400">{(crossfade / 1000).toFixed(1)}s</span>
                  </div>
                  <Slider
                    value={[crossfade / 1000]}
                    min={0}
                    max={12}
                    step={0.5}
                    onValueChange={(value) => setCrossfade(Math.round(value[0] * 1000))}
                    className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-700"
                  />
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">3-Band Equalizer</p>
                      <p className="text-xs text-zinc-400">Fine-tune audio balance</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                      onClick={() => setEq({ bass: 0, mid: 0, treble: 0 })}
                    >
                      Reset
                    </Button>
                  </div>
                  {(["bass", "mid", "treble"] as const).map((band) => (
                    <div key={band} className="mb-3">
                      <div className="mb-1 flex justify-between text-xs text-zinc-400">
                        <span className="capitalize">{band}</span>
                        <span className="tabular-nums">{eq[band] > 0 ? "+" : ""}{eq[band]} dB</span>
                      </div>
                      <Slider
                        value={[eq[band]]}
                        min={-12}
                        max={12}
                        step={1}
                        onValueChange={(value) => setEq({ ...eq, [band]: value[0] })}
                        className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-700"
                      />
                    </div>
                  ))}
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
              "text-zinc-400 transition hover:text-white",
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
            className="w-24 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-700"
          />
        </div>

        <LyricsPanel open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
      </footer>

      {/* Mobile Fullscreen Modal */}
      <MobilePlayerModal
        open={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </>
  );
};
