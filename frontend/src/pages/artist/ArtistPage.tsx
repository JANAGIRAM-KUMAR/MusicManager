import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Pause, Play, Shuffle } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SongRow } from "@/components/SongRow";
import { Button } from "@/components/ui/button";
import { useBrowseStore } from "@/stores/useBrowseStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatTime } from "@/lib/format";

const ArtistPage = () => {
  const { artistName } = useParams();
  const name = artistName ? decodeURIComponent(artistName) : "";

  const artistDetail = useBrowseStore((state) => state.artistDetail);
  const fetchArtist = useBrowseStore((state) => state.fetchArtist);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [missingName, setMissingName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchArtist(name).then((detail) => {
      if (cancelled) return;
      setLoadedName(name);
      setMissingName(detail ? null : name);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchArtist, name]);

  const loading = loadedName !== name;

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-52 animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  if (missingName === name || !artistDetail) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-6 text-center text-zinc-400">
        <div>
          <p className="text-lg font-semibold text-white">Artist not found</p>
          <Link to="/search" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
            Search for something else
          </Link>
        </div>
      </div>
    );
  }

  const { artist, songs, albums } = artistDetail;
  const popularSongs = songs.slice(0, 5);
  const artistPlaying = songs.some((song) => song._id === currentSong?._id);

  return (
    <div className="min-h-full bg-gradient-to-b from-teal-600/20 via-transparent to-transparent pb-6 sm:pb-0">
      <header className="relative flex min-h-[280px] flex-col items-center justify-end gap-6 overflow-hidden p-6 text-center sm:flex-row sm:items-end sm:text-left">
        <CoverImage
          src={artist.imageUrl}
          alt={artist.name}
          fallbackLabel={artist.name}
          className="size-40 shrink-0 rounded-full shadow-2xl border-2 border-white/10 sm:size-52"
          iconClassName="size-10"
        />
        <div className="min-w-0">
          <p className="flex items-center justify-center gap-1 text-xs font-semibold tracking-wide uppercase sm:justify-start">
            <BadgeCheck className="size-4 fill-sky-400 text-sky-950" />
            Verified artist
          </p>
          <h1 className="mt-2 text-4xl leading-none font-black tracking-tight break-words sm:text-6xl lg:text-7xl text-white">
            {artist.name}
          </h1>
          <p className="mt-4 text-sm text-zinc-300">
            {artist.songCount} songs · {artist.albumCount} albums ·{" "}
            {formatTime(artist.duration)} of music
          </p>
        </div>
      </header>

      <div className="flex items-center gap-4 px-6 pb-4">
        <Button
          disabled={songs.length === 0}
          onClick={() => {
            if (artistPlaying) togglePlay();
            else playSongs(songs, 0);
          }}
          size="icon"
          className="size-14 rounded-full bg-emerald-500 text-black shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
          aria-label={artistPlaying && isPlaying ? "Pause artist" : "Play artist"}
        >
          {artistPlaying && isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 translate-x-px fill-current" />
          )}
        </Button>
        <button
          type="button"
          aria-label="Shuffle artist"
          disabled={songs.length === 0}
          onClick={() => {
            if (!shuffle) toggleShuffle();
            if (songs.length > 0) {
              playSongs(songs, Math.floor(Math.random() * songs.length));
            }
          }}
          className="glass-pill p-3 rounded-full text-zinc-300 hover:text-white disabled:opacity-40"
        >
          <Shuffle className="size-6" />
        </button>
      </div>

      <div className="space-y-8 px-4 sm:px-6">
        <section>
          <h2 className="mb-3 text-xl font-bold">Popular</h2>
          <div className="space-y-0.5">
            {popularSongs.map((song, index) => (
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
        </section>

        {albums.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">Discography</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {albums.map((album) => (
                <MediaCard
                  key={album._id}
                  title={album.title}
                  subtitle={album.releaseDate?.split("-")[0] ?? album.artist}
                  imageUrl={album.imageUrl}
                  href={`/albums/${album._id}`}
                  className="w-[160px] shrink-0 sm:w-[180px]"
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xl font-bold">All songs</h2>
          <div className="space-y-0.5">
            {songs.map((song, index) => (
              <SongRow
                key={`all-${song._id}`}
                song={song}
                index={index}
                isActive={currentSong?._id === song._id}
                isPlaying={isPlaying}
                onPlay={() => playSongs(songs, index)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistPage;
