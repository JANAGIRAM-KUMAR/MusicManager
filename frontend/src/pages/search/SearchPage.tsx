import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Play, Search as SearchIcon } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SongRow } from "@/components/SongRow";
import { useBrowseStore } from "@/stores/useBrowseStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);

  const search = useBrowseStore((state) => state.search);
  const results = useBrowseStore((state) => state.results);
  const isSearching = useBrowseStore((state) => state.isSearching);
  const artists = useBrowseStore((state) => state.artists);
  const fetchArtists = useBrowseStore((state) => state.fetchArtists);

  const albums = useMusicStore((state) => state.albums);
  const fetchAlbums = useMusicStore((state) => state.fetchAlbums);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const playSong = usePlayerStore((state) => state.playSong);

  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = input.trim();
      if (trimmed === urlQuery) return;
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(handle);
  }, [input, searchParams, setSearchParams, urlQuery]);

  useEffect(() => {
    void search(urlQuery);
  }, [search, urlQuery]);

  useEffect(() => {
    void fetchArtists();
    void fetchAlbums();
  }, [fetchAlbums, fetchArtists]);

  const hasQuery = urlQuery.trim().length > 0;
  const topResult = results.songs[0] ?? null;
  const topArtist = results.artists[0] ?? null;

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-900 pb-10">
      <div className="px-4 pt-5 sm:px-6">
        <div className="relative mx-auto mb-6 max-w-2xl">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Artists, songs, or albums"
            className="h-12 w-full rounded-full border border-transparent bg-zinc-800 pr-4 pl-12 text-sm text-white placeholder:text-zinc-400 focus:border-white/40 focus:outline-none"
          />
        </div>

        {!hasQuery ? (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-bold">Browse artists</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {artists.map((artist) => (
                  <MediaCard
                    key={artist.name}
                    title={artist.name}
                    subtitle={`${artist.songCount} songs`}
                    imageUrl={artist.imageUrl}
                    href={`/artist/${encodeURIComponent(artist.name)}`}
                    round
                    className="w-[150px] shrink-0 sm:w-[170px]"
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold">Browse albums</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {albums.map((album) => (
                  <MediaCard
                    key={album._id}
                    title={album.title}
                    subtitle={album.artist}
                    imageUrl={album.imageUrl}
                    href={`/albums/${album._id}`}
                    onPlay={album.songs.length ? () => playSongs(album.songs) : undefined}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : isSearching ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Loader2 className="size-8 animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="space-y-8">
            {(topResult || topArtist) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {topResult && (
                  <div className="rounded-lg bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-bold">Top result</h2>
                    <button
                      type="button"
                      onClick={() => playSong(topResult)}
                      className="group flex w-full items-center gap-4 text-left"
                    >
                      <div className="relative">
                        <CoverImage
                          src={topResult.imageUrl}
                          alt={topResult.title}
                          fallbackLabel={topResult.title}
                          className="size-24 rounded-lg shadow-lg sm:size-28"
                        />
                        <span className="absolute right-1 bottom-1 grid size-10 place-items-center rounded-full bg-emerald-500 text-black opacity-0 shadow-lg transition group-hover:opacity-100">
                          <Play className="size-4 fill-current" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xl font-bold sm:text-2xl">{topResult.title}</p>
                        <p className="mt-1 truncate text-sm text-zinc-400">
                          Song · {topResult.artist}
                        </p>
                      </div>
                    </button>
                  </div>
                )}
                {topArtist && (
                  <div className="rounded-lg bg-white/5 p-4">
                    <h2 className="mb-3 text-lg font-bold">Artist</h2>
                    <Link
                      to={`/artist/${encodeURIComponent(topArtist.name)}`}
                      className="flex items-center gap-4"
                    >
                      <CoverImage
                        src={topArtist.imageUrl}
                        alt={topArtist.name}
                        fallbackLabel={topArtist.name}
                        className="size-24 rounded-full shadow-lg sm:size-28"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xl font-bold sm:text-2xl">{topArtist.name}</p>
                        <p className="mt-1 text-sm text-zinc-400">
                          Artist · {topArtist.songCount} songs
                        </p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {results.songs.length > 0 && (
              <section>
                <h2 className="mb-2 text-lg font-bold">Songs</h2>
                <div className="space-y-0.5">
                  {results.songs.slice(0, 10).map((song, index) => (
                    <SongRow
                      key={song._id}
                      song={song}
                      index={index}
                      isActive={currentSong?._id === song._id}
                      isPlaying={isPlaying}
                      onPlay={() => playSongs(results.songs, index)}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.artists.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold">Artists</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {results.artists.map((artist) => (
                    <MediaCard
                      key={artist.name}
                      title={artist.name}
                      subtitle={`${artist.songCount} songs`}
                      imageUrl={artist.imageUrl}
                      href={`/artist/${encodeURIComponent(artist.name)}`}
                      round
                      className="w-[150px] shrink-0"
                    />
                  ))}
                </div>
              </section>
            )}

            {results.albums.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold">Albums</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.albums.map((album) => (
                    <MediaCard
                      key={album._id}
                      title={album.title}
                      subtitle={album.artist}
                      imageUrl={album.imageUrl}
                      href={`/albums/${album._id}`}
                      onPlay={album.songs.length ? () => playSongs(album.songs) : undefined}
                    />
                  ))}
                </div>
              </section>
            )}

            {!isSearching &&
              results.songs.length === 0 &&
              results.albums.length === 0 &&
              results.artists.length === 0 && (
                <div className="grid min-h-[30vh] place-items-center text-center text-zinc-400">
                  <div>
                    <p className="text-lg font-semibold text-white">No results found</p>
                    <p className="mt-1 text-sm">Try a different artist, album or song name.</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
