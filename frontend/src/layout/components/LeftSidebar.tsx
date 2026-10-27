import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AudioLines,
  Heart,
  Home,
  History,
  Library,
  Plus,
  Search,
} from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Search", to: "/search", icon: Search },
];

const LeftSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const playlists = useLibraryStore((state) => state.playlists);
  const likedSongs = useLibraryStore((state) => state.likedSongIds);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void fetchLibrary();
  }, [fetchLibrary]);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const playlist = await createPlaylist(trimmed, description.trim());
    setTitle("");
    setDescription("");
    setDialogOpen(false);
    if (playlist) navigate(`/playlist/${playlist._id}`);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <nav className="rounded-lg bg-zinc-900 p-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <AudioLines className="size-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-tight text-white">Soundwave</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-4 rounded-md px-3 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-white",
                active && "text-white"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section className="flex min-h-0 flex-1 flex-col rounded-lg bg-zinc-900 p-2">
        <div className="flex items-center justify-between px-2 py-2">
          <Link
            to="/library"
            className="flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
          >
            <Library className="size-5" />
            Your Library
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Create playlist"
                className="grid size-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <Plus className="size-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create playlist</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Give your new playlist a name and an optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCreate();
                  }}
                  placeholder="Playlist name"
                  className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                />
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Description (optional)"
                  className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                />
              </div>
              <DialogFooter>
                <Button
                  className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
                  onClick={() => void handleCreate()}
                  disabled={!title.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 px-1 pb-3">
            <Link
              to="/liked"
              className={cn(
                "flex items-center gap-3 rounded-md p-2 transition hover:bg-white/10",
                location.pathname === "/liked" && "bg-white/5"
              )}
            >
              <div className="grid size-12 shrink-0 place-items-center rounded bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400">
                <Heart className="size-5 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">Liked Songs</p>
                <p className="truncate text-xs text-zinc-400">
                  Playlist · {likedSongs.length} songs
                </p>
              </div>
            </Link>

            <Link
              to="/library"
              className="flex items-center gap-3 rounded-md p-2 transition hover:bg-white/10"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded bg-zinc-800 text-zinc-300">
                <History className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">Recently played</p>
                <p className="truncate text-xs text-zinc-400">History</p>
              </div>
            </Link>

            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/playlist/${playlist._id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md p-2 transition hover:bg-white/10",
                  location.pathname === `/playlist/${playlist._id}` && "bg-white/5"
                )}
              >
                <CoverImage
                  src={playlist.imageUrl}
                  alt={playlist.title}
                  fallbackLabel={playlist.title}
                  className="size-12 shrink-0 rounded"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{playlist.title}</p>
                  <p className="truncate text-xs text-zinc-400">
                    Playlist · {playlist.songs?.length ?? 0} songs
                  </p>
                </div>
              </Link>
            ))}

            {playlists.length === 0 && (
              <p className="px-2 py-4 text-xs leading-relaxed text-zinc-500">
                Create your first playlist with the plus button. It only takes a moment.
              </p>
            )}
          </div>
        </ScrollArea>
      </section>
    </div>
  );
};

export default LeftSidebar;
