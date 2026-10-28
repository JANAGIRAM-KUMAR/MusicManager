import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Compass,
  Flame,
  History,
  Loader2,
  Music,
  Pause,
  Play,
  Search as SearchIcon,
  TrendingUp,
  X,
} from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { MediaCard } from "@/components/MediaCard";
import { SongRow } from "@/components/SongRow";
import { useBrowseStore } from "@/stores/useBrowseStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { cn } from "@/lib/utils";

const GRADIENT_PALETTES = [
  "from-emerald-700 via-teal-800 to-zinc-950",
  "from-purple-700 via-indigo-800 to-zinc-950",
  "from-amber-600 via-orange-700 to-zinc-950",
  "from-cyan-600 via-blue-800 to-zinc-950",
  "from-rose-600 via-red-800 to-zinc-950",
  "from-fuchsia-600 via-pink-700 to-zinc-950",
  "from-lime-600 via-emerald-800 to-zinc-950",
  "from-violet-600 via-purple-900 to-zinc-950",
  "from-sky-600 via-indigo-900 to-zinc-950",
  "from-teal-600 via-cyan-900 to-zinc-950",
];

const RECENT_SEARCHES_KEY = "spotify_recent_searches";

type SearchFilter = "all" | "songs" | "artists" | "albums";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const search = useBrowseStore((state) => state.search);
  const results = useBrowseStore((state) => state.results);
  const isSearching = useBrowseStore((state) => state.isSearching);
  const artists = useBrowseStore((state) => state.artists);
  const fetchArtists = useBrowseStore((state) => state.fetchArtists);

  const albums = useMusicStore((state) => state.albums);
  const fetchAlbums = useMusicStore((state) => state.fetchAlbums);
  const featuredSongs = useMusicStore((state) => state.featuredSongs);
  const fetchFeaturedSongs = useMusicStore((state) => state.fetchFeaturedSongs);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playSongs = usePlayerStore((state) => state.playSongs);
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === urlQuery) return;
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (trimmed) {
        next.set("q", trimmed);
        saveRecentSearch(trimmed);
      } else {
        next.delete("q");
      }
      setSearchParams(next, { replace: true });
    }, 250);

    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    void search(urlQuery);
  }, [search, urlQuery]);

  useEffect(() => {
    void fetchArtists();
    void fetchAlbums();
    void fetchFeaturedSongs();
  }, [fetchAlbums, fetchArtists, fetchFeaturedSongs]);

  // Dynamically compute trending tags strictly from the actual database
  const trendingTags = useMemo(() => {
    const tags: string[] = [];
    artists.forEach((a) => {
      if (a.name && !tags.includes(a.name)) {
        tags.push(a.name);
      }
    });
    albums.forEach((al) => {
      if (al.title && !tags.includes(al.title)) {
        tags.push(al.title);
      }
    });
    featuredSongs.forEach((s) => {
      if (s.title && !tags.includes(s.title)) {
        tags.push(s.title);
      }
    });
    return tags.slice(0, 8);
  }, [artists, albums, featuredSongs]);

  const hasQuery = urlQuery.trim().length > 0;
  const topResult = results.songs[0] ?? null;
  const topArtist = results.artists[0] ?? null;

  const handleClear = () => {
    setInput("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleSelectQuery = (term: string) => {
    setInput(term);
    saveRecentSearch(term);
    const next = new URLSearchParams(searchParams);
    next.set("q", term);
    setSearchParams(next);
  };

  const isTopResultPlaying = topResult && currentSong?._id === topResult._id && isPlaying;

  const handleTopResultPlay = () => {
    if (!topResult) return;
    if (currentSong?._id === topResult._id) {
      togglePlay();
    } else {
      playSong(topResult);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 pb-20 text-white">
      {/* Sticky Hero Search Bar */}
      <div className="sticky top-0 z-20 bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="What do you want to play? (Search your artists, songs, or albums)"
              className="h-12 w-full rounded-full border border-white/10 bg-zinc-800/90 pr-12 pl-12 text-sm sm:text-base text-white placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
            />
            {input && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Real Dynamic Trending Tags from User's Music Catalog */}
          {trendingTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-zinc-400 no-scrollbar">
              <span className="flex items-center gap-1 shrink-0 font-medium text-emerald-400 pr-1">
                <TrendingUp className="size-3.5" />
                Popular:
              </span>
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectQuery(tag)}
                  className="shrink-0 rounded-full bg-zinc-800/80 px-3 py-1 hover:bg-zinc-700 hover:text-white transition border border-white/5 truncate max-w-[200px]"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Filter Pills when searching */}
          {hasQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition shrink-0",
                  activeFilter === "all"
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("songs")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition shrink-0",
                  activeFilter === "songs"
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                )}
              >
                Songs ({results.songs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("artists")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition shrink-0",
                  activeFilter === "artists"
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                )}
              >
                Artists ({results.artists.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("albums")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition shrink-0",
                  activeFilter === "albums"
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                )}
              >
                Albums ({results.albums.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-6 sm:px-6 max-w-7xl mx-auto space-y-10">
        {!hasQuery ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold text-zinc-200">
                    <History className="size-4 text-emerald-400" />
                    Recent Searches
                  </h2>
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="group flex items-center gap-1.5 rounded-full bg-zinc-800/90 pl-3.5 pr-2 py-1.5 text-xs text-zinc-200 border border-white/5 hover:border-white/20 transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectQuery(term)}
                        className="hover:text-emerald-400 transition"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        aria-label={`Remove ${term}`}
                        className="rounded-full p-0.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dynamic Spotify Bento Grid (Real Albums & Artists in the App) */}
            {(albums.length > 0 || artists.length > 0) && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <Compass className="size-6 text-emerald-400" />
                      Browse Catalog
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      Explore albums and artists currently available in your library
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {/* Real Albums Bento Cards */}
                  {albums.map((album, idx) => (
                    <Link
                      key={album._id}
                      to={`/albums/${album._id}`}
                      className={cn(
                        "group relative h-32 sm:h-36 overflow-hidden rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/50 select-none bg-gradient-to-br block",
                        GRADIENT_PALETTES[idx % GRADIENT_PALETTES.length]
                      )}
                    >
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between">
                          <span className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-snug drop-shadow-md line-clamp-2 pr-12">
                            {album.title}
                          </span>
                          <span className="rounded-full bg-black/40 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 shrink-0">
                            Album
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-white/80 truncate pr-12">
                          {album.artist}
                        </span>
                      </div>

                      {/* 3D Rotated Real Album Cover Artwork */}
                      <div className="pointer-events-none absolute -bottom-3 -right-3 size-16 sm:size-20 transform rotate-[25deg] transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-110 shadow-2xl rounded-md overflow-hidden border border-white/10">
                        <img
                          src={album.imageUrl}
                          alt={album.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}

                  {/* Real Artists Bento Cards */}
                  {artists.map((artist, idx) => (
                    <button
                      key={artist.name}
                      type="button"
                      onClick={() => handleSelectQuery(artist.name)}
                      className={cn(
                        "group relative h-32 sm:h-36 overflow-hidden rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/50 select-none bg-gradient-to-br text-left w-full",
                        GRADIENT_PALETTES[(idx + albums.length) % GRADIENT_PALETTES.length]
                      )}
                    >
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between">
                          <span className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-snug drop-shadow-md line-clamp-2 pr-12">
                            {artist.name}
                          </span>
                          <span className="rounded-full bg-black/40 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 shrink-0">
                            Artist
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-white/80 truncate pr-12">
                          {artist.songCount} {artist.songCount === 1 ? "track" : "tracks"}
                        </span>
                      </div>

                      {/* 3D Rotated Real Artist Avatar Artwork */}
                      <div className="pointer-events-none absolute -bottom-3 -right-3 size-16 sm:size-20 transform rotate-[25deg] transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-110 shadow-2xl rounded-full overflow-hidden border border-white/10">
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Real Popular Artists Carousel */}
            {artists.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Flame className="size-5 text-amber-400" />
                    Artists in Library
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
                  {artists.map((artist) => (
                    <MediaCard
                      key={artist.name}
                      title={artist.name}
                      subtitle={`${artist.songCount} ${artist.songCount === 1 ? "song" : "songs"}`}
                      imageUrl={artist.imageUrl}
                      href={`/artist/${encodeURIComponent(artist.name)}`}
                      round
                      className="w-[140px] shrink-0 sm:w-[160px] bg-zinc-900/60 hover:bg-zinc-800/80 p-3 rounded-xl transition border border-white/5"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Real Featured Songs Quick Play */}
            {featuredSongs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Music className="size-5 text-emerald-400" />
                    Quick Picks
                  </h2>
                </div>
                <div className="space-y-1 rounded-2xl bg-zinc-900/40 p-4 border border-white/5">
                  {featuredSongs.map((song, index) => (
                    <SongRow
                      key={song._id}
                      song={song}
                      index={index}
                      isActive={currentSong?._id === song._id}
                      isPlaying={isPlaying && currentSong?._id === song._id}
                      onPlay={() => playSongs(featuredSongs, index)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : isSearching ? (
          <div className="grid min-h-[45vh] place-items-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-9 animate-spin text-emerald-400" />
              <p className="text-sm text-zinc-400 font-medium">Searching music catalog...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* "All" Filter View */}
            {activeFilter === "all" && (
              <>
                {(topResult || topArtist) && (
                  <div className="grid gap-4 lg:grid-cols-12 items-stretch">
                    {/* Spotify Top Result Card */}
                    {topResult && (
                      <div className="lg:col-span-5 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800/80 p-5 border border-white/5 transition-all group relative flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              Top Result
                            </span>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-start gap-4">
                            <CoverImage
                              src={topResult.imageUrl}
                              alt={topResult.title}
                              fallbackLabel={topResult.title}
                              className="size-24 sm:size-32 rounded-xl shadow-2xl shrink-0 group-hover:scale-[1.02] transition"
                            />
                            <div className="min-w-0">
                              <h3 className="truncate text-xl sm:text-2xl font-black text-white tracking-tight">
                                {topResult.title}
                              </h3>
                              <p className="mt-1 text-sm text-zinc-400 flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-zinc-300">Song</span>
                                <span>•</span>
                                <Link
                                  to={`/artist/${encodeURIComponent(topResult.artist)}`}
                                  className="hover:underline hover:text-white transition"
                                >
                                  {topResult.artist}
                                </Link>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Floating Play/Pause Button */}
                        <div className="mt-4 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={handleTopResultPlay}
                            aria-label={isTopResultPlaying ? "Pause song" : "Play song"}
                            className={cn(
                              "size-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 hover:bg-emerald-400 transition-all duration-300",
                              isTopResultPlaying ? "opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                            )}
                          >
                            {isTopResultPlaying ? (
                              <Pause className="size-5 fill-black" />
                            ) : (
                              <Play className="size-5 fill-black ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Top Songs List Preview */}
                    {results.songs.length > 0 && (
                      <div className="lg:col-span-7 rounded-2xl bg-zinc-800/30 p-5 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-bold text-white">Songs</h2>
                          {results.songs.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setActiveFilter("songs")}
                              className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition"
                            >
                              See all ({results.songs.length})
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {results.songs.slice(0, 4).map((song, index) => (
                            <SongRow
                              key={song._id}
                              song={song}
                              index={index}
                              isActive={currentSong?._id === song._id}
                              isPlaying={isPlaying && currentSong?._id === song._id}
                              onPlay={() => playSongs(results.songs, index)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Artists Spotlight */}
                {results.artists.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Artists</h2>
                      {results.artists.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("artists")}
                          className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {results.artists.map((artist) => (
                        <MediaCard
                          key={artist.name}
                          title={artist.name}
                          subtitle={`${artist.songCount} ${artist.songCount === 1 ? "song" : "songs"}`}
                          imageUrl={artist.imageUrl}
                          href={`/artist/${encodeURIComponent(artist.name)}`}
                          round
                          className="w-[140px] shrink-0 sm:w-[160px] bg-zinc-900/60 hover:bg-zinc-800/80 p-3 rounded-xl transition border border-white/5"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Albums Grid */}
                {results.albums.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Albums</h2>
                      {results.albums.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter("albums")}
                          className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition"
                        >
                          See all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {results.albums.map((album) => (
                        <MediaCard
                          key={album._id}
                          title={album.title}
                          subtitle={album.artist}
                          imageUrl={album.imageUrl}
                          href={`/albums/${album._id}`}
                          onPlay={album.songs.length ? () => playSongs(album.songs) : undefined}
                          className="bg-zinc-900/60 hover:bg-zinc-800/80 p-3 rounded-xl transition border border-white/5"
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* "Songs" Only Filter */}
            {activeFilter === "songs" && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Songs ({results.songs.length})
                </h2>
                <div className="space-y-1 rounded-2xl bg-zinc-900/40 p-4 border border-white/5">
                  {results.songs.map((song, index) => (
                    <SongRow
                      key={song._id}
                      song={song}
                      index={index}
                      isActive={currentSong?._id === song._id}
                      isPlaying={isPlaying && currentSong?._id === song._id}
                      onPlay={() => playSongs(results.songs, index)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* "Artists" Only Filter */}
            {activeFilter === "artists" && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Artists ({results.artists.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {results.artists.map((artist) => (
                    <MediaCard
                      key={artist.name}
                      title={artist.name}
                      subtitle={`${artist.songCount} ${artist.songCount === 1 ? "song" : "songs"}`}
                      imageUrl={artist.imageUrl}
                      href={`/artist/${encodeURIComponent(artist.name)}`}
                      round
                      className="bg-zinc-900/60 hover:bg-zinc-800/80 p-4 rounded-xl transition border border-white/5"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* "Albums" Only Filter */}
            {activeFilter === "albums" && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Albums ({results.albums.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {results.albums.map((album) => (
                    <MediaCard
                      key={album._id}
                      title={album.title}
                      subtitle={album.artist}
                      imageUrl={album.imageUrl}
                      href={`/albums/${album._id}`}
                      onPlay={album.songs.length ? () => playSongs(album.songs) : undefined}
                      className="bg-zinc-900/60 hover:bg-zinc-800/80 p-4 rounded-xl transition border border-white/5"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!isSearching &&
              results.songs.length === 0 &&
              results.albums.length === 0 &&
              results.artists.length === 0 && (
                <div className="grid min-h-[40vh] place-items-center text-center px-4">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto size-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <SearchIcon className="size-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        No results found for &ldquo;{urlQuery}&rdquo;
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        Please check your spelling or try searching for another artist, song, or album in your library.
                      </p>
                    </div>
                    {trendingTags.length > 0 && (
                      <div className="pt-2 flex flex-wrap justify-center gap-2">
                        {trendingTags.slice(0, 4).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleSelectQuery(tag)}
                            className="rounded-full bg-zinc-800 px-3.5 py-1 text-xs font-medium text-emerald-400 hover:bg-zinc-700 transition"
                          >
                            Try &ldquo;{tag}&rdquo;
                          </button>
                        ))}
                      </div>
                    )}
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
