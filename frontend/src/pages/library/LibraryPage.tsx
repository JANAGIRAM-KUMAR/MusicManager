import { useEffect, useState } from "react";
import { SignInButton } from "@/components/SignInButton";
import { Link } from "react-router-dom";
import { Heart, History, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SongRow } from "@/components/SongRow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";

type LibraryTab = "playlists" | "liked" | "recent" | "albums";

const tabs: { id: LibraryTab; label: string }[] = [
  { id: "playlists", label: "Playlists" },
  { id: "liked", label: "Liked Songs" },
  { id: "recent", label: "Recently played" },
  { id: "albums", label: "Albums" },
];

const LibraryPage = () => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
  const [tab, setTab] = useState<LibraryTab>("playlists");

  const playlists = useLibraryStore((state) => state.playlists);
  const likedSongs = useLibraryStore((state) => state.likedSongs);
  const recentlyPlayed = useLibraryStore((state) => state.recentlyPlayed);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);

  const albums = useMusicStore((state) => state.albums);
  const fetchAlbums = useMusicStore((state) => state.fetchAlbums);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  useEffect(() => {
    if (isSignedIn) void fetchLibrary();
    void fetchAlbums();
  }, [fetchAlbums, fetchLibrary, isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6 text-center">
        <div className="max-w-sm">
          <Heart className="mx-auto size-10 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold">Your Library</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to keep playlists, liked songs and your listening history in one place.
          </p>
          <SignInButton>
            <Button className="mt-5 rounded-full bg-white text-black hover:bg-zinc-200">
              Sign in
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const source =
    tab === "liked" ? likedSongs : tab === "recent" ? recentlyPlayed : [];
  const listPlaying = source.some((song) => song._id === currentSong?._id);

  return (
    <div className="min-h-full bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pb-16">
      <div className="px-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your Library</h1>
          <Link
            to="/search"
            className="flex items-center gap-2 rounded-full glass-pill px-4 py-2 text-sm font-semibold text-white transition hover:text-white"
          >
            <Plus className="size-4" />
            Find music
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95",
                tab === item.id
                  ? "bg-white text-black shadow-md font-bold"
                  : "glass-pill text-zinc-300 hover:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "playlists" && (
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <Link
                to="/liked"
                className="group rounded-2xl p-3 glass-card hover:bg-white/10 transition-all duration-300 block"
              >
                <div className="mb-3 grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 shadow-lg border border-white/10">
                  <Heart className="size-10 fill-white text-white drop-shadow-md" />
                </div>
                <p className="truncate font-semibold text-white text-xs sm:text-sm">Liked Songs</p>
                <p className="mt-1 text-[11px] sm:text-xs text-zinc-400">Playlist · {likedSongs.length} songs</p>
              </Link>

              {playlists.map((playlist) => (
                <MediaCard
                  key={playlist._id}
                  title={playlist.title}
                  subtitle={`Playlist · ${playlist.songs?.length ?? 0} songs`}
                  imageUrl={playlist.imageUrl}
                  href={`/playlist/${playlist._id}`}
                />
              ))}
            </div>

            {playlists.length === 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                No playlists yet. Use the plus button in the sidebar to create your first one.
              </p>
            )}
          </div>
        )}

        {(tab === "liked" || tab === "recent") && (
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-4">
              <Button
                disabled={source.length === 0}
                onClick={() => {
                  if (listPlaying) togglePlay();
                  else playSongs(source, 0);
                }}
                size="icon"
                className="size-12 rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
                aria-label="Play"
              >
                {listPlaying && isPlaying ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <Play className="size-5 translate-x-px fill-current" />
                )}
              </Button>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <History className="size-4" />
                {source.length} songs
              </div>
            </div>

            {source.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
                {tab === "liked"
                  ? "Like songs to see them here."
                  : "Songs you play will show up here."}
              </p>
            ) : (
              <div className="space-y-0.5">
                {source.map((song, index) => (
                  <SongRow
                    key={song._id}
                    song={song}
                    index={index}
                    isActive={currentSong?._id === song._id}
                    isPlaying={isPlaying}
                    onPlay={() => playSongs(source, index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "albums" && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => (
              <MediaCard
                key={album._id}
                title={album.title}
                subtitle={album.artist}
                imageUrl={album.imageUrl}
                href={`/albums/${album._id}`}
              />
            ))}
          </div>
        )}
      </div>

      {tab === "playlists" && playlists.length > 0 && (
        <div className="mt-8 px-4 sm:px-6">
          <h2 className="mb-3 text-lg font-bold">Recently played</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentlyPlayed.slice(0, 8).map((song, index) => (
              <div key={`recent-${song._id}`} className="w-[150px] shrink-0">
                <button
                  type="button"
                  onClick={() => playSongs(recentlyPlayed, index)}
                  className="group w-full rounded-lg p-2 text-left transition hover:bg-white/10"
                >
                  <CoverImage
                    src={song.imageUrl}
                    alt={song.title}
                    fallbackLabel={song.title}
                    className="mb-2 aspect-square w-full rounded-md"
                  />
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="truncate text-xs text-zinc-400">{song.artist}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
