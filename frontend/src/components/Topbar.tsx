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
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="What do you want to play?"
        className="h-10 w-full rounded-full border border-transparent bg-zinc-800 pr-9 pl-9 text-sm text-white placeholder:text-zinc-400 focus:border-white/40 focus:outline-none"
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

  const initialQuery =
    location.pathname === "/search"
      ? new URLSearchParams(location.search).get("q") ?? ""
      : "";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-zinc-900/80 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="grid size-8 place-items-center rounded-full bg-black/60 text-zinc-300 transition hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Go forward"
          onClick={() => navigate(1)}
          className="grid size-8 place-items-center rounded-full bg-black/60 text-zinc-300 transition hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <Link to="/" className="flex items-center gap-2 text-white md:hidden">
        <AudioLines className="size-5 text-emerald-400" />
      </Link>

      <SearchBox
        key={`${location.pathname}${location.search}`}
        initialQuery={initialQuery}
      />

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
            <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200">
              Sign in
            </Button>
          </SignInButton>
        )}
      </div>
    </header>
  );
};

export default Topbar;
