import { useState } from "react";
import { ChevronDown, Mic2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SlidersHorizontal, ListMusic } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { LyricsPreviewCard } from "@/components/lyrics/LyricsPreviewCard";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const crossfade = usePlayerStore((state) => state.crossfade);
  const eq = usePlayerStore((state) => state.eq);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const seek = usePlayerStore((state) => state.seek);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const setCrossfade = usePlayerStore((state) => state.setCrossfade);
  const setEq = usePlayerStore((state) => state.setEq);
  const toggleQueue = usePlayerStore((state) => state.toggleQueue);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);

  const [scrub, setScrub] = useState<number | null>(null);
  const [eqOpen, setEqOpen] = useState(false);

  if (!open || !currentSong) return null;

  const displayProgress = scrub ?? progress;

  return (
    <div className="fixed inset-0 z-50 flex flex-col glass-dock backdrop-blur-3xl bg-[#08090d]/85 p-6 text-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
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
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              setLyricsOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white px-4 py-2 rounded-full glass-pill active:scale-95 transition"
          >
            <Mic2 className="size-4 text-emerald-400" />
            <span>Lyrics</span>
          </button>

          <button
            type="button"
            onClick={() => setEqOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white px-4 py-2 rounded-full glass-pill active:scale-95 transition"
          >
            <SlidersHorizontal className="size-4 text-emerald-400" />
            <span>Audio FX</span>
          </button>
        </div>
      </div>

      {/* Audio FX Dialog */}
      <Dialog open={eqOpen} onOpenChange={setEqOpen}>
        <DialogContent className="border-white/10 glass-dock text-white max-w-sm rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>Playback & Audio Settings</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Adjust equalizer frequencies and crossfade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-2">
                <span>Crossfade</span>
                <span className="tabular-nums">{(crossfade / 1000).toFixed(1)}s</span>
              </div>
              <Slider
                value={[crossfade / 1000]}
                min={0}
                max={12}
                step={0.5}
                onValueChange={(val) => setCrossfade(Math.round(val[0] * 1000))}
              />
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-zinc-300">3-Band Equalizer</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEq({ bass: 0, mid: 0, treble: 0 })}
                  className="h-6 text-[10px] text-zinc-400 hover:text-white"
                >
                  Reset
                </Button>
              </div>

              {(["bass", "mid", "treble"] as const).map((band) => (
                <div key={band} className="mb-3">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span className="capitalize">{band}</span>
                    <span className="tabular-nums">{eq[band] > 0 ? "+" : ""}{eq[band]} dB</span>
                  </div>
                  <Slider
                    value={[eq[band]]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={(val) => setEq({ ...eq, [band]: val[0] })}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
