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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { audioEngine } from "@/lib/audioEngine";
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
  void usePlayerStore((state) => state.graphMode);
  const queueOpen = usePlayerStore((state) => state.queueOpen);
  const audioSettingsOpen = usePlayerStore((state) => state.audioSettingsOpen);
  const setAudioSettingsOpen = usePlayerStore((state) => state.setAudioSettingsOpen);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const seek = usePlayerStore((state) => state.seek);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleQueue = usePlayerStore((state) => state.toggleQueue);

  const [scrub, setScrub] = useState<number | null>(null);
  const [volumeScrub, setVolumeScrub] = useState<number | null>(null);
  const lyricsOpen = usePlayerStore((state) => state.lyricsOpen);
  const toggleLyrics = usePlayerStore((state) => state.toggleLyrics);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);
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

      // If lyrics panel is open, let spacebar scroll or interact normally rather than toggling playback
      if (usePlayerStore.getState().lyricsOpen) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight" && event.shiftKey) {
        const { duration: dur, progress: prog } = usePlayerStore.getState();
        seek(Math.min(dur, prog + 5));
      } else if (event.key === "ArrowLeft" && event.shiftKey) {
        const { progress: prog } = usePlayerStore.getState();
        seek(Math.max(0, prog - 5));
      } else if (event.key.toLowerCase() === "m") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seek, toggleMute, togglePlay]);

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
            className="group relative flex items-center justify-between gap-3 p-2.5 glass-dock rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] cursor-pointer active:scale-[0.99] transition overflow-hidden"
          >
            {/* Top progress indicator bar */}
            <div
              className="absolute top-0 left-0 h-[2.5px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-200"
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
              <button
                type="button"
                onClick={() => setLyricsOpen(true)}
                className="size-8 grid place-items-center rounded-full text-zinc-400 hover:text-white active:scale-90 transition"
                aria-label="Open lyrics"
              >
                <Mic2 className="size-4 text-emerald-400" />
              </button>
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
      <footer className="hidden sm:flex h-[88px] shrink-0 items-center gap-3 rounded-2xl glass-dock px-4 text-white shadow-2xl">
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Audio settings"
            onClick={() => {
              audioEngine.unlock();
              void audioEngine.resumeContext();
              setAudioSettingsOpen(true);
            }}
            className={cn(
              "text-zinc-400 hover:bg-white/10 hover:text-white transition-colors",
              audioSettingsOpen && "text-emerald-400 hover:text-emerald-300"
            )}
          >
            <SlidersHorizontal className="size-4" />
          </Button>

          <button
            type="button"
            aria-label="Lyrics"
            aria-pressed={lyricsOpen}
            onClick={toggleLyrics}
            disabled={!currentSong}
            className={cn(
              "text-zinc-400 transition hover:text-white disabled:opacity-40",
              lyricsOpen && "text-emerald-400 hover:text-emerald-300"
            )}
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
      </footer>

      {/* Mobile Fullscreen Modal */}
      <MobilePlayerModal
        open={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
      />
    </>
  );
};
