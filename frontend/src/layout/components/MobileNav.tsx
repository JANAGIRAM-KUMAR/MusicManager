import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const mobilePlayerOpen = usePlayerStore((state) => state.mobilePlayerOpen);
  const audioSettingsOpen = usePlayerStore((state) => state.audioSettingsOpen);
  const lyricsOpen = usePlayerStore((state) => state.lyricsOpen);

  // When fullscreen player, audio settings, or lyrics modal are open, hide the bottom navigation bar completely
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
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-4 bottom-3 z-40 lg:hidden glass-dock rounded-full px-3 py-1.5 flex items-center justify-around select-none shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
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
  );
};
