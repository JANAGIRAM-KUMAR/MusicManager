import { useState, useEffect } from "react";
import { ChevronDown, Mic2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SlidersHorizontal, ListMusic } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { LyricsPreviewCard } from "@/components/lyrics/LyricsPreviewCard";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { audioEngine } from "@/lib/audioEngine";

interface MobilePlayerModalProps {
  open: boolean;
  onClose: () => void;
}

export const MobilePlayerModal = ({ open, onClose }: MobilePlayerModalProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const seek = usePlayerStore((state) => state.seek);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const toggleQueue = usePlayerStore((state) => state.toggleQueue);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);
  const setAudioSettingsOpen = usePlayerStore((state) => state.setAudioSettingsOpen);

  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleCloseEvent = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("spotify:close-all-dialogs", handleCloseEvent);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("spotify:close-all-dialogs", handleCloseEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !currentSong) return null;

  const displayProgress = scrub ?? progress;

  return (
    <div className="fixed inset-0 z-[75] flex flex-col glass-dock backdrop-blur-3xl bg-[#08090d]/95 p-6 pb-20 text-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Dynamic ambient orb behind album */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-emerald-500/20 blur-[100px]" />

      {/* Top Bar with Dismiss */}
      <div className="relative z-10 flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={onClose}
          className="size-10 grid place-items-center rounded-full glass-pill text-zinc-300 hover:text-white"
          aria-label="Minimize player"
        >
          <ChevronDown className="size-6" />
        </button>

        <div className="text-center">
          <p className="text-[10px] tracking-wider uppercase text-zinc-400 font-semibold">
            Playing Song
          </p>
          <p className="text-xs font-bold text-white truncate max-w-[200px]">
            {currentSong.title}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            toggleQueue();
          }}
          className="size-10 grid place-items-center rounded-full glass-pill text-zinc-300 hover:text-white"
          aria-label="Open queue"
        >
          <ListMusic className="size-5" />
        </button>
      </div>

      {/* Album Artwork */}
      <div className="relative z-10 my-auto py-4 flex justify-center">
        <div className="relative aspect-square w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 glass-card p-1">
          <CoverImage
            src={currentSong.imageUrl}
            alt={currentSong.title}
            fallbackLabel={currentSong.title}
            className="size-full object-cover rounded-2xl"
          />
        </div>
      </div>

      {/* Song Details & Like */}
      <div className="relative z-10 pt-4 pb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white truncate">{currentSong.title}</h2>
            <p className="text-sm text-zinc-400 truncate mt-0.5">{currentSong.artist}</p>
          </div>
          <LikeButton song={currentSong} className="size-10 grid place-items-center" />
        </div>

        {/* Progress Scrubber */}
        <div className="mt-6 space-y-1.5">
          <Slider
            aria-label="Seek"
            value={[Math.min(displayProgress, duration || 1)]}
            max={duration || 1}
            step={0.1}
            onValueChange={(val) => setScrub(val[0])}
            onValueCommit={(val) => {
              seek(val[0]);
              setScrub(null);
            }}
            className="[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-track]]:bg-zinc-700/80"
          />
          <div className="flex justify-between text-xs text-zinc-400 font-mono">
            <span>{formatTime(displayProgress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between pt-4 pb-6">
          <button
            type="button"
            onClick={toggleShuffle}
            className={cn(
              "text-zinc-400 p-2 transition",
              shuffle && "text-emerald-400"
            )}
            aria-label="Shuffle"
          >
            <Shuffle className="size-5" />
          </button>

          <button
            type="button"
            onClick={playPrevious}
            className="text-white hover:text-zinc-300 p-2"
            aria-label="Previous track"
          >
            <SkipBack className="size-7 fill-current" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="size-16 rounded-full bg-white text-black grid place-items-center shadow-lg active:scale-95 transition"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-7 fill-current" />
            ) : isLoading ? (
              <span className="size-6 animate-spin rounded-full border-3 border-black/30 border-t-black" />
            ) : (
              <Play className="size-7 fill-current ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => playNext()}
            className="text-white hover:text-zinc-300 p-2"
            aria-label="Next track"
          >
            <SkipForward className="size-7 fill-current" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            className={cn(
              "text-zinc-400 p-2 transition",
              repeat !== "off" && "text-emerald-400"
            )}
            aria-label="Repeat mode"
          >
            {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
          </button>
        </div>

        {/* Live Lyrics Preview Card (Spotify Mobile Experience) */}
        <div className="pt-2 pb-4">
          <LyricsPreviewCard
            onExpand={() => {
              onClose();
              setLyricsOpen(true);
            }}
          />
        </div>

        {/* Footer Actions: Lyrics & Settings */}
        <div className="flex items-center justify-between pt-4 pb-8 mb-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              setLyricsOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white px-4 py-2.5 rounded-full glass-pill active:scale-95 transition"
          >
            <Mic2 className="size-4 text-emerald-400" />
            <span>Lyrics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.unlock();
              void audioEngine.resumeContext();
              setAudioSettingsOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white px-4 py-2.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 active:scale-95 transition shadow-sm"
          >
            <SlidersHorizontal className="size-4 text-emerald-400" />
            <span>Audio FX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
