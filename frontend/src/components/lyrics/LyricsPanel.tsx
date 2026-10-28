import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  X,
  Mic2,
  Maximize2,
  Minimize2,
  Music2,
  AlignLeft,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
} from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLyrics } from "@/hooks/useLyrics";
import { getActiveLyricIndex } from "@/lib/lrcParser";
import { CoverImage } from "@/components/CoverImage";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LyricsPanelProps {
  open?: boolean;
  onClose?: () => void;
}

const LYRIC_THEMES = [
  { bg: "from-emerald-950 via-zinc-950 to-black", glow: "bg-emerald-500/25", accent: "text-emerald-400" },
  { bg: "from-purple-950 via-zinc-950 to-black", glow: "bg-purple-500/25", accent: "text-purple-400" },
  { bg: "from-rose-950 via-zinc-950 to-black", glow: "bg-rose-500/25", accent: "text-rose-400" },
  { bg: "from-amber-950 via-zinc-950 to-black", glow: "bg-amber-500/25", accent: "text-amber-400" },
  { bg: "from-cyan-950 via-zinc-950 to-black", glow: "bg-cyan-500/25", accent: "text-cyan-400" },
  { bg: "from-indigo-950 via-zinc-950 to-black", glow: "bg-indigo-500/25", accent: "text-indigo-400" },
];

