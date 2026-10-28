import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();
  const isAdmin = useAuthStore((state) => state.isAdmin);

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
      className="fixed inset-x-0 bottom-0 z-[60] lg:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 flex items-center justify-around select-none"
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
              "flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors min-w-[64px] active:scale-95 touch-manipulation",
              item.isActive
                ? "text-emerald-400 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <div className="relative">
              <Icon className="size-5" />
              {item.isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-emerald-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
