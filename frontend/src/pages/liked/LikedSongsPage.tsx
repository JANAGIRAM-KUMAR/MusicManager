import { useEffect } from "react";
import { SignInButton } from "@/components/SignInButton";
import { Heart, Pause, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongRow } from "@/components/SongRow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTotalDuration } from "@/lib/format";

const LikedSongsPage = () => {
  const isSignedIn = Boolean(useAuthStore((state) => state.user));
  const likedSongs = useLibraryStore((state) => state.likedSongs);
  const fetchLikedSongs = useLibraryStore((state) => state.fetchLikedSongs);
  const toggleLike = useLibraryStore((state) => state.toggleLike);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  useEffect(() => {
    if (isSignedIn) void fetchLikedSongs();
  }, [fetchLikedSongs, isSignedIn]);

  const totalDuration = likedSongs.reduce((sum, song) => sum + song.duration, 0);
  const playlistPlaying = likedSongs.some((song) => song._id === currentSong?._id);

  if (!isSignedIn) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6 text-center">
        <div className="max-w-sm">
          <Heart className="mx-auto size-10 text-emerald-400" />
          <h1 className="mt-4 text-2xl font-bold">Liked Songs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to save songs and build your personal collection.
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

  return (
    <div className="min-h-full bg-gradient-to-b from-indigo-500/25 via-transparent to-transparent pb-16">
      <header className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-end sm:text-left">
        <div className="grid size-44 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 shadow-2xl border border-white/10 sm:size-52">
          <Heart className="size-16 fill-white text-white drop-shadow-md" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase text-zinc-400">Playlist</p>
          <h1 className="mt-2 text-4xl leading-none font-black tracking-tight sm:text-6xl text-white">
            Liked Songs
          </h1>
          <p className="mt-4 text-sm text-zinc-300">
            {likedSongs.length} songs · {formatTotalDuration(totalDuration)}
          </p>
        </div>
      </header>

      <div className="flex items-center gap-4 px-6 pb-4">
        <Button
          disabled={likedSongs.length === 0}
          onClick={() => {
            if (playlistPlaying) togglePlay();
            else playSongs(likedSongs, 0);
          }}
          size="icon"
          className="size-14 rounded-full bg-emerald-500 text-black shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
          aria-label={playlistPlaying && isPlaying ? "Pause liked songs" : "Play liked songs"}
        >
          {playlistPlaying && isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-px fill-current" />
          )}
        </Button>
        <button
          type="button"
          aria-label="Shuffle liked songs"
          disabled={likedSongs.length === 0}
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (likedSongs.length > 0) {
              playSongs(likedSongs, Math.floor(Math.random() * likedSongs.length));
            }
          }}
          className="glass-pill p-3 rounded-full text-zinc-300 hover:text-white disabled:opacity-40"
        >
          <Shuffle className="size-5" />
        </button>
      </div>

      <div className="px-4 sm:px-6">
        {likedSongs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-400">
            Songs you like will appear here. Tap the heart on any song to save it.
          </div>
        ) : (
          <div className="space-y-0.5">
            {likedSongs.map((song, index) => (
              <SongRow
                key={song._id}
                song={song}
                index={index}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onPlay={() => playSongs(likedSongs, index)}
                onRemove={() => void toggleLike(song)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongsPage;
