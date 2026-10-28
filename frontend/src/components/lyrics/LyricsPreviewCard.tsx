import { useMemo } from "react";
import { Mic2, Maximize2 } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyrics } from "@/hooks/useLyrics";
import { getActiveLyricIndex } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";

interface LyricsPreviewCardProps {
  onExpand: () => void;
  className?: string;
}

export const LyricsPreviewCard = ({ onExpand, className }: LyricsPreviewCardProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const progress = usePlayerStore((state) => state.progress);

  const { syncedLines, plainLyrics, isInstrumental, loading } = useLyrics(
    currentSong?._id,
    currentSong?.title,
    currentSong?.artist,
    currentSong?.duration
  );

  const activeIndex = useMemo(() => {
    if (!syncedLines.length) return -1;
    return getActiveLyricIndex(syncedLines, progress, 0.15);
  }, [syncedLines, progress]);

  if (!currentSong) return null;

  const hasSynced = syncedLines.length > 0;
  const currentLine = hasSynced && activeIndex >= 0 ? syncedLines[activeIndex] : null;
  const nextLine = hasSynced && activeIndex >= 0 ? syncedLines[activeIndex + 1] : null;

  return (
    <div
      onClick={onExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl glass-card bg-emerald-950/25 p-5 border border-emerald-500/25 shadow-xl cursor-pointer active:scale-[0.99] transition-all hover:border-emerald-500/40 group",
        className
      )}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none group-hover:bg-emerald-500/25 transition-all" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Mic2 className="size-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Lyrics
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 group-hover:text-white transition rounded-full glass-pill px-3 py-1">
          <span>Full screen</span>
          <Maximize2 className="size-3" />
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 py-1 space-y-2">
        {loading ? (
          <div className="space-y-2 py-1">
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        ) : isInstrumental ? (
          <p className="text-sm font-semibold text-zinc-400 italic">
            Instrumental track (no vocal lyrics)
          </p>
        ) : hasSynced ? (
          <div>
            <p className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-sm transition-all duration-200">
              {currentLine ? currentLine.text : syncedLines[0]?.text || "Sing along..."}
            </p>
            {nextLine && (
              <p className="text-xs sm:text-sm font-bold text-zinc-400 leading-snug truncate mt-1">
                {nextLine.text}
              </p>
            )}
          </div>
        ) : plainLyrics ? (
          <p className="text-sm font-semibold text-zinc-300 line-clamp-3 leading-relaxed">
            {plainLyrics.slice(0, 150)}...
          </p>
        ) : (
          <p className="text-xs font-medium text-zinc-500">
            Tap to search for lyrics
          </p>
        )}
      </div>
    </div>
  );
};
