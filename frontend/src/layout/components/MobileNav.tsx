import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Library,
  Shield,
  SlidersHorizontal,
  Mic2,
  Pause,
  Play,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { CoverImage } from "@/components/CoverImage";
import { LikeButton } from "@/components/LikeButton";
import { audioEngine } from "@/lib/audioEngine";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const eq = usePlayerStore((state) => state.eq);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setLyricsOpen = usePlayerStore((state) => state.setLyricsOpen);
  const setAudioSettingsOpen = usePlayerStore((state) => state.setAudioSettingsOpen);
  const setMobilePlayerOpen = usePlayerStore((state) => state.setMobilePlayerOpen);

  const mobilePlayerOpen = usePlayerStore((state) => state.mobilePlayerOpen);
  const audioSettingsOpen = usePlayerStore((state) => state.audioSettingsOpen);
  const lyricsOpen = usePlayerStore((state) => state.lyricsOpen);

  // When fullscreen player, audio settings, or lyrics modal are open, hide the mobile dock completely
  if (mobilePlayerOpen || audioSettingsOpen || lyricsOpen) {
    return null;
  }

  const handleNavClick = () => {
    // Immediately close any open modal/dialogs and clear lingering backdrops or locks
    window.dispatchEvent(new CustomEvent("spotify:close-all-dialogs"));
    if (typeof document !== "undefined") {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
      );
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-locked");
    }
  };

  const navItems = [
    {
      label: "Home",
      to: "/",
      icon: Home,
      isActive: location.pathname === "/",
    },
    {
      label: "Search",
      to: "/search",
      icon: Search,
      isActive: location.pathname.startsWith("/search"),
    },
    {
      label: "Your Library",
      to: "/library",
      icon: Library,
      isActive:
        location.pathname.startsWith("/library") ||
        location.pathname.startsWith("/liked") ||
        location.pathname.startsWith("/playlist"),
    },
    ...(isAdmin
      ? [
          {
            label: "Admin",
            to: "/admin",
            icon: Shield,
            isActive: location.pathname.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-x-3 sm:inset-x-6 bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] z-40 lg:hidden flex flex-col gap-2 pointer-events-none select-none max-w-lg mx-auto">
      {/* ---------------- MOBILE FLOATING MINI-PLAYER ---------------- */}
      {currentSong && (
        <div
          onClick={() => setMobilePlayerOpen(true)}
          className="pointer-events-auto group relative flex items-center justify-between gap-3 p-2.5 glass-dock rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] cursor-pointer active:scale-[0.99] transition overflow-hidden w-full border border-white/15"
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
              onClick={() => {
                audioEngine.unlock();
                void audioEngine.resumeContext();
                setAudioSettingsOpen(true);
              }}
              className={cn(
                "size-8 grid place-items-center rounded-full active:scale-90 transition",
                eq?.enabled ? "text-emerald-400" : "text-zinc-400 hover:text-white"
              )}
              aria-label="Audio settings and equalizer"
              title="Audio FX"
            >
              <SlidersHorizontal className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setLyricsOpen(true)}
              className="size-8 grid place-items-center rounded-full text-zinc-400 hover:text-white active:scale-90 transition"
              aria-label="Open lyrics"
              title="Lyrics"
            >
              <Mic2 className="size-4" />
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
      )}

      {/* ---------------- MOBILE BOTTOM NAVIGATION BAR ---------------- */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto w-full glass-dock rounded-full px-3 py-1.5 flex items-center justify-around shadow-[0_12px_40px_rgba(0,0,0,0.65)] border border-white/15"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              onTouchStart={handleNavClick}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-full transition-all min-w-[58px] active:scale-95 touch-manipulation",
                item.isActive
                  ? "text-emerald-400 font-bold bg-white/10 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <div className="relative">
                <Icon className="size-5" />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