export const LyricsPanel = ({ open: propOpen, onClose: propOnClose }: LyricsPanelProps) => {
  const storeLyricsOpen = usePlayerStore((state) => state.lyricsOpen);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);

  const isOpen = propOpen !== undefined ? propOpen : storeLyricsOpen;
  const handleClose = propOnClose || (() => setLyricsOpen(false));

  const currentSong = usePlayerStore((state) => state.currentSong);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const seek = usePlayerStore((state) => state.seek);

  const { syncedLines, plainLyrics, isInstrumental, loading } = useLyrics(
    currentSong?._id,
    currentSong?.title,
    currentSong?.artist,
    currentSong?.duration
  );

  const [viewMode, setViewMode] = useState<"synced" | "plain">("synced");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Dynamic Theme Palette selection based on song title
  const theme = useMemo(() => {
    if (!currentSong) return LYRIC_THEMES[0];
    let sum = 0;
    for (let i = 0; i < currentSong.title.length; i++) {
      sum += currentSong.title.charCodeAt(i);
    }
    return LYRIC_THEMES[sum % LYRIC_THEMES.length];
  }, [currentSong?.title]);

  // Adjust viewMode when synced lines change
  useEffect(() => {
    if (syncedLines.length > 0) {
      setViewMode("synced");
    } else if (plainLyrics) {
      setViewMode("plain");
    }
  }, [syncedLines.length, plainLyrics]);

  // Active lyric line index based on real-time playback progress
  const activeIndex = useMemo(() => {
    if (!syncedLines.length) return -1;
    return getActiveLyricIndex(syncedLines, progress, 0.15);
  }, [syncedLines, progress]);

  // Smooth centered auto-scroll to the active verse
  const scrollToActiveLine = useCallback((smooth = true) => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "center",
      });
    }
  }, []);

  // Auto-scroll when active index changes unless user is manually browsing
  useEffect(() => {
    if (isOpen && viewMode === "synced" && !isUserScrolling && activeIndex >= 0) {
      scrollToActiveLine(true);
    }
  }, [activeIndex, isUserScrolling, isOpen, viewMode, scrollToActiveLine]);

  // Detect manual scrolling to pause auto-scroll temporarily
  const handleUserScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    // Resume auto-scroll after 4 seconds of inactivity
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsUserScrolling(false);
      scrollToActiveLine(true);
    }, 4000);
  };

  const handleLineClick = (time: number) => {
    seek(time);
    setIsUserScrolling(false);
  };

  // Keyboard escape listener to dismiss panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, handleClose, isOpen]);

  if (!isOpen || !currentSong) return null;

  const hasSynced = syncedLines.length > 0;
  const hasLyrics = hasSynced || plainLyrics.length > 0;
  const displayProgress = scrubTime ?? progress;

  return (
    <div
      className={cn(
        "select-none overflow-hidden transition-all duration-300 text-white flex flex-col",
        isFullscreen
          ? "fixed inset-0 z-[80] rounded-none p-0 animate-in fade-in"
          : "fixed inset-0 z-[70] sm:inset-x-2 sm:top-2 sm:bottom-[94px] sm:z-50 sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl animate-in fade-in slide-in-from-bottom-2"
      )}
    >
      {/* Background with Ambient Glowing Orbs */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", theme.bg)} />
      <div
        className={cn(
          "absolute -top-32 -left-32 size-[450px] sm:size-[600px] rounded-full blur-[130px] opacity-35 pointer-events-none transition-all duration-700",
          theme.glow
        )}
      />
      <div
        className={cn(
          "absolute -bottom-32 -right-32 size-[450px] sm:size-[600px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-all duration-700",
          theme.glow
        )}
      />

      {/* Main Container Shell */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-black/40 backdrop-blur-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 shrink-0 bg-black/30 backdrop-blur-md">
          {/* Mobile Dismiss Chevron / Track Information */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close lyrics"
              className="grid size-9 place-items-center rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition active:scale-95 shrink-0"
            >
              <ChevronDown className="size-6" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <CoverImage
                src={currentSong.imageUrl}
                alt={currentSong.title}
                fallbackLabel={currentSong.title}
                className="size-10 rounded-lg shadow-md shrink-0 object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm sm:text-base font-bold text-white tracking-tight">
                    {currentSong.title}
                  </h3>
                  {hasSynced && viewMode === "synced" && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      <Sparkles className="size-3" /> Live
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-400">{currentSong.artist}</p>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {hasSynced && (
              <div className="flex items-center rounded-full bg-zinc-800/80 p-0.5 border border-white/5">
                <button
                  type="button"
                  onClick={() => setViewMode("synced")}
                  className={cn(
                    "rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition flex items-center gap-1",
                    viewMode === "synced"
                      ? "bg-white text-black shadow-md shadow-white/10"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Mic2 className="size-3" />
                  <span className="hidden sm:inline">Karaoke</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("plain")}
                  className={cn(
                    "rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition flex items-center gap-1",
                    viewMode === "plain"
                      ? "bg-white text-black shadow-md shadow-white/10"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <AlignLeft className="size-3" />
                  <span className="hidden sm:inline">Plain</span>
                </button>
              </div>
            )}

            {/* Desktop Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="hidden sm:grid size-8 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Dismiss lyrics"
              className="grid size-8 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Lyrics Stream */}
        <div
          ref={scrollContainerRef}
          onWheel={handleUserScroll}
          onTouchMove={handleUserScroll}
          className="flex-1 overflow-y-auto px-5 sm:px-12 md:px-20 py-8 relative scroll-smooth no-scrollbar"
        >
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="size-9 animate-spin rounded-full border-3 border-emerald-500/20 border-t-emerald-400" />
              <p className="text-sm font-medium text-zinc-400">Loading live lyrics...</p>
            </div>
          ) : isInstrumental ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Music2 className="size-16 text-emerald-400/80 mb-4 animate-bounce" />
              <h4 className="text-2xl font-bold text-white">Instrumental Track</h4>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                This track has no vocal lyrics. Enjoy the music!
              </p>
            </div>
          ) : !hasLyrics ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Mic2 className="size-16 text-zinc-600 mb-4" />
              <h4 className="text-xl sm:text-2xl font-bold text-white">No lyrics available</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Lyrics not found for &ldquo;{currentSong.title}&rdquo;.
              </p>
            </div>
          ) : viewMode === "synced" && hasSynced ? (
            /* Live Synchronized Verses */
            <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 py-6">
              {syncedLines.map((line, index) => {
                const isActive = index === activeIndex;
                const isPast = activeIndex !== -1 && index < activeIndex;

                const prevLine = syncedLines[index - 1];
                const isInterlude = prevLine && line.time - prevLine.time > 8;
                const isInterludeActive =
                  isInterlude &&
                  progress >= prevLine.time + 3 &&
                  progress < line.time - 0.5;

                return (
                  <div key={line.id} className="space-y-3">
                    {/* Interlude Break Marker */}
                    {isInterlude && (
                      <div
                        className={cn(
                          "flex items-center gap-2 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-300",
                          isInterludeActive
                            ? "text-emerald-400 opacity-100"
                            : "text-zinc-600 opacity-40"
                        )}
                      >
                        <span className="size-2 rounded-full bg-current animate-ping" />
                        <span>Instrumental Interlude</span>
                      </div>
                    )}

                    {/* Lyric Line Verse */}
                    <div
                      ref={isActive ? activeLineRef : null}
                      onClick={() => handleLineClick(line.time)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleLineClick(line.time);
                        }
                      }}
                      className={cn(
                        "cursor-pointer transition-all duration-300 leading-snug rounded-xl p-2 sm:p-3 -mx-2 sm:-mx-3 text-left focus:outline-none",
                        isActive
                          ? "text-white font-black text-2xl sm:text-3xl md:text-4xl scale-[1.02] origin-left drop-shadow-[0_0_24px_rgba(255,255,255,0.7)]"
                          : isPast
                          ? "text-white/40 font-bold text-lg sm:text-2xl md:text-3xl hover:text-white/80"
                          : "text-white/20 font-bold text-lg sm:text-2xl md:text-3xl hover:text-white/60"
                      )}
                    >
                      <span className="inline-block">{line.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Plain Lyrics View */
            <div className="mx-auto max-w-2xl whitespace-pre-wrap text-center text-lg sm:text-2xl font-bold leading-[2.2] text-zinc-200 py-8">
              {plainLyrics}
            </div>
          )}
        </div>

        {/* Floating "Sync with playback" Pill Button */}
        {viewMode === "synced" && hasSynced && isUserScrolling && (
          <div className="absolute bottom-28 sm:bottom-6 right-5 sm:right-8 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => {
                setIsUserScrolling(false);
                scrollToActiveLine(true);
              }}
              className="flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 transition"
            >
              <RotateCcw className="size-3.5 text-emerald-600 animate-spin" />
              <span>Sync with playback</span>
            </button>
          </div>
        )}

        {/* Bottom Playback Control Bar:
            - ALWAYS visible on mobile (< sm) because the bottom player bar is hidden behind the lyrics modal.
            - On desktop (sm:), ONLY visible in Fullscreen mode. When docked normally above desktop player bar,
              the desktop player bar itself handles playback, avoiding duplicate control bars!
        */}
        <div
          className={cn(
            "shrink-0 border-t border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 sm:px-8 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,1rem))]",
            isFullscreen ? "flex flex-col" : "flex flex-col sm:hidden"
          )}
        >
          {/* Progress / Scrub Timeline */}
          <div className="flex items-center gap-2 mx-auto w-full max-w-2xl">
            <span className="w-8 text-right text-[10px] tabular-nums text-zinc-400">
              {formatTime(displayProgress)}
            </span>
            <Slider
              aria-label="Seek in lyrics view"
              value={[Math.min(displayProgress, duration || 1)]}
              max={duration || 1}
              step={0.1}
              onValueChange={(val) => setScrubTime(val[0])}
              onValueCommit={(val) => {
                seek(val[0]);
                setScrubTime(null);
              }}
              className="group [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-zinc-700"
            />
            <span className="w-8 text-[10px] tabular-nums text-zinc-400">
              {formatTime(duration)}
            </span>
          </div>

          {/* Quick Playback Action Buttons */}
          <div className="flex items-center justify-center gap-5 sm:gap-8 pt-1">
            <button
              type="button"
              aria-label="Shuffle"
              onClick={toggleShuffle}
              className={cn(
                "text-zinc-400 hover:text-white transition",
                shuffle && "text-emerald-400"
              )}
            >
              <Shuffle className="size-4" />
            </button>

            <button
              type="button"
              aria-label="Previous track"
              onClick={playPrevious}
              className="text-zinc-300 hover:text-white transition active:scale-95"
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={togglePlay}
              className="grid size-11 place-items-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : isLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <Play className="size-5 translate-x-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              aria-label="Next track"
              onClick={() => playNext()}
              className="text-zinc-300 hover:text-white transition active:scale-95"
            >
              <SkipForward className="size-5 fill-current" />
            </button>

            <button
              type="button"
              aria-label={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off"}
              onClick={cycleRepeat}
              className={cn(
                "text-zinc-400 hover:text-white transition",
                repeat !== "off" && "text-emerald-400"
              )}
            >
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
