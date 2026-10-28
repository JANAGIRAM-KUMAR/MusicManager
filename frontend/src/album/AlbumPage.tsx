import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock3, Pause, Play, Shuffle } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTotalDuration } from "@/lib/format";

const AlbumPage = () => {
  const { albumId } = useParams();
  const fetchAlbumById = useMusicStore((state) => state.fetchAlbumById);
  const currentAlbum = useMusicStore((state) => state.currentAlbum);
  const isLoading = useMusicStore((state) => state.isLoading);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  useEffect(() => {
    if (albumId) void fetchAlbumById(albumId);
  }, [albumId, fetchAlbumById]);

  if (isLoading && !currentAlbum) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-52 animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  if (!currentAlbum) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-6 text-center text-zinc-400">
        <div>
          <p className="text-lg font-semibold text-white">Album not found</p>
          <Link to="/" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const songs = currentAlbum.songs;
  const totalDuration = songs.reduce((sum, song) => sum + song.duration, 0);
  const albumPlaying = songs.some((song) => song._id === currentSong?._id);

  const handlePlay = () => {
    const playable = songs?.filter((song: any) => song && song.songUrl) || [];
    if (playable.length === 0) return;
    if (albumPlaying) {
      togglePlay();
    } else {
      playSongs(playable, 0);
    }
  };

  const handleShuffle = () => {
    if (!shuffle) toggleShuffle();
    playSongs(songs, Math.floor(Math.random() * songs.length));
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent pb-6 sm:pb-0">
      <header className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-end sm:text-left">
        <CoverImage
          src={currentAlbum.imageUrl}
          alt={currentAlbum.title}
          fallbackLabel={currentAlbum.title}
          className="size-44 shrink-0 rounded-2xl shadow-2xl border border-white/10 sm:size-52"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase text-zinc-400">Album</p>
          <h1 className="mt-2 text-4xl leading-none font-black tracking-tight text-white sm:text-6xl">
            {currentAlbum.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-300 sm:justify-start">
            <Link
              to={`/artist/${encodeURIComponent(currentAlbum.artist)}`}
              className="font-semibold text-white hover:underline"
            >
              {currentAlbum.artist}
            </Link>
            <span>•</span>
            <span>{currentAlbum.releaseDate?.split("-")[0] ?? "—"}</span>
            <span>•</span>
            <span>{songs.length} songs</span>
            <span>•</span>
            <span>{formatTotalDuration(totalDuration)}</span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4 px-6 pb-4">
        <Button
          disabled={(songs?.filter((song: any) => song && song.songUrl) || []).length === 0}
          onClick={handlePlay}
          size="icon"
          className="size-14 rounded-full bg-emerald-500 text-black shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
          aria-label={albumPlaying && isPlaying ? "Pause album" : "Play album"}
        >
          {albumPlaying && isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-px fill-current" />
          )}
        </Button>
        <button
          type="button"
          aria-label="Shuffle play album"
          disabled={(songs?.filter((song: any) => song && song.songUrl) || []).length === 0}
          onClick={handleShuffle}
          className="glass-pill p-3 rounded-full text-zinc-300 hover:text-white disabled:opacity-40"
        >
          <Shuffle className="size-5" />
        </button>
      </div>

      <div className="px-4 sm:px-6">
        <div className="mb-2 hidden grid-cols-[2rem_4fr_2fr_auto] items-center gap-3 border-b border-white/10 px-2 pb-2 text-xs text-zinc-400 sm:grid">
          <span className="text-center">#</span>
          <span>Title</span>
          <span>Album</span>
          <span className="flex justify-end pr-12">
            <Clock3 className="size-4" />
          </span>
        </div>
        <div className="space-y-0.5">
          {songs.map((song, index) => (
            <SongRow
              key={song._id}
              song={song}
              index={index}
              isActive={currentSong?._id === song._id}
              isPlaying={isPlaying}
              onPlay={() => playSongs(songs, index)}
            />
          ))}
        </div>
        {songs.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">This album is empty.</p>
        )}
      </div>
    </div>
  );
};

export default AlbumPage;
