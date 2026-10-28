import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Search,
  X,
  AudioLines,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignInButton } from "@/components/SignInButton";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const SearchBox = ({ initialQuery }: { initialQuery: string }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <form onSubmit={submit} className="relative mx-auto w-full max-w-[480px]">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="What do you want to play?"
        className="h-10 w-full rounded-full border border-white/10 bg-white/5 pr-9 pl-10 text-sm text-white placeholder:text-zinc-400 focus:border-white/30 focus:bg-white/10 focus:outline-none backdrop-blur-xl transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            navigate("/search");
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
};

const Topbar = () => {
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const initialQuery =
    location.pathname === "/search"
      ? new URLSearchParams(location.search).get("q") ?? ""
      : "";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-black/20 backdrop-blur-2xl border-b border-white/5 px-3 py-2.5 sm:px-6 sm:py-3 sm:justify-start">
      {/* ---------------- MOBILE HOME SCREEN: Logo + Soundwave Name on Left ---------------- */}
      {isHome ? (
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white sm:hidden active:scale-95 transition"
        >
          <div className="grid size-8 place-items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-xs">
            <AudioLines className="size-5 text-emerald-400" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">Soundwave</span>
        </Link>
      ) : (
        /* Mobile Non-Home Navigation: Back button + Mini Logo */
        <div className="flex items-center gap-1.5 sm:hidden">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="grid size-8 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <ChevronLeft className="size-4" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-white">
            <AudioLines className="size-5 text-emerald-400" />
          </Link>
        </div>
      )}

      {/* ---------------- DESKTOP NAVIGATION CHEVRONS ---------------- */}
      <div className="hidden sm:flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="grid size-8 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white active:scale-95 shadow-xs"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Go forward"
          onClick={() => navigate(1)}
          className="grid size-8 place-items-center rounded-full bg-white/5 border border-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white active:scale-95 shadow-xs"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ---------------- DESKTOP SEARCH BOX ---------------- */}
      {location.pathname !== "/search" ? (
        <div className="flex-1 min-w-0 mx-1 hidden sm:block">
          <SearchBox
            key={`${location.pathname}${location.search}`}
            initialQuery={initialQuery}
          />
        </div>
      ) : (
        <div className="flex-1 min-w-0 mx-1 hidden sm:block" />
      )}

      {/* Spacer for mobile to push right controls to far right */}
      <div className="flex-1 sm:hidden" />

      {/* ---------------- RIGHT SIDE: Admin & User Profile / Sign In ---------------- */}
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            to="/admin"
            aria-label="Admin dashboard"
            className={cn(
              "hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white sm:flex",
              location.pathname.startsWith("/admin") && "text-emerald-400"
            )}
          >
            <LayoutDashboard className="size-4" />
            Admin
          </Link>
        )}
        {user ? (
          <UserMenu />
        ) : (
          <SignInButton>
            <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-bold px-3.5 h-8">
              Sign in
            </Button>
          </SignInButton>
        )}
      </div>
    </header>
  );
};

export default Topbar;
